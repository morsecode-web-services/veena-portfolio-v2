import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateTelegramInviteLink } from '@/lib/notifications/telegram';

export async function POST(request: Request) {
  try {
    // 1. Session & Auth Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse Input
    const {
      cohortId,
      customTelegramChatId,
      name,
      email,
      phone,
      amount = null,
      expireHours = 24,
      recordEnrollment = true
    } = await request.json();

    // 3. Resolve Telegram Chat ID & Cohort Title
    let telegramChatId = customTelegramChatId || null;
    let cohortTitle = 'Direct Group Access';
    let resolvedCohortId = cohortId || null;

    if (cohortId) {
      const { data: cohort, error: cohortError } = await supabaseAdmin
        .from('cohorts')
        .select('telegram_chat_id, title')
        .eq('id', cohortId)
        .single();

      if (cohortError || !cohort) {
        return NextResponse.json({ error: 'Selected cohort not found' }, { status: 404 });
      }

      telegramChatId = cohort.telegram_chat_id;
      cohortTitle = cohort.title;
    }

    if (!telegramChatId) {
      return NextResponse.json(
        { error: 'No Telegram Chat ID found for this cohort, and no custom Chat ID was provided.' },
        { status: 400 }
      );
    }

    // 4. Generate Telegram Invite Link
    const inviteResult = await generateTelegramInviteLink(telegramChatId, expireHours);

    if (!inviteResult.success || !inviteResult.inviteLink) {
      return NextResponse.json(
        { error: inviteResult.error || 'Failed to generate Telegram invite link' },
        { status: 500 }
      );
    }

    // 5. Optionally Record Enrollment in Database
    let enrolled = false;
    if (recordEnrollment) {
      // De-duplicate check: check if already enrolled in this cohort
      const { data: existingEnrollment } = await supabaseAdmin
        .from('form_submissions')
        .select('id')
        .eq('cohort_id', resolvedCohortId)
        .ilike('user_email', email)
        .eq('payment_status', 'paid')
        .maybeSingle();

      if (!existingEnrollment) {
        const { error: dbError } = await supabaseAdmin
          .from('form_submissions')
          .insert([{
            form_slug: 'direct_payment',
            user_name: name || 'Student',
            user_email: email || `direct_${Date.now()}@manual.com`,
            form_data: { name, email, phone },
            status: 'unread',
            payment_status: 'paid',
            razorpay_payment_id: `DIRECT_manual_${Date.now()}`,
            razorpay_amount: amount,
            cohort_id: resolvedCohortId,
            is_verified: true,
            telegram_invite_link: inviteResult.inviteLink,
            telegram_joined: false
          }]);

        if (dbError) {
          console.error('[Manual Invite API] DB insertion failed:', dbError);
          // Don't fail the whole request since the Telegram link was generated successfully
        } else {
          enrolled = true;
        }
      } else {
        // Update the existing submission with the new invite link and reset join status
        const { error: dbError } = await supabaseAdmin
          .from('form_submissions')
          .update({
            telegram_invite_link: inviteResult.inviteLink,
            telegram_joined: false
          })
          .eq('id', existingEnrollment.id);

        if (dbError) {
          console.error('[Manual Invite API] DB update failed:', dbError);
        } else {
          enrolled = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      inviteLink: inviteResult.inviteLink,
      enrolled,
      cohortTitle,
      telegramChatId
    });

  } catch (error: any) {
    console.error('[Manual Invite API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
