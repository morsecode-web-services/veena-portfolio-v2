import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/twilio-whatsapp-status
 *
 * Receives WhatsApp message delivery status callbacks from Twilio.
 * Twilio sends form-encoded POST data when a message status changes.
 *
 * Key fields:
 *   - MessageSid: The Twilio message SID (matches wa_message_sid in our DB)
 *   - MessageStatus: 'queued' | 'sent' | 'delivered' | 'undelivered' | 'failed' | 'read'
 *   - ErrorCode: e.g. '63049' for Meta frequency cap rejection
 *
 * Twilio Setup:
 *   Set the StatusCallback URL on the message when sending (already done in reenroll route),
 *   OR set a global fallback in Twilio Console → Messaging → Settings → Status Callback.
 */
export async function POST(request: Request) {
  try {
    // Twilio sends form-encoded data
    const formData = await request.formData();
    const messageSid = formData.get('MessageSid') as string | null;
    const messageStatus = formData.get('MessageStatus') as string | null;
    const errorCode = formData.get('ErrorCode') as string | null;

    if (!messageSid || !messageStatus) {
      // Twilio may send intermediate status pings (e.g. 'queued', 'sending') with no SID —
      // just return 200 so Twilio doesn't retry.
      return new NextResponse('OK', { status: 200 });
    }

    // Only process terminal delivery states — ignore intermediate ones
    const isDelivered = messageStatus === 'delivered' || messageStatus === 'read';
    const isUndelivered = messageStatus === 'undelivered' || messageStatus === 'failed';

    if (!isDelivered && !isUndelivered) {
      // Intermediate status (queued, sending, sent) — acknowledge and exit
      return new NextResponse('OK', { status: 200 });
    }

    // Look up the reenrollment invitation by the stored message SID
    const { data: invitation, error: lookupError } = await supabaseAdmin
      .from('reenrollment_invitations')
      .select('id, status, email_delivery_status')
      .eq('wa_message_sid', messageSid)
      .maybeSingle();

    if (lookupError) {
      console.error('[Twilio WA Webhook] DB lookup error:', lookupError);
      // Still return 200 — Twilio retries on non-200 which we don't want
      return new NextResponse('OK', { status: 200 });
    }

    if (!invitation) {
      // May be from a non-reenrollment message (certificate, etc.) — safely ignore
      return new NextResponse('OK', { status: 200 });
    }

    // Only update if the invitation is still in 'sent' state (don't override 'paid')
    if (invitation.status !== 'sent') {
      return new NextResponse('OK', { status: 200 });
    }

    const updatePayload: any = {
      wa_delivery_status: isDelivered ? 'delivered' : 'undelivered',
      updated_at: new Date().toISOString(),
    };

    if (isUndelivered) {
      // ONLY set status to 'wa_failed' if the email was not successfully delivered
      if (invitation.email_delivery_status !== 'delivered') {
        updatePayload.status = 'wa_failed';
        updatePayload.error_message = `WA undelivered${errorCode ? ` (Error ${errorCode})` : ''}`;
        console.log(
          `[Twilio WA Webhook] Message ${messageSid} undelivered. Marking invitation ${invitation.id} as wa_failed.`
        );
      } else {
        updatePayload.error_message = `WA undelivered${errorCode ? ` (Error ${errorCode})` : ''} (Email delivered)`;
        console.log(
          `[Twilio WA Webhook] Message ${messageSid} undelivered, but Email was already delivered. Keeping invitation ${invitation.id} in sent status.`
        );
      }
    } else {
      console.log(
        `[Twilio WA Webhook] Message ${messageSid} delivered. Updating invitation ${invitation.id} wa_delivery_status=delivered.`
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('reenrollment_invitations')
      .update(updatePayload)
      .eq('id', invitation.id);

    if (updateError) {
      console.error('[Twilio WA Webhook] Failed to update invitation:', updateError);
    }

    // Always return 200 to Twilio — non-200 causes automatic retries
    return new NextResponse('OK', { status: 200 });
  } catch (err: any) {
    console.error('[Twilio WA Webhook] Unexpected error:', err);
    // Return 200 to avoid Twilio retry storms
    return new NextResponse('OK', { status: 200 });
  }
}
