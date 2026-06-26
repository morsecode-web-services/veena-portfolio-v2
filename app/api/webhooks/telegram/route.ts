import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    // 0. Verify secret token in URL query parameter (for webhook security)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token || token !== process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await request.json();

    // 1. Verify this is a chat_member update with invite link info
    const chatMember = update.chat_member;
    if (!chatMember) {
      // Return 200 OK for other update types so Telegram stops sending them
      return NextResponse.json({ status: 'ignored_not_chat_member' });
    }

    const inviteLinkObject = chatMember.invite_link;
    if (!inviteLinkObject || !inviteLinkObject.invite_link) {
      return NextResponse.json({ status: 'ignored_no_invite_link' });
    }

    // Only process when a user joins the group (transitioning to member/administrator)
    const newStatus = chatMember.new_chat_member?.status;
    const oldStatus = chatMember.old_chat_member?.status;

    if (newStatus !== 'member' && newStatus !== 'administrator') {
      return NextResponse.json({ status: 'ignored_not_joining', newStatus });
    }

    const inviteLink = inviteLinkObject.invite_link.trim();
    const newUser = chatMember.new_chat_member?.user;

    let username = newUser?.username ? `@${newUser.username}` : '';
    const displayName = [newUser?.first_name, newUser?.last_name].filter(Boolean).join(' ');
    const telegramIdentifier = username || displayName || 'Telegram User';

    console.log(`[Telegram Webhook] User joined via link: ${inviteLink} (${telegramIdentifier})`);

    // 2. Look up the student / enrollment who was assigned this invite link
    let enrollment: any = null;
    let studentSubmission: any = null;

    // A. Query enrollments by inviteLink first (new schema source of truth)
    const { data: enrollData, error: enrollErr } = await supabaseAdmin
      .from('enrollments')
      .select(
        'id, student_id, cohort_id, telegram_joined, telegram_username, telegram_display_name, telegram_invite_link, students(name, email)'
      )
      .eq('telegram_invite_link', inviteLink)
      .maybeSingle();

    if (enrollErr) {
      console.error('[Telegram Webhook] Error querying enrollments:', enrollErr);
    }

    if (enrollData) {
      enrollment = enrollData;
    }

    // B. Query form_submissions by inviteLink (legacy schema fallback)
    if (!enrollment) {
      const { data: subData, error: subError } = await supabaseAdmin
        .from('form_submissions')
        .select(
          'id, user_name, user_email, cohort_id, telegram_joined, telegram_username, telegram_display_name, telegram_invite_link'
        )
        .eq('telegram_invite_link', inviteLink)
        .maybeSingle();

      if (subError) {
        console.error('[Telegram Webhook] Error querying form_submissions:', subError);
      }

      if (subData) {
        studentSubmission = subData;
      }
    }

    // Fallback 1: Historical telegram_invite_logs table (handles regenerated/reminded links)
    if (!enrollment && !studentSubmission) {
      const { data: logEntry, error: logErr } = await supabaseAdmin
        .from('telegram_invite_logs')
        .select('submission_id, enrollment_id')
        .eq('invite_link', inviteLink)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logErr) {
        console.error('[Telegram Webhook] Error querying telegram_invite_logs:', logErr);
      }

      if (logEntry) {
        if (logEntry.enrollment_id) {
          const { data: enrollData } = await supabaseAdmin
            .from('enrollments')
            .select(
              'id, student_id, cohort_id, telegram_joined, telegram_username, telegram_display_name, telegram_invite_link, students(name, email)'
            )
            .eq('id', logEntry.enrollment_id)
            .maybeSingle();
          if (enrollData) {
            enrollment = enrollData;
          }
        }
        if (!enrollment && logEntry.submission_id) {
          const { data: subData } = await supabaseAdmin
            .from('form_submissions')
            .select(
              'id, user_name, user_email, cohort_id, telegram_joined, telegram_username, telegram_display_name, telegram_invite_link'
            )
            .eq('id', logEntry.submission_id)
            .maybeSingle();
          if (subData) {
            studentSubmission = subData;
          }
        }
      }
    }

    // Fallback 2: Search in webhook_logs (Razorpay automated flows)
    if (!enrollment && !studentSubmission) {
      const { data: webhookLog, error: logError } = await supabaseAdmin
        .from('webhook_logs')
        .select('student_email, student_name, payload')
        .eq('notification_status->telegram->>link', inviteLink)
        .maybeSingle();

      if (logError) {
        console.error('[Telegram Webhook] Error querying webhook_logs:', logError);
      }

      if (webhookLog && webhookLog.student_email) {
        // Search students table first to resolve the enrollment
        const { data: studentProfile } = await supabaseAdmin
          .from('students')
          .select('id')
          .ilike('email', webhookLog.student_email)
          .maybeSingle();

        if (studentProfile) {
          const cohortId =
            webhookLog.payload?.payload?.order?.entity?.notes?.cohortId ||
            webhookLog.payload?.payload?.payment_link?.entity?.notes?.cohortId;

          let enrollQuery = supabaseAdmin
            .from('enrollments')
            .select(
              'id, student_id, cohort_id, telegram_joined, telegram_username, telegram_display_name, telegram_invite_link, students(name, email)'
            )
            .eq('student_id', studentProfile.id);

          if (cohortId) {
            enrollQuery = enrollQuery.eq('cohort_id', cohortId);
          }

          const { data: enrollData } = await enrollQuery
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (enrollData) {
            enrollment = enrollData;
          }
        }

        // Also resolve matching submission for log tracking
        const { data: matchingSubmission } = await supabaseAdmin
          .from('form_submissions')
          .select(
            'id, user_name, user_email, cohort_id, telegram_joined, telegram_username, telegram_display_name, telegram_invite_link'
          )
          .ilike('user_email', webhookLog.student_email)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (matchingSubmission) {
          studentSubmission = matchingSubmission;
        }
      }
    }

    // Inter-link enrollment and submission if one was resolved but not the other
    if (enrollment && !studentSubmission) {
      const studentEmail = (enrollment.students as any)?.email;
      if (studentEmail) {
        const { data: subData } = await supabaseAdmin
          .from('form_submissions')
          .select(
            'id, user_name, user_email, cohort_id, telegram_joined, telegram_username, telegram_display_name, telegram_invite_link'
          )
          .ilike('user_email', studentEmail)
          .eq('cohort_id', enrollment.cohort_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (subData) {
          studentSubmission = subData;
        }
      }
    } else if (studentSubmission && !enrollment) {
      if (studentSubmission.user_email) {
        const { data: studentProfile } = await supabaseAdmin
          .from('students')
          .select('id')
          .ilike('email', studentSubmission.user_email)
          .maybeSingle();

        if (studentProfile) {
          const { data: enrollData } = await supabaseAdmin
            .from('enrollments')
            .select(
              'id, student_id, cohort_id, telegram_joined, telegram_username, telegram_display_name, telegram_invite_link, students(name, email)'
            )
            .eq('student_id', studentProfile.id)
            .eq('cohort_id', studentSubmission.cohort_id)
            .maybeSingle();
          if (enrollData) {
            enrollment = enrollData;
          }
        }
      }
    }

    // 3. Update the records if found
    if (enrollment || studentSubmission) {
      const studentName = enrollment?.students?.name || studentSubmission?.user_name || 'Student';
      const studentEmail = enrollment?.students?.email || studentSubmission?.user_email || '';

      // Idempotency check: if already marked as joined with this username, skip
      const alreadyJoined =
        (enrollment &&
          enrollment.telegram_joined === true &&
          enrollment.telegram_username === telegramIdentifier) ||
        (!enrollment &&
          studentSubmission &&
          studentSubmission.telegram_joined === true &&
          studentSubmission.telegram_username === telegramIdentifier);

      if (alreadyJoined) {
        console.log(
          `[Telegram Webhook] Student ${studentName} is already marked as joined with ${telegramIdentifier}. Skipping duplicate log.`
        );
        return NextResponse.json({ success: true, student: studentName, status: 'already_joined' });
      }

      // Update enrollment table if present (source of truth)
      if (enrollment) {
        const { error: updateEnrollError } = await supabaseAdmin
          .from('enrollments')
          .update({
            telegram_joined: true,
            telegram_username: username || null,
            telegram_display_name: displayName || null,
          })
          .eq('id', enrollment.id);

        if (updateEnrollError) {
          console.error('[Telegram Webhook] Failed to update enrollment:', updateEnrollError);
          return NextResponse.json(
            { error: 'Failed to update enrollment record' },
            { status: 500 }
          );
        }
      }

      // Update form_submissions table if present (backward compatibility)
      if (studentSubmission) {
        const { error: updateSubError } = await supabaseAdmin
          .from('form_submissions')
          .update({
            telegram_joined: true,
            telegram_username: username || null,
            telegram_display_name: displayName || null,
          })
          .eq('id', studentSubmission.id);

        if (updateSubError) {
          console.error('[Telegram Webhook] Failed to update submission:', updateSubError);
        }
      }

      // Log the joined event if not already logged
      const logQuery = supabaseAdmin
        .from('telegram_invite_logs')
        .select('id')
        .eq('action', 'joined')
        .eq('invite_link', inviteLink);

      if (enrollment) {
        logQuery.eq('enrollment_id', enrollment.id);
      } else if (studentSubmission) {
        logQuery.eq('submission_id', studentSubmission.id);
      }

      const { data: existingJoinLog } = await logQuery.maybeSingle();

      if (!existingJoinLog) {
        await supabaseAdmin.from('telegram_invite_logs').insert([
          {
            submission_id: studentSubmission?.id || null,
            enrollment_id: enrollment?.id || null,
            action: 'joined',
            invite_link: inviteLink,
            telegram_username: telegramIdentifier,
            created_by: 'telegram_webhook',
            payload: { info: `User joined Telegram group via link: ${inviteLink}` },
          },
        ]);

        // Push the raw event payload to global webhook_logs table
        await supabaseAdmin.from('webhook_logs').insert([
          {
            event_id: update.update_id ? `tg_upd_${update.update_id}` : `tg_join_${Date.now()}`,
            event_type: 'telegram.join',
            student_name: studentName,
            student_email: studentEmail,
            status: 'success',
            payload: update,
          },
        ]);
      }

      console.log(
        `[Telegram Webhook] Successfully marked student ${studentName} (${studentEmail}) as joined.`
      );
      return NextResponse.json({ success: true, student: studentName });
    }

    // Link not found in database (e.g. link created outside the app or manual sharing of bot-created link)
    console.warn(
      `[Telegram Webhook] Received join for link ${inviteLink} but no matching student found.`
    );
    return NextResponse.json({ status: 'link_not_found_in_database' });
  } catch (error: any) {
    console.error('[Telegram Webhook] Error handling update:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
