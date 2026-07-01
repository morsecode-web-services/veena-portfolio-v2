import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendTwilioWhatsApp } from '@/lib/notifications/twilio';
import { render } from '@react-email/render';
import ReenrollInvite from '@/emails/ReenrollInvite';
import { sendEmailWithRetry } from '@/lib/notifications/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cohorts/reenroll/resend
 *
 * Resend a re-enrollment WhatsApp invite to a specific student whose
 * previous delivery failed (status = 'wa_failed').
 *
 * Body: { invitationId, studentId, targetCohortId, sourceCohortId? }
 */
export async function POST(request: Request) {
  try {
    // Auth check
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

    const { invitationId, studentId, targetCohortId, sourceCohortId } = await request.json();

    if (!invitationId || !studentId || !targetCohortId) {
      return NextResponse.json(
        { error: 'Missing invitationId, studentId or targetCohortId' },
        { status: 400 }
      );
    }

    // Fetch the existing invitation to confirm it is wa_failed and get the stored link
    const { data: invitation, error: inviteErr } = await supabaseAdmin
      .from('reenrollment_invitations')
      .select('id, status, payment_link_url, payment_link_id, updated_at')
      .eq('id', invitationId)
      .single();

    if (inviteErr || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'wa_failed' && invitation.status !== 'email_failed') {
      return NextResponse.json(
        {
          error: `Cannot resend: invitation status is '${invitation.status}', expected 'wa_failed' or 'email_failed'`,
        },
        { status: 400 }
      );
    }

    // Enforce 24h wait ONLY for WhatsApp (due to Meta's frequency cap limits)
    if (invitation.status === 'wa_failed') {
      const hoursSinceFailed =
        (Date.now() - new Date(invitation.updated_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceFailed < 24) {
        const hoursLeft = Math.ceil(24 - hoursSinceFailed);
        return NextResponse.json(
          {
            error: `Please wait ~${hoursLeft} more hour(s) before retrying. Meta's frequency cap resets after 24 hours.`,
          },
          { status: 429 }
        );
      }
    }

    // Fetch student details
    const { data: student, error: studentErr } = await supabaseAdmin
      .from('students')
      .select('id, name, email, phone')
      .eq('id', studentId)
      .single();

    if (studentErr || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch cohort details
    const { data: targetCohort, error: cohortErr } = await supabaseAdmin
      .from('cohorts')
      .select('title, pricing_type, price')
      .eq('id', targetCohortId)
      .single();

    if (cohortErr || !targetCohort) {
      return NextResponse.json({ error: 'Target cohort not found' }, { status: 404 });
    }

    const contentSid = process.env.TWILIO_WHATSAPP_REENROLL_CONTENT_SID;
    if (!contentSid) {
      return NextResponse.json(
        { error: 'Missing TWILIO_WHATSAPP_REENROLL_CONTENT_SID env variable' },
        { status: 500 }
      );
    }

    if (!student.phone) {
      return NextResponse.json({ error: 'Student has no phone number' }, { status: 400 });
    }

    const { name, email, phone } = student;

    // Build unique invite payment link (same as reenroll route)
    const isPAYW = targetCohort.pricing_type === 'pay_as_you_wish';
    let inviteLinkUrl = invitation.payment_link_url;

    if (!inviteLinkUrl) {
      // Re-generate if somehow missing
      if (isPAYW) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aishwaryamanikarnike.com';
        inviteLinkUrl = `${baseUrl}/cohorts?enroll=${targetCohortId}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone || '')}`;
      } else {
        const { createPersonalizedPaymentLink } = await import('@/lib/razorpay');
        const plink = await createPersonalizedPaymentLink({
          name,
          email,
          phone,
          amount: targetCohort.price,
          description: `Hi ${name}! Enrollment for ${targetCohort.title}`,
          cohortId: targetCohortId,
        });
        if (plink.success) {
          inviteLinkUrl = plink.short_url!;
        }
      }
    }

    if (invitation.status === 'wa_failed') {
      if (!phone) {
        return NextResponse.json({ error: 'Student has no phone number' }, { status: 400 });
      }

      const contentSid = process.env.TWILIO_WHATSAPP_REENROLL_CONTENT_SID;
      if (!contentSid) {
        return NextResponse.json(
          { error: 'Missing TWILIO_WHATSAPP_REENROLL_CONTENT_SID env variable' },
          { status: 500 }
        );
      }

      const querySuffix = `?enroll=${targetCohortId}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
      const variables = JSON.stringify({
        '1': name,
        '2': targetCohort.title,
        '3': querySuffix,
      });
      const fallbackBody = `Hi ${name}! Registration for ${targetCohort.title} is now open. Secure your spot here: https://aishwaryamanikarnike.com/cohorts${querySuffix}`;

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aishwaryamanikarnike.com';
      const statusCallbackUrl = `${siteUrl}/api/webhooks/twilio-whatsapp-status`;

      const waRes = await sendTwilioWhatsApp(
        phone,
        fallbackBody,
        contentSid,
        variables,
        statusCallbackUrl
      );

      if (!waRes.success) {
        return NextResponse.json(
          { error: waRes.error || 'Failed to send WhatsApp message' },
          { status: 500 }
        );
      }

      // Update DB for WhatsApp retry
      await supabaseAdmin
        .from('reenrollment_invitations')
        .update({
          status: 'sent',
          wa_message_sid: waRes.messageSid || null,
          wa_delivery_status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      return NextResponse.json({
        success: true,
        channel: 'whatsapp',
        messageSid: waRes.messageSid,
      });
    } else {
      // resend email
      try {
        const html = await render(
          ReenrollInvite({
            name,
            cohortTitle: targetCohort.title,
            paymentLink: inviteLinkUrl || '',
            price: isPAYW ? 'Pay as you wish' : `₹${(targetCohort.price / 100).toLocaleString()}`,
          })
        );

        const emailRes = await sendEmailWithRetry({
          from: 'Aishwarya Manikarnike <official@email.aishwaryamanikarnike.com>',
          to: email,
          subject: `✨ Your invitation for ${targetCohort.title}`,
          html,
          replyTo: 'official@aishwaryamanikarnike.com',
        });

        if (!emailRes.data || !emailRes.data.id) {
          throw new Error(emailRes.error?.message || 'Resend error');
        }

        // Update DB for Email retry
        await supabaseAdmin
          .from('reenrollment_invitations')
          .update({
            status: 'sent',
            email_message_id: emailRes.data.id,
            email_delivery_status: 'pending',
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invitationId);

        return NextResponse.json({ success: true, channel: 'email', emailId: emailRes.data.id });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('[Resend API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
