import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateTelegramInviteLink } from '@/lib/notifications/telegram';

async function sendAdminAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.warn('[AdminAlert] Failed to send Telegram alert:', err);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Session & Auth Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
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
      recordEnrollment = true,
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
    const inviteResult = await generateTelegramInviteLink(telegramChatId, expireHours, name);

    if (!inviteResult.success || !inviteResult.inviteLink) {
      return NextResponse.json(
        { error: inviteResult.error || 'Failed to generate Telegram invite link' },
        { status: 500 }
      );
    }

    // 5. Optionally Record Enrollment in Database
    let enrolled = false;
    if (recordEnrollment) {
      try {
        // Get or create student
        let studentId: string;
        const studentEmail = email ? email.toLowerCase().trim() : `direct_${Date.now()}@manual.com`;

        const { data: student, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('email', studentEmail)
          .maybeSingle();

        if (studentError) {
          console.error('[Manual Invite API] Student lookup failed:', studentError);
        }

        if (!student) {
          const { data: newStudent, error: insertStudentError } = await supabaseAdmin
            .from('students')
            .insert([
              {
                name: name || 'Student',
                email: studentEmail,
                phone: phone || null,
              },
            ])
            .select('id')
            .single();

          if (insertStudentError) throw insertStudentError;
          studentId = newStudent.id;
        } else {
          studentId = student.id;
        }

        // Check for existing enrollment
        const { data: existingEnrollment } = await supabaseAdmin
          .from('enrollments')
          .select('id, telegram_invite_link')
          .eq('student_id', studentId)
          .eq('cohort_id', resolvedCohortId)
          .maybeSingle();

        let enrollmentId: string;

        if (!existingEnrollment) {
          // Create new enrollment
          const { data: newEnrollment, error: enrollError } = await supabaseAdmin
            .from('enrollments')
            .insert([
              {
                student_id: studentId,
                cohort_id: resolvedCohortId,
                status: 'active',
                telegram_invite_link: inviteResult.inviteLink,
                telegram_joined: false,
              },
            ])
            .select('id')
            .single();

          if (enrollError) throw enrollError;
          enrollmentId = newEnrollment.id;
          enrolled = true;

          // Log manual invite creation
          await supabaseAdmin.from('telegram_invite_logs').insert([
            {
              enrollment_id: enrollmentId,
              action: 'created',
              invite_link: inviteResult.inviteLink,
              created_by: user.email || 'admin',
              payload: { info: 'Manual invite generated by admin' },
            },
          ]);

          // Record manual payment
          const { error: payError } = await supabaseAdmin.from('payments').insert([
            {
              student_id: studentId,
              enrollment_id: enrollmentId,
              amount: amount, // in paise
              status: 'paid',
              razorpay_payment_id: `DIRECT_manual_${Date.now()}`,
            },
          ]);
          if (payError) {
            console.error('[Manual Invite API] Payment insert failed:', payError);
          }
        } else {
          enrollmentId = existingEnrollment.id;
          // Update the existing enrollment with the new invite link and reset join status
          const { error: dbError } = await supabaseAdmin
            .from('enrollments')
            .update({
              telegram_invite_link: inviteResult.inviteLink,
              telegram_joined: false,
            })
            .eq('id', enrollmentId);

          if (dbError) {
            console.error('[Manual Invite API] DB update failed:', dbError);
          } else {
            enrolled = true;
            // Log manual invite regeneration
            await supabaseAdmin.from('telegram_invite_logs').insert([
              {
                enrollment_id: enrollmentId,
                action: 'regenerated',
                invite_link: inviteResult.inviteLink,
                created_by: user.email || 'admin',
                payload: {
                  old_invite_link: existingEnrollment.telegram_invite_link,
                  info: 'Manual invite regenerated/updated by admin',
                },
              },
            ]);
          }
        }
      } catch (dbErr: any) {
        console.error('[Manual Invite API] Database recording failed:', dbErr);
      }
    }

    // 6. Send Telegram Admin Notification Alert
    try {
      const amountFormatted = amount ? `₹${(amount / 100).toLocaleString('en-IN')}` : 'N/A';
      const now = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const alertMsg = `➕ <b>Manual Enrollment Added!</b>\n\n👤 ${name}\n📧 ${email || 'N/A'}\n📱 ${phone || 'N/A'}\n💳 ${amountFormatted}\n🎓 ${cohortTitle}\n\n🔗 Invite Link: ${inviteResult.inviteLink}\n⏰ ${now}`;

      await sendAdminAlert(alertMsg);
    } catch (alertErr) {
      console.warn('[Manual Invite API] Admin alert notification failed:', alertErr);
    }

    return NextResponse.json({
      success: true,
      inviteLink: inviteResult.inviteLink,
      enrolled,
      cohortTitle,
      telegramChatId,
    });
  } catch (error: any) {
    console.error('[Manual Invite API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
