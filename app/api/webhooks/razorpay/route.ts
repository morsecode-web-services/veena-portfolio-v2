import { NextResponse, unstable_after as after } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateTelegramInviteLink } from '@/lib/notifications/telegram';
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp';
import { sendTwilioWhatsApp } from '@/lib/notifications/twilio';
import { sendCohortWelcomeEmail } from '@/lib/notifications/email';

// ─────────────────────────────────────────────
// Admin Telegram Alert (fire-and-forget)
// ─────────────────────────────────────────────

async function sendAdminAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // silently skip if not configured
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch (err) {
    // Never block the main webhook flow
    console.warn('[AdminAlert] Failed to send Telegram alert:', err);
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
      process.env.NODE_ENV !== 'production' && process.env.SKIP_WEBHOOK_SIGNATURE === 'true';

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
    let event: any;
    try {
      event = JSON.parse(body);
    } catch (e) {
      console.error('[Webhook] JSON parse error:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // ── Event Routing ─────────────────────────────────────────────────
    const validEvents = ['order.paid', 'payment_link.paid', 'payment.failed'];

    // Razorpay fires several events per payment (e.g. payment.captured + order.paid).
    // Acknowledge unhandled events immediately — no log row, no processing.
    if (!validEvents.includes(event.event)) {
      console.log(`[Webhook] Ignoring unhandled event: ${event.event}`);
      return NextResponse.json({ status: 'ignored' });
    }

    // Schedule all processing to run in the background after returning the response
    after(async () => {
      // ── Create Initial Log Entry (Fail-Safe) ──────────────────────────
      let logId: string | null = null;
      try {
        const { data: initialLog } = await supabaseAdmin
          .from('webhook_logs')
          .insert([
            {
              // Razorpay doesn't include a top-level event id in payloads.
              // We'll update this to the payment_id once extracted (more stable than Date.now()).
              event_id: `pending_${Date.now()}`,
              event_type: event.event,
              payload: event,
              status: 'pending',
            },
          ])
          .select()
          .single();
        logId = initialLog?.id || null;
      } catch (logErr) {
        console.error('[Webhook] Failed to create initial log:', logErr);
      }

      try {
        // ── Handle Payment Failed Event ─────────────────────────────────────
        if (event.event === 'payment.failed') {
          const paymentEntity = event.payload?.payment?.entity;
          const errorDesc =
            paymentEntity?.error_description || paymentEntity?.error_code || 'Unknown reason';
          const errorSource = paymentEntity?.error_source || '';
          const method = paymentEntity?.method || 'unknown';
          const amountPaise = paymentEntity?.amount || 0;
          const amountFormatted = amountPaise
            ? `₹${(amountPaise / 100).toLocaleString('en-IN')}`
            : 'N/A';
          const notes = paymentEntity?.notes || {};
          const studentName = notes.studentName || notes.name || paymentEntity?.email || 'Unknown';
          const studentEmail = notes.studentEmail || notes.email || paymentEntity?.email || 'N/A';
          const studentPhone = notes.studentPhone || notes.phone || paymentEntity?.contact || 'N/A';
          const cohortTitle = notes.cohortTitle || notes.cohort || 'Unknown Cohort';
          const paymentId = paymentEntity?.id || 'N/A';
          const now = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });

          const alertMsg =
            `❌ <b>Payment Failed</b>\n\n` +
            `👤 ${studentName}\n` +
            `📧 ${studentEmail}\n` +
            `📱 ${studentPhone}\n` +
            `💳 ${amountFormatted} via ${method}\n` +
            `🎓 ${cohortTitle}\n` +
            `🆔 ${paymentId}\n` +
            `⚠️ ${errorDesc}${errorSource ? ` (${errorSource})` : ''}\n` +
            `⏰ ${now}`;

          await sendAdminAlert(alertMsg);

          if (logId) {
            await supabaseAdmin
              .from('webhook_logs')
              .update({
                event_id: paymentId,
                status: 'failed',
                student_email: studentEmail !== 'N/A' ? studentEmail : null,
                student_name: studentName !== 'Unknown' ? studentName : null,
                error_message: errorDesc,
              })
              .eq('id', logId);
          }
          return;
        }

        // ── Handle Payment Events ───────────────────────────────────────────
        if (['order.paid', 'payment_link.paid'].includes(event.event)) {
          const isPaymentLink = event.event === 'payment_link.paid';

          // 1. Extract the primary entity (Order or Payment Link)
          const mainEntity = isPaymentLink
            ? event.payload.payment_link?.entity
            : event.payload.order?.entity;

          // 2. Extract the payment entity (always present on success)
          const paymentEntity = event.payload.payment?.entity;

          if (!mainEntity || !paymentEntity) {
            throw new Error(`Missing entity in ${event.event} payload`);
          }

          // 3. Extract Metadata (Notes)
          // For Payment Links, notes are on the payment_link entity
          // For Orders, notes are on the order entity
          const notes = mainEntity.notes || paymentEntity.notes || {};

          const orderId = !isPaymentLink ? mainEntity.id : null;
          const paymentLinkId = isPaymentLink ? mainEntity.id : null;
          const paymentId = paymentEntity.id;
          const customerId = paymentEntity.customer_id || null;

          const studentName = notes.studentName || notes.name || 'Student';
          let studentEmail = notes.studentEmail || notes.email || paymentEntity?.email || null;
          const studentPhone = notes.studentPhone || notes.phone || paymentEntity?.contact || null;
          let telegramChatId = notes.telegram_chat_id || null;
          let cohortTitle = 'Cohort';
          let finalCohortId = notes.cohortId || null;

          // If email is still missing, try to find the student by phone number in our DB
          if (!studentEmail && studentPhone) {
            try {
              const { data: student } = await supabaseAdmin
                .from('form_submissions')
                .select('user_email')
                .eq('form_data->>phone', studentPhone)
                .single();
              if (student?.user_email) studentEmail = student.user_email;
            } catch (lookupErr) {
              console.warn('[Webhook] Could not resolve email by phone:', lookupErr);
            }
          }

          // ── Fetch Cohort Settings from DB ─────────────────────────────────
          if (finalCohortId) {
            const { data: cohort } = await supabaseAdmin
              .from('cohorts')
              .select('telegram_chat_id, title')
              .eq('id', finalCohortId)
              .single();

            if (cohort?.telegram_chat_id) {
              telegramChatId = cohort.telegram_chat_id;
              cohortTitle = cohort.title;
            }
          } else if (telegramChatId) {
            // Reverse lookup: Find cohort by Telegram ID
            const { data: cohort } = await supabaseAdmin
              .from('cohorts')
              .select('id, title')
              .eq('telegram_chat_id', telegramChatId)
              .limit(1)
              .single();

            if (cohort) {
              finalCohortId = cohort.id;
              cohortTitle = cohort.title;
            }
          }

          // ── Idempotency Check ──────────────────────────────────────────────
          // Razorpay retries webhooks on timeout or non-2xx. Both the original
          // and retry carry the same payment_id. If we've already processed
          // this payment, skip all notifications and mark the log as duplicate.
          if (logId) {
            await supabaseAdmin
              .from('webhook_logs')
              .update({ event_id: paymentId })
              .eq('id', logId);
          }

          const { data: alreadyProcessed } = await supabaseAdmin
            .from('form_submissions')
            .select('id')
            .eq('razorpay_payment_id', paymentId)
            .eq('payment_status', 'paid')
            .maybeSingle();

          if (alreadyProcessed) {
            console.log(`[Webhook] Duplicate delivery for payment ${paymentId} — skipping`);
            if (logId) {
              await supabaseAdmin
                .from('webhook_logs')
                .update({
                  status: 'duplicate',
                  error_message: `Duplicate delivery — payment ${paymentId} already fully processed`,
                })
                .eq('id', logId);
            }
            return;
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
            telegram_enabled: true,
            twilio_whatsapp_enabled: false,
          };

          // ── Data Persistence (Upsert Submission) ────────────────────────
          let targetSubmissionId: string | null = null;
          try {
            const query = supabaseAdmin.from('form_submissions').select('id');

            if (isPaymentLink) {
              query.eq('razorpay_payment_link_id', paymentLinkId);
            } else {
              query.eq('razorpay_order_id', orderId);
            }

            const { data: existingSubmissions } = await query;

            if (!existingSubmissions || existingSubmissions.length === 0) {
              const { data: insertedSub } = await supabaseAdmin
                .from('form_submissions')
                .insert([
                  {
                    form_slug:
                      notes.formSlug || (isPaymentLink ? 'reenrollment' : 'payment_fallback'),
                    user_name: studentName,
                    user_email: studentEmail,
                    form_data: { name: studentName, email: studentEmail, phone: studentPhone },
                    status: 'unread',
                    payment_status: 'paid',
                    razorpay_order_id: orderId,
                    razorpay_payment_link_id: paymentLinkId,
                    razorpay_payment_id: paymentId,
                    razorpay_customer_id: customerId,
                    cohort_id: finalCohortId,
                    is_verified: true,
                    razorpay_amount: paymentEntity?.amount || null,
                  },
                ])
                .select('id')
                .single();
              if (insertedSub) {
                targetSubmissionId = insertedSub.id;
              }
            } else {
              targetSubmissionId = existingSubmissions[0].id;
              const updateData: any = {
                payment_status: 'paid',
                is_verified: true,
                razorpay_payment_id: paymentId,
                razorpay_amount: paymentEntity?.amount || null,
              };

              const updateQuery = supabaseAdmin.from('form_submissions').update(updateData);

              if (isPaymentLink) {
                updateQuery.eq('razorpay_payment_link_id', paymentLinkId);
              } else {
                updateQuery.eq('razorpay_order_id', orderId);
              }

              await updateQuery;
            }
          } catch (dbErr) {
            console.error('[Webhook] Persistence failed (non-blocking):', dbErr);
          }

          // ── Split & Persist to Normalized Tables (Future Portal Support) ──
          let targetEnrollmentId: string | null = null;
          if (studentEmail && finalCohortId) {
            try {
              // 1. Upsert Student Profile
              const { data: student, error: studentErr } = await supabaseAdmin
                .from('students')
                .upsert(
                  {
                    name: studentName,
                    email: studentEmail,
                    phone: studentPhone || null,
                  },
                  { onConflict: 'email' }
                )
                .select('id')
                .single();

              if (studentErr || !student) {
                throw new Error(`Failed to upsert student: ${studentErr?.message}`);
              }

              // 2. Upsert Enrollment (status = 'active')
              const { data: enrollment, error: enrollErr } = await supabaseAdmin
                .from('enrollments')
                .upsert(
                  {
                    student_id: student.id,
                    cohort_id: finalCohortId,
                    status: 'active',
                  },
                  { onConflict: 'student_id,cohort_id' }
                )
                .select('id')
                .single();

              if (enrollErr || !enrollment) {
                throw new Error(`Failed to upsert enrollment: ${enrollErr?.message}`);
              }
              targetEnrollmentId = enrollment.id;

              // 3. Upsert Payment
              const { error: payErr } = await supabaseAdmin.from('payments').upsert(
                {
                  student_id: student.id,
                  enrollment_id: enrollment.id,
                  razorpay_order_id: orderId,
                  razorpay_payment_id: paymentId,
                  razorpay_payment_link_id: paymentLinkId,
                  razorpay_subscription_id: customerId
                    ? null
                    : event.payload.subscription?.entity?.id || null,
                  razorpay_customer_id: customerId,
                  amount: paymentEntity?.amount || null,
                  status: 'paid',
                },
                { onConflict: 'razorpay_payment_id' }
              );

              if (payErr) {
                throw new Error(`Failed to log payment: ${payErr.message}`);
              }

              // 4. Update Re-enrollment Invitation (instead of legacy reenrollment_logs)
              await supabaseAdmin
                .from('reenrollment_invitations')
                .update({ status: 'paid' })
                .eq('student_id', student.id)
                .eq('target_cohort_id', finalCohortId);
            } catch (splitErr: any) {
              console.error('[Webhook] Failed to write to evolution schema tables:', splitErr);
            }
          }

          // ── Notifications ─────────────────────────────────────────────────
          const telegramResult =
            telegramChatId && automation.telegram_enabled
              ? await generateTelegramInviteLink(telegramChatId, 168, studentName)
              : { success: false, error: !automation.telegram_enabled ? 'Disabled' : 'No ID' };

          let emailStatus: any = { status: automation.email_enabled ? 'pending' : 'disabled' };
          let whatsappStatus: any = {
            status: automation.whatsapp_enabled ? 'pending' : 'disabled',
          };
          let twilioWaStatus: any = {
            status: automation.twilio_whatsapp_enabled ? 'pending' : 'disabled',
          };

          // Always attempt email/WhatsApp regardless of Telegram outcome.
          // If Telegram failed, send an empty inviteLink — the welcome email still reaches the student.
          // The admin partial alert will prompt manual intervention for the Telegram access.
          const inviteLink = (telegramResult as any).inviteLink || '';

          // WhatsApp templates require the base URL to be hardcoded, so we only pass the code/path.
          const whatsappInviteCode = inviteLink.replace(/^https?:\/\/t\.me\//i, '');

          const results = await Promise.allSettled([
            studentEmail && automation.email_enabled
              ? sendCohortWelcomeEmail(studentEmail, studentName, inviteLink, cohortTitle)
              : Promise.reject(new Error(automation.email_enabled ? 'No email' : 'Disabled')),

            studentPhone && automation.whatsapp_enabled
              ? sendWhatsAppNotification(studentPhone, studentName, whatsappInviteCode)
              : Promise.reject(new Error(automation.whatsapp_enabled ? 'No phone' : 'Disabled')),

            studentPhone && automation.twilio_whatsapp_enabled
              ? sendTwilioWhatsApp(
                  studentPhone,
                  `Hi ${studentName}, your payment was received! Join your cohort group here: https://t.me/${whatsappInviteCode}`,
                  process.env.TWILIO_WHATSAPP_CONTENT_SID,
                  JSON.stringify({ '1': studentName, '2': whatsappInviteCode })
                )
              : Promise.reject(
                  new Error(automation.twilio_whatsapp_enabled ? 'No phone' : 'Disabled')
                ),
          ]);

          const [emailRes, whatsappRes, twaRes] = results;

          // Process Results
          if (emailRes.status === 'fulfilled') {
            const val = emailRes.value as any;
            emailStatus = val.error
              ? { status: 'failed', error: val.error }
              : { status: 'success', message_id: val.data?.id };
          } else {
            emailStatus = {
              status: automation.email_enabled ? 'failed' : 'disabled',
              error: emailRes.reason?.message,
            };
          }

          if (whatsappRes.status === 'fulfilled') {
            const val = whatsappRes.value as any;
            whatsappStatus = val.success
              ? { status: 'success', message_id: val.messageId }
              : { status: 'failed', error: val.error };
          } else {
            whatsappStatus = {
              status: automation.whatsapp_enabled ? 'failed' : 'disabled',
              error: whatsappRes.reason?.message,
            };
          }

          if (twaRes && twaRes.status === 'fulfilled') {
            const val = twaRes.value as any;
            twilioWaStatus = val.success
              ? { status: 'success', message_id: val.messageSid }
              : { status: 'failed', error: val.error };
          } else if (twaRes) {
            twilioWaStatus = {
              status: automation.twilio_whatsapp_enabled ? 'failed' : 'disabled',
              error: (twaRes as any).reason?.message,
            };
          }

          // ── Final Log Update (Fail-Safe) ─────────────────────────────────
          if (logId) {
            try {
              const isEmailOk = !automation.email_enabled || emailStatus.status === 'success';
              const isWhatsappOk =
                !automation.whatsapp_enabled || whatsappStatus.status === 'success';
              const isTelegramOk = !automation.telegram_enabled || telegramResult.success;
              const finalStatus =
                isEmailOk && isWhatsappOk && isTelegramOk ? 'success' : 'partial_success';

              await supabaseAdmin
                .from('webhook_logs')
                .update({
                  status: finalStatus,
                  student_email: studentEmail,
                  student_name: studentName,
                  error_message: telegramResult.error || null,
                  notification_status: {
                    telegram: {
                      status: automation.telegram_enabled
                        ? telegramResult.success
                          ? 'success'
                          : 'failed'
                        : 'disabled',
                      error: telegramResult.error,
                      link: (telegramResult as any).inviteLink,
                    },
                    email: emailStatus,
                    whatsapp: whatsappStatus,
                    twilio_whatsapp: twilioWaStatus,
                  },
                })
                .eq('id', logId);

              // Also update the form submission with the generated Telegram invite link
              if (telegramResult.success && (telegramResult as any).inviteLink) {
                try {
                  const subUpdateQuery = supabaseAdmin.from('form_submissions').update({
                    telegram_invite_link: (telegramResult as any).inviteLink,
                    telegram_joined: false,
                  });

                  if (isPaymentLink) {
                    subUpdateQuery.eq('razorpay_payment_link_id', paymentLinkId);
                  } else {
                    subUpdateQuery.eq('razorpay_order_id', orderId);
                  }

                  await subUpdateQuery;

                  // Also update the normalized enrollment table if populated
                  if (targetEnrollmentId) {
                    await supabaseAdmin
                      .from('enrollments')
                      .update({
                        telegram_invite_link: (telegramResult as any).inviteLink,
                        telegram_joined: false,
                      })
                      .eq('id', targetEnrollmentId);
                  }

                  // Insert log entry in telegram_invite_logs
                  if (targetSubmissionId) {
                    await supabaseAdmin.from('telegram_invite_logs').insert([
                      {
                        submission_id: targetSubmissionId,
                        enrollment_id: targetEnrollmentId || null,
                        action: 'created',
                        invite_link: (telegramResult as any).inviteLink,
                        created_by: 'system',
                        payload: { info: 'Generated automatically via Razorpay payment webhook' },
                      },
                    ]);
                  }
                } catch (subUpdateErr) {
                  console.error(
                    '[Webhook] Failed to update form submission with invite link:',
                    subUpdateErr
                  );
                }
              }

              // ── Admin Group Alert ───────────────────────────────────────────
              const tgIcon = isTelegramOk ? '✅' : '❌';
              const emailIcon = isEmailOk ? '✅' : '❌';
              const amountPaise = paymentEntity?.amount || 0;
              const amountFormatted = amountPaise
                ? `₹${(amountPaise / 100).toLocaleString('en-IN')}`
                : 'N/A';
              const now = new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour12: true,
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              const alertMsg =
                finalStatus === 'success'
                  ? `💰 <b>New Payment!</b>\n\n👤 ${studentName}\n📧 ${studentEmail || 'N/A'}\n📱 ${studentPhone || 'N/A'}\n💳 ${amountFormatted}\n🎓 ${cohortTitle}\n\n${tgIcon} Telegram  ${emailIcon} Email\n⏰ ${now}`
                  : `⚠️ <b>Partial Enrollment</b>\n\n👤 ${studentName}\n📧 ${studentEmail || 'N/A'}\n💳 ${amountFormatted}\n🎓 ${cohortTitle}\n\n${tgIcon} Telegram  ${emailIcon} Email\n❗ Check <a href="https://aishwaryamanikarnike.com/admin/logs">admin logs</a>\n⏰ ${now}`;

              await sendAdminAlert(alertMsg);
            } catch (logUpdateErr) {
              console.error('[Webhook] Failed to update log:', logUpdateErr);
            }
          }
        }
      } catch (err: any) {
        console.error('[Webhook] Unhandled automation error:', err);
        // Try to log the failure before finishing
        if (logId) {
          try {
            await supabaseAdmin
              .from('webhook_logs')
              .update({ status: 'failed', error_message: err.message })
              .eq('id', logId);
          } catch (logFinalErr) {
            console.error('[Webhook] Failed to log final error:', logFinalErr);
          }
        }
        // Alert admin group about hard failure
        await sendAdminAlert(
          `🚨 <b>Webhook Failed!</b>\n\n❌ ${err.message}\n\nCheck <a href="https://aishwaryamanikarnike.com/admin/logs">admin logs</a> immediately.`
        );
      }
    });

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Webhook] Critical error:', err);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
