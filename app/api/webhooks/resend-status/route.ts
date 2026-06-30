import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/resend-status
 *
 * Receives email status callbacks from Resend.
 *
 * Payload format:
 * {
 *   "type": "email.delivered" | "email.bounced" | "email.complained",
 *   "created_at": "2026-06-30T13:02:00.000Z",
 *   "data": {
 *     "email_id": "re_1234567890",
 *     "from": "sender@domain.com",
 *     "to": ["recipient@domain.com"],
 *     "subject": "Email Subject",
 *     "created_at": "2026-06-30T13:02:00.000Z"
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const eventType = payload.type;
    const emailId = payload.data?.email_id;

    if (!eventType || !emailId) {
      console.warn('[Resend Webhook] Missing type or email_id in payload');
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Only process terminal delivery states
    const isDelivered = eventType === 'email.delivered';
    const isFailed =
      eventType === 'email.bounced' ||
      eventType === 'email.complained' ||
      eventType === 'email.failed';

    if (!isDelivered && !isFailed) {
      // Ignore other events (clicked, opened, etc.)
      return new NextResponse('OK', { status: 200 });
    }

    // Look up the reenrollment invitation by the stored email message ID
    const { data: invitation, error: lookupError } = await supabaseAdmin
      .from('reenrollment_invitations')
      .select('id, status, wa_delivery_status')
      .eq('email_message_id', emailId)
      .maybeSingle();

    if (lookupError) {
      console.error('[Resend Webhook] DB lookup error:', lookupError);
      return new NextResponse('Internal DB Error', { status: 500 });
    }

    if (!invitation) {
      // Safe exit (could be a regular non-reenrollment email)
      return new NextResponse('OK', { status: 200 });
    }

    // Only update if invitation is still in 'sent' state (don't clobber 'paid')
    if (invitation.status !== 'sent') {
      return new NextResponse('OK', { status: 200 });
    }

    const updatePayload: any = {
      email_delivery_status: isDelivered
        ? 'delivered'
        : eventType === 'email.bounced'
          ? 'bounced'
          : eventType === 'email.complained'
            ? 'complained'
            : 'undelivered', // 'email.failed' maps to undelivered
      updated_at: new Date().toISOString(),
    };

    if (isFailed) {
      // ONLY set status to 'email_failed' if the WhatsApp invite was not successfully delivered
      if (invitation.wa_delivery_status !== 'delivered') {
        updatePayload.status = 'email_failed';
        updatePayload.error_message = `Email failed: ${
          eventType === 'email.bounced'
            ? 'Bounced'
            : eventType === 'email.complained'
              ? 'Spam complaint'
              : 'Delivery failed'
        }`;
        console.log(
          `[Resend Webhook] Email ${emailId} failed (${eventType}). Marking invitation ${invitation.id} as email_failed.`
        );
      } else {
        updatePayload.error_message = `Email failed (${eventType}) (WhatsApp delivered)`;
        console.log(
          `[Resend Webhook] Email ${emailId} failed (${eventType}), but WhatsApp was already delivered. Keeping invitation ${invitation.id} in sent status.`
        );
      }
    } else {
      console.log(
        `[Resend Webhook] Email ${emailId} delivered. Updating invitation ${invitation.id} email_delivery_status=delivered.`
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('reenrollment_invitations')
      .update(updatePayload)
      .eq('id', invitation.id);

    if (updateError) {
      console.error('[Resend Webhook] Failed to update invitation:', updateError);
      return new NextResponse('DB Update Error', { status: 500 });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (err: any) {
    console.error('[Resend Webhook] Unexpected error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
