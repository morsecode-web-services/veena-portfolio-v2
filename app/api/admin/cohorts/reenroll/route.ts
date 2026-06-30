import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createPersonalizedPaymentLink } from '@/lib/razorpay';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ReenrollInvite from '@/emails/ReenrollInvite';
import { sendTwilioWhatsApp } from '@/lib/notifications/twilio';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LogStatusParams {
  studentId: string;
  sourceCohortId?: string | null;
  targetCohortId: string;
  status: 'sent' | 'failed' | 'paid' | 'wa_failed' | 'email_failed';
  paymentLinkId?: string | null;
  paymentLinkUrl?: string | null;
  errorMessage?: string | null;
  waMessageSid?: string | null | undefined;
  waDeliveryStatus?: 'pending' | 'delivered' | 'undelivered' | null | undefined;
  emailMessageId?: string | null | undefined;
  emailDeliveryStatus?: 'pending' | 'delivered' | 'bounced' | 'complained' | null | undefined;
}

async function logReenrollmentStatus({
  studentId,
  sourceCohortId = null,
  targetCohortId,
  status,
  paymentLinkId = null,
  paymentLinkUrl = null,
  errorMessage = null,
  waMessageSid = undefined,
  waDeliveryStatus = undefined,
  emailMessageId = undefined,
  emailDeliveryStatus = undefined,
}: LogStatusParams) {
  // 1. Query if a log already exists in reenrollment_invitations
  const { data: existingLog } = await supabaseAdmin
    .from('reenrollment_invitations')
    .select('id')
    .eq('target_cohort_id', targetCohortId)
    .eq('student_id', studentId)
    .maybeSingle();

  const payload: any = {
    student_id: studentId,
    source_cohort_id: sourceCohortId,
    target_cohort_id: targetCohortId,
    payment_link_id: paymentLinkId,
    payment_link_url: paymentLinkUrl,
    status,
    error_message: errorMessage,
    updated_at: new Date().toISOString(),
  };

  // Only set WA tracking fields when explicitly passed by the caller
  // (default is undefined = "not provided"; null would be an explicit clear)
  if (waMessageSid !== undefined) payload.wa_message_sid = waMessageSid;
  if (waDeliveryStatus !== undefined) payload.wa_delivery_status = waDeliveryStatus;
  if (emailMessageId !== undefined) payload.email_message_id = emailMessageId;
  if (emailDeliveryStatus !== undefined) payload.email_delivery_status = emailDeliveryStatus;

  if (existingLog) {
    const { error } = await supabaseAdmin
      .from('reenrollment_invitations')
      .update(payload)
      .eq('id', existingLog.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from('reenrollment_invitations').insert([payload]);
    if (error) throw error;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Session & Auth Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('[Re-enroll API] Missing Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('[Re-enroll API] Invalid session:', authError);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      console.error('[Re-enroll API] Forbidden. User role:', profile?.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse Input
    const {
      targetCohortId,
      sourceCohortId,
      students,
      sendEmail = true,
      sendWhatsApp = true,
    } = await request.json();

    if (!targetCohortId || !students || !Array.isArray(students)) {
      console.error('[Re-enroll API] Missing target cohort ID or student list:', {
        targetCohortId,
        students,
      });
      return NextResponse.json(
        { error: 'Missing target cohort ID or student list' },
        { status: 400 }
      );
    }

    if (!sendEmail && !sendWhatsApp) {
      return NextResponse.json(
        { error: 'Please select at least one delivery channel (Email or WhatsApp)' },
        { status: 400 }
      );
    }

    // 3. Fetch Cohort Details
    const { data: targetCohort, error: targetError } = await supabaseAdmin
      .from('cohorts')
      .select('*')
      .eq('id', targetCohortId)
      .single();

    if (targetError || !targetCohort) {
      console.error('[Re-enroll API] Target cohort not found:', targetCohortId, targetError);
      return NextResponse.json({ error: 'Target cohort not found' }, { status: 404 });
    }

    // ── Global site config log (no longer blocks processing since modal config overrides it) ──────────────────────────────
    const { data: configData } = await supabaseAdmin
      .from('site_config')
      .select('data')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    const automation = configData?.data?.automation || { email_enabled: true };

    // 4. Process Invitations
    const results = {
      total: students.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[],
    };

    // ── Bulk Pre-fetch Duplicate Checks (Solves N+1 Query Problem) ────────
    const [enrollmentsRes, invitationsRes] = await Promise.all([
      supabaseAdmin
        .from('enrollments')
        .select('student_id')
        .eq('cohort_id', targetCohortId)
        .eq('status', 'active'),
      supabaseAdmin
        .from('reenrollment_invitations')
        .select('student_id, status')
        .eq('target_cohort_id', targetCohortId),
    ]);

    const enrolledStudentIds = new Set((enrollmentsRes.data || []).map((e) => e.student_id));
    const invitedStudentIds = new Set(
      (invitationsRes.data || [])
        .filter((i) => i.status === 'sent' || i.status === 'paid')
        .map((i) => i.student_id)
    );

    // ── Student Processing Function ─────────────────────────────────────────
    const processStudent = async (student: any) => {
      try {
        const name = student.name || 'Student';
        const email = student.email?.toLowerCase(); // Case insensitive formatting
        const phone = student.phone;

        if (!email) {
          results.failed++;
          return;
        }

        // First find the student if they exist in our database
        let { data: studentProfile } = await supabaseAdmin
          .from('students')
          .select('id')
          .ilike('email', email)
          .maybeSingle();

        if (!studentProfile) {
          // Fallback: Create student if they somehow don't exist yet
          const { data: newStudent } = await supabaseAdmin
            .from('students')
            .insert({ name, email, phone: phone || null })
            .select('id')
            .single();
          studentProfile = newStudent;
        }

        if (!studentProfile) {
          results.failed++;
          return;
        }

        const studentId = studentProfile.id;

        // 1. Check if already invited to this target cohort (using memory Set)
        if (invitedStudentIds.has(studentId)) {
          results.skipped++;
          return;
        }

        // 2. Check if already enrolled in target cohort (using memory Set)
        if (enrolledStudentIds.has(studentId)) {
          results.skipped++;
          return;
        }

        // Use standard cohort price
        const finalPrice = targetCohort.price;
        const isPAYW = targetCohort.pricing_type === 'pay_as_you_wish';
        let inviteLinkUrl = '';
        let paymentLinkId: string | null = null;

        if (isPAYW) {
          // Generate prefilled website link
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aishwaryamanikarnike.com';
          inviteLinkUrl = `${baseUrl}/cohorts?enroll=${targetCohortId}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone || '')}`;
        } else {
          // Generate Razorpay Link
          const plink = await createPersonalizedPaymentLink({
            name,
            email,
            phone,
            amount: finalPrice,
            description: `Hi ${name}! Enrollment for ${targetCohort.title}`,
            cohortId: targetCohortId,
          });

          if (!plink.success) {
            results.failed++;
            await logReenrollmentStatus({
              studentId,
              sourceCohortId,
              targetCohortId,
              status: 'failed',
              errorMessage: plink.error,
            });
            return;
          }
          inviteLinkUrl = plink.short_url!;
          paymentLinkId = plink.id!;
        }

        // Send Email
        let emailSent = false;
        let emailError = '';
        let emailMessageId: string | null = null;
        if (sendEmail) {
          try {
            const html = await render(
              ReenrollInvite({
                name,
                cohortTitle: targetCohort.title,
                paymentLink: inviteLinkUrl,
                price: isPAYW ? 'Pay as you wish' : `₹${(finalPrice / 100).toLocaleString()}`,
              })
            );

            const emailRes = await resend.emails.send({
              from: 'Aishwarya Manikarnike <official@email.aishwaryamanikarnike.com>',
              to: email,
              subject: `✨ Your invitation for ${targetCohort.title}`,
              html,
              replyTo: 'official@aishwaryamanikarnike.com',
            });

            if (emailRes.data && emailRes.data.id) {
              emailSent = true;
              emailMessageId = emailRes.data.id;
            } else if (emailRes.error) {
              emailError = emailRes.error.message || 'Resend error';
            } else {
              emailError = 'Unknown resend failure';
            }
          } catch (emailErr: any) {
            emailError = emailErr.message || 'Unknown email error';
          }
        } else {
          emailError = 'Email not selected';
        }

        // Send WhatsApp (Twilio Content API Card template)
        let waSent = false;
        let waError = '';
        let waMessageSid: string | null = null;
        if (sendWhatsApp && phone) {
          const contentSid = process.env.TWILIO_WHATSAPP_REENROLL_CONTENT_SID;
          if (!contentSid) {
            waError = 'Missing TWILIO_WHATSAPP_REENROLL_CONTENT_SID env variable';
            console.error(
              '[Re-enroll API] Missing TWILIO_WHATSAPP_REENROLL_CONTENT_SID env variable'
            );
          } else {
            try {
              // As per template configuration: https://aishwaryamanikarnike.com/cohorts?{{3}}
              // So we only pass the query parameter suffix as variable 3
              const querySuffix = `enroll=${targetCohortId}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
              const variables = JSON.stringify({
                '1': name,
                '2': targetCohort.title,
                '3': querySuffix,
              });
              const fallbackBody = `Hi ${name}! Registration for ${targetCohort.title} is now open. Secure your spot here: https://aishwaryamanikarnike.com/cohorts?${querySuffix}`;

              // Build the StatusCallback URL so Twilio POSTs delivery updates back to us
              const siteUrl =
                process.env.NEXT_PUBLIC_SITE_URL || 'https://aishwaryamanikarnike.com';
              const statusCallbackUrl = `${siteUrl}/api/webhooks/twilio-whatsapp-status`;

              const waRes = await sendTwilioWhatsApp(
                phone,
                fallbackBody,
                contentSid,
                variables,
                statusCallbackUrl
              );
              if (waRes.success) {
                waSent = true;
                waMessageSid = waRes.messageSid || null;
              } else {
                waError = waRes.error || 'Twilio send failed';
              }
            } catch (waErr: any) {
              waError = waErr.message || 'Twilio send exception';
            }
          }
        } else if (!phone && sendWhatsApp) {
          waError = 'No phone number';
        } else {
          waError = 'WhatsApp not selected';
        }

        // Track Overall Result
        if ((sendEmail && emailSent) || waSent) {
          results.sent++;
          let logMsg = '';
          if (sendEmail && !emailSent) logMsg += `Email failed: ${emailError}. `;
          if (!waSent) logMsg += `WhatsApp failed: ${waError}.`;

          await logReenrollmentStatus({
            studentId,
            sourceCohortId,
            targetCohortId,
            status: 'sent',
            paymentLinkId,
            paymentLinkUrl: inviteLinkUrl,
            errorMessage: logMsg || null,
            // Store the Twilio message SID so the delivery webhook can look up this record
            waMessageSid: waMessageSid,
            // Mark as pending — the StatusCallback webhook will update this to 'delivered' or 'undelivered'
            waDeliveryStatus: waSent ? 'pending' : null,
            // Store Resend email message ID
            emailMessageId: emailMessageId,
            // Mark as pending
            emailDeliveryStatus: emailSent ? 'pending' : null,
          });
        } else {
          results.failed++;
          const logMsg = `Email: ${emailError}, WhatsApp: ${waError}`;
          await logReenrollmentStatus({
            studentId,
            sourceCohortId,
            targetCohortId,
            status: 'failed',
            errorMessage: logMsg,
          });
        }
      } catch (err: any) {
        console.error('[Re-enroll API] Unexpected error processing student:', err);
        results.failed++;
        // If we have a studentId by this point, we could log it.
        // But since error could happen anywhere, just increment failed.
      }
    };

    // ── Concurrent Processing (Solves API Timeout Risk) ─────────────────────
    // Process in chunks of 5 to avoid overwhelming APIs or hitting rate limits
    const CHUNK_SIZE = 5;
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map((student) => processStudent(student)));
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Re-enroll API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
