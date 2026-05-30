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

    // 2. Look up the student who was assigned this invite link
    // First, search form_submissions directly
    let { data: studentSubmission, error: subError } = await supabaseAdmin
      .from('form_submissions')
      .select('id, user_name, user_email, telegram_joined, telegram_username')
      .eq('telegram_invite_link', inviteLink)
      .maybeSingle();

    if (subError) {
      console.error('[Telegram Webhook] Error querying form_submissions:', subError);
    }

    // Fallback 1: If not found, search in historical telegram_invite_logs table (handles regenerated links)
    if (!studentSubmission) {
      const { data: logEntry, error: logErr } = await supabaseAdmin
        .from('telegram_invite_logs')
        .select('submission_id')
        .eq('invite_link', inviteLink)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logErr) {
        console.error('[Telegram Webhook] Error querying telegram_invite_logs:', logErr);
      }

      if (logEntry && logEntry.submission_id) {
        const { data: subData, error: subFetchErr } = await supabaseAdmin
          .from('form_submissions')
          .select('id, user_name, user_email, telegram_joined, telegram_username')
          .eq('id', logEntry.submission_id)
          .maybeSingle();

        if (subFetchErr) {
          console.error('[Telegram Webhook] Error fetching submission from log entry:', subFetchErr);
        }

        if (subData) {
          studentSubmission = subData;
          console.log(`[Telegram Webhook] Historical link matched to student: ${studentSubmission.user_name} via telegram_invite_logs.`);
        }
      }
    }

    // Fallback 2: If still not found, search in webhook_logs (Razorpay automated flows)
    if (!studentSubmission) {
      const { data: webhookLog, error: logError } = await supabaseAdmin
        .from('webhook_logs')
        .select('student_email, student_name, payload')
        .eq('notification_status->telegram->>link', inviteLink)
        .maybeSingle();

      if (logError) {
        console.error('[Telegram Webhook] Error querying webhook_logs:', logError);
      }

      if (webhookLog && webhookLog.student_email) {
        // Find their submission
        const { data: matchingSubmission } = await supabaseAdmin
          .from('form_submissions')
          .select('id, user_name, user_email, telegram_joined, telegram_username')
          .ilike('user_email', webhookLog.student_email)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (matchingSubmission) {
          studentSubmission = matchingSubmission;
          console.log(`[Telegram Webhook] Webhook logs matched to student: ${studentSubmission.user_name} via email mapping.`);
        }
      }
    }

    // 3. Update the student record if found
    if (studentSubmission) {
      // Idempotency check: if student is already marked as joined with this exact username, return early
      const alreadyJoined = studentSubmission.telegram_joined === true && 
                            studentSubmission.telegram_username === telegramIdentifier;

      if (alreadyJoined) {
        console.log(`[Telegram Webhook] Student ${studentSubmission.user_name} is already marked as joined with ${telegramIdentifier}. Skipping duplicate log.`);
        return NextResponse.json({ success: true, student: studentSubmission.user_name, status: 'already_joined' });
      }

      // Check if a joined event was already logged for this invite link
      const { data: existingJoinLog } = await supabaseAdmin
        .from('telegram_invite_logs')
        .select('id')
        .eq('submission_id', studentSubmission.id)
        .eq('action', 'joined')
        .eq('invite_link', inviteLink)
        .maybeSingle();

      const { error: updateError } = await supabaseAdmin
        .from('form_submissions')
        .update({
          telegram_joined: true,
          telegram_username: telegramIdentifier
        })
        .eq('id', studentSubmission.id);

      if (updateError) {
        console.error('[Telegram Webhook] Failed to update submission:', updateError);
        return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
      }

      // Log the joined event if not already logged
      if (!existingJoinLog) {
        await supabaseAdmin.from('telegram_invite_logs').insert([{
          submission_id: studentSubmission.id,
          action: 'joined',
          invite_link: inviteLink,
          telegram_username: telegramIdentifier,
          created_by: 'telegram_webhook',
          payload: { info: `User joined Telegram group via link: ${inviteLink}` }
        }]);
      }

      console.log(`[Telegram Webhook] Successfully marked student ${studentSubmission.user_name} (${studentSubmission.user_email}) as joined.`);
      return NextResponse.json({ success: true, student: studentSubmission.user_name });
    }

    // Link not found in database (e.g. link created outside the app or manual sharing of bot-created link)
    console.warn(`[Telegram Webhook] Received join for link ${inviteLink} but no matching student found.`);
    return NextResponse.json({ status: 'link_not_found_in_database' });

  } catch (error: any) {
    console.error('[Telegram Webhook] Error handling update:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
