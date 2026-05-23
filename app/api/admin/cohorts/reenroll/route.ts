import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createPersonalizedPaymentLink } from '@/lib/razorpay';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ReenrollInvite from '@/emails/ReenrollInvite';
import { sendTwilioWhatsApp } from '@/lib/notifications/twilio';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LogStatusParams {
  targetCohortId: string;
  email: string;
  name: string;
  phone?: string | null;
  status: 'sent' | 'failed' | 'paid';
  paymentLinkId?: string | null;
  paymentLinkUrl?: string | null;
  errorMessage?: string | null;
}

async function logReenrollmentStatus({
  targetCohortId,
  email,
  name,
  phone,
  status,
  paymentLinkId = null,
  paymentLinkUrl = null,
  errorMessage = null
}: LogStatusParams) {
  // Query if a log already exists
  const { data: existingLog } = await supabaseAdmin
    .from('reenrollment_logs')
    .select('id')
    .eq('target_cohort_id', targetCohortId)
    .ilike('student_email', email)
    .maybeSingle();

  const payload = {
    target_cohort_id: targetCohortId,
    student_name: name,
    student_email: email,
    student_phone: phone || null,
    payment_link_id: paymentLinkId,
    payment_link_url: paymentLinkUrl,
    status,
    error_message: errorMessage,
    updated_at: new Date().toISOString()
  };

  if (existingLog) {
    const { error } = await supabaseAdmin
      .from('reenrollment_logs')
      .update(payload)
      .eq('id', existingLog.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin
      .from('reenrollment_logs')
      .insert([payload]);
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
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
    const { targetCohortId, students } = await request.json();

    if (!targetCohortId || !students || !Array.isArray(students)) {
      console.error('[Re-enroll API] Missing target cohort ID or student list:', { targetCohortId, students });
      return NextResponse.json({ error: 'Missing target cohort ID or student list' }, { status: 400 });
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

    // ── Fetch Global Automation Settings ──────────────────────────────
    const { data: configData } = await supabaseAdmin
      .from('site_config')
      .select('data')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();
    
    const automation = configData?.data?.automation || { email_enabled: true };
    
    if (!automation.email_enabled && !automation.twilio_whatsapp_enabled) {
      console.error('[Re-enroll API] Both Email and WhatsApp notifications are disabled in site config');
      return NextResponse.json({ error: 'Notifications are currently disabled.' }, { status: 400 });
    }

    // 4. Process Invitations
    const results = {
      total: students.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[]
    };

    for (const student of students) {
      const name = student.name || 'Student';
      const email = student.email;
      const phone = student.phone;

      if (!email) {
        results.failed++;
        continue;
      }

      // ── Duplicate Check ─────────────────────────────────────────────
      // 1. Check if already invited to this target cohort
      const { data: existingLog } = await supabaseAdmin
        .from('reenrollment_logs')
        .select('id, status')
        .eq('target_cohort_id', targetCohortId)
        .ilike('student_email', email)
        .maybeSingle();

      if (existingLog && (existingLog.status === 'sent' || existingLog.status === 'paid')) {
        results.skipped++;
        continue;
      }

      // 2. Check if already enrolled in target cohort (actual submission)
      const { data: actualEnrollment } = await supabaseAdmin
        .from('form_submissions')
        .select('id')
        .eq('cohort_id', targetCohortId)
        .ilike('user_email', email)
        .eq('payment_status', 'paid')
        .maybeSingle();

      if (actualEnrollment) {
        results.skipped++;
        continue;
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
          cohortId: targetCohortId
        });

        if (!plink.success) {
          results.failed++;
          await logReenrollmentStatus({
            targetCohortId,
            email,
            name,
            phone,
            status: 'failed',
            errorMessage: plink.error
          });
          continue;
        }
        inviteLinkUrl = plink.short_url!;
        paymentLinkId = plink.id!;
      }

      // Send Email
      let emailSent = false;
      let emailError = '';
      if (automation.email_enabled) {
        try {
          const html = await render(ReenrollInvite({
            name,
            cohortTitle: targetCohort.title,
            paymentLink: inviteLinkUrl,
            price: isPAYW ? 'Guru Dakshina' : `₹${(finalPrice / 100).toLocaleString()}`
          }));

          await resend.emails.send({
            from: 'Aishwarya Manikarnike <official@email.aishwaryamanikarnike.com>',
            to: email,
            subject: `✨ Your invitation for ${targetCohort.title}`,
            html,
            replyTo: 'official@aishwaryamanikarnike.com',
          });
          emailSent = true;
        } catch (emailErr: any) {
          emailError = emailErr.message || 'Unknown email error';
        }
      } else {
        emailError = 'Email disabled';
      }

      // Send WhatsApp (Twilio Content API Card template)
      let waSent = false;
      let waError = '';
      if (phone && automation.twilio_whatsapp_enabled) {
        const contentSid = process.env.TWILIO_WHATSAPP_REENROLL_CONTENT_SID;
        if (!contentSid) {
          waError = 'Missing TWILIO_WHATSAPP_REENROLL_CONTENT_SID env variable';
          console.error('[Re-enroll API] Missing TWILIO_WHATSAPP_REENROLL_CONTENT_SID env variable');
        } else {
          try {
            // As per template configuration: https://aishwaryamanikarnike.com/cohorts?{{3}}
            // So we only pass the query parameter suffix as variable 3
            const querySuffix = `enroll=${targetCohortId}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
            const variables = JSON.stringify({
              "1": name,
              "2": targetCohort.title,
              "3": querySuffix
            });
            const fallbackBody = `Hi ${name}! Registration for ${targetCohort.title} is now open. Secure your spot here: https://aishwaryamanikarnike.com/cohorts?${querySuffix}`;

            const waRes = await sendTwilioWhatsApp(
              phone,
              fallbackBody,
              contentSid,
              variables
            );
            if (waRes.success) {
              waSent = true;
            } else {
              waError = waRes.error || 'Twilio send failed';
            }
          } catch (waErr: any) {
            waError = waErr.message || 'Twilio send exception';
          }
        }
      } else {
        waError = phone ? 'WhatsApp disabled' : 'No phone number';
      }

      // Track Overall Result
      // If either method is enabled and succeeds, or both succeed, we log it as 'sent'
      if ((automation.email_enabled && emailSent) || (automation.twilio_whatsapp_enabled && waSent)) {
        results.sent++;
        let logMsg = '';
        if (automation.email_enabled && !emailSent) logMsg += `Email failed: ${emailError}. `;
        if (automation.twilio_whatsapp_enabled && !waSent) logMsg += `WhatsApp failed: ${waError}.`;

        await logReenrollmentStatus({
          targetCohortId,
          email,
          name,
          phone,
          status: 'sent',
          paymentLinkId,
          paymentLinkUrl: inviteLinkUrl,
          errorMessage: logMsg || null
        });
      } else {
        results.failed++;
        const logMsg = `Email: ${emailError}${automation.twilio_whatsapp_enabled ? `, WhatsApp: ${waError}` : ''}`;
        await logReenrollmentStatus({
          targetCohortId,
          email,
          name,
          phone,
          status: 'failed',
          errorMessage: logMsg
        });
      }

      // Small breather
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Re-enroll API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
