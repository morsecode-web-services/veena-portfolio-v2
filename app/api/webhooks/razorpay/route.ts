import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateTelegramInviteLink } from '@/lib/notifications/telegram';
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp';
import CohortWelcome from '@/emails/CohortWelcome';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendCohortWelcomeEmail(email: string, name: string, inviteLink: string, cohortTitle: string = 'Cohort') {
  const resend = getResend();
  if (!resend) return { error: 'RESEND_API_KEY not configured' };

  try {
    const html = await render(CohortWelcome({ name, inviteLink }));

    return resend.emails.send({
      from: 'Aishwarya Manikarnike <official@email.aishwaryamanikarnike.com>',
      to: email,
      subject: `🎉 Welcome to ${cohortTitle}! Your Access Link`,
      html,
      replyTo: 'official@aishwaryamanikarnike.com',
    });
  } catch (err: any) {
    return { error: `Render/Send failed: ${err.message}` };
  }
}

// ─────────────────────────────────────────────
// Main webhook handler
// ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // ── Signature Verification ──────────────────────────────────────────
    const skipSignature =
      process.env.NODE_ENV !== 'production' &&
      process.env.SKIP_WEBHOOK_SIGNATURE === 'true';

    if (!skipSignature) {
      if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
        console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
      }

      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      console.warn('[Webhook] ⚠️  Signature verification SKIPPED (dev mode)');
    }

    // ── Parse Event ─────────────────────────────────────────────────────
    const event = JSON.parse(body);
    console.log(`[Webhook] Received event: ${event.event}`);

    // ── Handle Payment Events ───────────────────────────────────────────
    if (event.event === 'subscription.charged' || event.event === 'order.paid') {
      const isSubscription = event.event === 'subscription.charged';
      
      // Defensive extraction: Check both payload locations
      const entity = isSubscription
        ? event.payload.subscription?.entity
        : (event.payload.order?.entity || event.payload.payment?.entity);

      if (!entity) {
        throw new Error(`[Webhook] Critical error: Could not extract entity for ${event.event}`);
      }

      const paymentEntity = event.payload.payment?.entity || (isSubscription ? null : entity);
      const notes = entity.notes || paymentEntity?.notes || {};

      const subId = isSubscription ? entity.id : null;
      const orderId = !isSubscription ? (event.payload.order?.entity?.id || paymentEntity?.order_id) : null;
      const paymentId = paymentEntity?.id || null;
      const customerId = isSubscription ? entity.customer_id : paymentEntity?.customer_id || null;

      const studentName = notes.name || 'Student';
      const studentEmail = notes.email || paymentEntity?.email || null;
      const studentPhone = notes.phone || paymentEntity?.contact || null;
      const cohortId = notes.cohortId || null;
      let telegramChatId = notes.telegram_chat_id || null;
      let cohortTitle = 'Cohort';

      // ── Fetch Cohort Settings from DB ─────────────────────────────────
      // This is the "dynamic configuration" part. We prioritize the DB ID
      // over the manual ID in notes to prevent errors.
      if (cohortId) {
        const { data: cohort } = await supabaseAdmin
          .from('cohorts')
          .select('telegram_chat_id, title')
          .eq('id', cohortId)
          .single();
        
        if (cohort?.telegram_chat_id) {
          telegramChatId = cohort.telegram_chat_id;
          cohortTitle = cohort.title;
          console.log(`[Webhook] Using Telegram Chat ID from database for cohort: ${cohortTitle}`);
        }
      }

      // ── Fetch Global Automation Settings ──────────────────────────────
      const { data: configData } = await supabaseAdmin
        .from('site_config')
        .select('data')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();
      
      const automation = configData?.data?.automation || {
        email_enabled: true,
        whatsapp_enabled: false,
        telegram_enabled: true
      };

      // ── Supabase: Upsert Record ───────────────────────────────────────
      const query = supabaseAdmin.from('form_submissions').select('id');
      if (isSubscription) {
        query.eq('razorpay_subscription_id', subId);
      } else {
        query.eq('razorpay_order_id', orderId);
      }

      const { data: existingSubmissions, error: fetchError } = await query;

      if (!existingSubmissions || existingSubmissions.length === 0) {
        console.log(`[Webhook] Orphaned ${isSubscription ? 'subscription' : 'order'} detected (${subId || orderId}). Reconstructing...`);
        const fallbackData = {
          form_slug: notes.formSlug || 'payment_fallback',
          user_name: studentName,
          user_email: studentEmail,
          form_data: {
            name: studentName,
            email: studentEmail,
            phone: studentPhone,
            _note: `Reconstructed via Webhook (${event.event}) due to client-side drop-off.`,
          },
          status: 'unread',
          payment_status: 'paid',
          razorpay_subscription_id: subId,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_customer_id: customerId,
          cohort_id: notes.cohortId || null,
          is_verified: true,
        };

        await supabaseAdmin.from('form_submissions').insert([fallbackData]);
      } else {
        const updateData: Record<string, any> = { payment_status: 'paid', is_verified: true };
        if (paymentId) updateData.razorpay_payment_id = paymentId;

        const updateQuery = supabaseAdmin.from('form_submissions').update(updateData);
        if (isSubscription) {
          updateQuery.eq('razorpay_subscription_id', subId);
        } else {
          updateQuery.eq('razorpay_order_id', orderId);
        }
        await updateQuery;
      }

      // ── Notifications ─────────────────────────────────────────────────
      const telegramPromise = (telegramChatId && automation.telegram_enabled)
        ? generateTelegramInviteLink(telegramChatId)
        : Promise.resolve<import('@/lib/notifications/telegram').TelegramInviteResult>({
            success: false,
            error: !automation.telegram_enabled ? 'Telegram invites disabled in settings' : 'telegram_chat_id not set in notes',
          });

      const telegramResult = await telegramPromise;

      let emailStatus: any = { status: automation.email_enabled ? 'pending' : 'disabled' };
      let whatsappStatus: any = { status: automation.whatsapp_enabled ? 'pending' : 'disabled' };

      if (telegramResult.success && telegramResult.inviteLink) {
        const inviteLink = telegramResult.inviteLink;

        const [emailResult, whatsappResult] = await Promise.allSettled([
          (studentEmail && automation.email_enabled)
            ? sendCohortWelcomeEmail(studentEmail, studentName, inviteLink, cohortTitle)
            : Promise.reject(new Error(automation.email_enabled ? 'No student email' : 'Email disabled in settings')),

          (studentPhone && automation.whatsapp_enabled)
            ? sendWhatsAppNotification(studentPhone, studentName, inviteLink)
            : Promise.reject(new Error(automation.whatsapp_enabled ? 'No student phone' : 'WhatsApp disabled in settings')),
        ]);

        // Process Email Result
        if (emailResult.status === 'fulfilled') {
          const val = emailResult.value as any;
          emailStatus = val.error 
            ? { status: 'failed', error: val.error } 
            : { status: 'success', message_id: val.data?.id };
        } else {
          const isActuallyDisabled = !automation.email_enabled;
          emailStatus = { 
            status: isActuallyDisabled ? 'disabled' : 'failed', 
            error: isActuallyDisabled ? 'Disabled in settings' : emailResult.reason?.message 
          };
        }

        // Process WhatsApp Result
        if (whatsappResult.status === 'fulfilled') {
          const val = whatsappResult.value as any;
          whatsappStatus = val.success 
            ? { status: 'success', message_id: val.messageId } 
            : { status: 'failed', error: val.error };
        } else {
          const isActuallyDisabled = !automation.whatsapp_enabled;
          whatsappStatus = { 
            status: isActuallyDisabled ? 'disabled' : 'failed', 
            error: isActuallyDisabled ? 'Disabled in settings' : whatsappResult.reason?.message 
          };
        }
      }

      // ── Final Status Calculation ─────────────────────────────────────
      const isEmailOk = !automation.email_enabled || emailStatus.status === 'success';
      const isWhatsappOk = !automation.whatsapp_enabled || whatsappStatus.status === 'success';
      const isTelegramOk = !automation.telegram_enabled || telegramResult.success;

      const finalStatus = (isEmailOk && isWhatsappOk && isTelegramOk) ? 'success' : 'partial_success';

      // ── Log Webhook Execution ─────────────────────────────────────────
      await supabaseAdmin.from('webhook_logs').insert([{
        event_id: event.id,
        event_type: event.event,
        payload: event,
        student_email: studentEmail,
        student_name: studentName,
        status: finalStatus,
        error_message: telegramResult.error || null,
        notification_status: {
          telegram: { 
            status: automation.telegram_enabled ? (telegramResult.success ? 'success' : 'failed') : 'disabled', 
            error: telegramResult.error,
            link: telegramResult.inviteLink 
          },
          email: emailStatus,
          whatsapp: whatsappStatus
        }
      }]);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Webhook] Unhandled error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
