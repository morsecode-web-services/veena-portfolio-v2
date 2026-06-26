import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateTelegramInviteLink } from '@/lib/notifications/telegram';
import { sendCohortWelcomeEmail } from '@/lib/notifications/email';

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
    const { submissionId, expireHours = 168 } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
    }

    // 3. Fetch Enrollment Details and Cohort Info
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('cohort_id, telegram_invite_link, students(name, email)')
      .eq('id', submissionId)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (!enrollment.cohort_id) {
      return NextResponse.json({ error: 'No cohort assigned to this enrollment' }, { status: 400 });
    }

    const studentData = enrollment.students as any;
    const studentName = studentData?.name || 'Student';
    const studentEmail = studentData?.email;

    if (!studentEmail) {
      return NextResponse.json(
        { error: 'Student has no email address configured' },
        { status: 400 }
      );
    }

    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select('telegram_chat_id, title')
      .eq('id', enrollment.cohort_id)
      .single();

    if (cohortError || !cohort || !cohort.telegram_chat_id) {
      return NextResponse.json(
        { error: 'Cohort Telegram Chat ID not configured' },
        { status: 400 }
      );
    }

    // 4. Generate A Fresh Telegram Invite Link (Ensures it is active for 1 week)
    const inviteResult = await generateTelegramInviteLink(
      cohort.telegram_chat_id,
      expireHours,
      studentName
    );

    if (!inviteResult.success || !inviteResult.inviteLink) {
      return NextResponse.json(
        { error: inviteResult.error || 'Failed to generate Telegram invite link' },
        { status: 500 }
      );
    }

    // 5. Send Reminder Email via Resend
    const emailResult = await sendCohortWelcomeEmail(
      studentEmail,
      studentName,
      inviteResult.inviteLink,
      cohort.title || 'Cohort',
      true
    );

    if ((emailResult as any).error) {
      return NextResponse.json(
        { error: (emailResult as any).error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // 6. Update Database Record
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({
        telegram_invite_link: inviteResult.inviteLink,
        telegram_joined: false,
      })
      .eq('id', submissionId);

    if (updateError) {
      throw updateError;
    }

    // 7. Log reminder in telegram_invite_logs
    await supabaseAdmin.from('telegram_invite_logs').insert([
      {
        enrollment_id: submissionId,
        action: 'reminded',
        invite_link: inviteResult.inviteLink,
        created_by: user.email || 'admin',
        payload: {
          old_invite_link: enrollment.telegram_invite_link,
          info: 'Email reminder sent to student',
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      inviteLink: inviteResult.inviteLink,
    });
  } catch (error: any) {
    console.error('[Remind Email API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
