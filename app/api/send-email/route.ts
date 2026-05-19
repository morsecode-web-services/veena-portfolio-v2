import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { supabaseAdmin } from '@/lib/supabase-admin';
import PerformanceInquiry from '@/emails/PerformanceInquiry';
import ClassesInquiry from '@/emails/ClassesInquiry';
import CollaborationInquiry from '@/emails/CollaborationInquiry';
import GeneralInquiry from '@/emails/GeneralInquiry';
import ContactNotification from '@/emails/ContactNotification';

// Initialize Resend (lazy initialization to avoid build errors)
let resend: Resend | null = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Email template configuration
const emailTemplates = {
  performance: {
    subject: 'Thank you for your performance inquiry',
    component: PerformanceInquiry,
  },
  classes: {
    subject: 'Thank you for your interest in classes',
    component: ClassesInquiry,
  },
  collaboration: {
    subject: 'Thank you for your collaboration inquiry',
    component: CollaborationInquiry,
  },
  general: {
    subject: 'Thank you for contacting me',
    component: GeneralInquiry,
  },
};

// Rate limiting: Track submission times per IP
// NOTE: This is in-memory and resets on serverless cold starts.
// Acceptable for contact forms; cohort payments are protected by Razorpay itself.
const submissionTimes = new Map<string, number>();
const RATE_LIMIT_WINDOW = 30000; // 30 seconds

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Check rate limiting
    const lastSubmitTime = submissionTimes.get(ip);
    const now = Date.now();
    if (lastSubmitTime && now - lastSubmitTime < RATE_LIMIT_WINDOW) {
      return NextResponse.json(
        { error: 'Please wait 30 seconds before submitting another message.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, phone, inquiryType, message, formSlug, form_data, payment_status, razorpay_subscription_id, razorpay_customer_id, razorpay_order_id, razorpay_payment_id, cohortId } = body;

    // Validate if either old style or new style dynamic form is used
    if (!formSlug && (!name || !email || !phone || !inquiryType || !message)) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if email notifications are enabled for this specific form
    let emailEnabled = true; // Default to enabled for legacy forms
    let formFields: any[] = [];
    let customAutoReply: { subject?: string, message?: string } | null = null;
    if (formSlug) {
      const { data: config } = await supabaseAdmin
        .from('form_configs')
        .select('*')
        .eq('form_slug', formSlug)
        .single();

      if (config) {
        if (config.email_notifications_enabled === false) {
          emailEnabled = false;
        }
        formFields = config.fields || [];
        if (config.auto_reply_subject || config.auto_reply_message) {
           customAutoReply = {
              subject: config.auto_reply_subject,
              message: config.auto_reply_message
           };
        }
      }
    }

    // Helper to extract values semantically
    const getFieldByTypeOrName = (type: string, nameKeywords: string[]) => {
      // 1. Try to find by type
      const byType = formFields.find((f: any) => f.type === type);
      if (byType && form_data?.[byType.name]) return form_data[byType.name];

      // 2. Try to find by name/label keywords
      const byName = formFields.find((f: any) =>
        nameKeywords.some(kw =>
          f.name.toLowerCase().includes(kw) ||
          f.label.toLowerCase().includes(kw)
        )
      );
      if (byName && form_data?.[byName.name]) return form_data[byName.name];

      // 3. Fallback to hardcoded keys
      return form_data?.[type] || nameKeywords.map(kw => form_data?.[kw]).find(v => !!v);
    };

    // Smart discovery of identity from dynamic fields
    const discoveredEmail = email || getFieldByTypeOrName('email', ['email', 'mail', 'address']);
    
    // For name, we try to find a real name and avoid using a phone number if possible
    let discoveredName = name || getFieldByTypeOrName('text', ['name', 'full name', 'first name']);
    const discoveredPhone = phone || getFieldByTypeOrName('tel', ['phone', 'mobile', 'whatsapp', 'tel']);

    // If discoveredName looks exactly like the phone, it's likely a mis-mapped field, so we default to null to trigger 'Anonymous'
    if (discoveredName && discoveredPhone && String(discoveredName) === String(discoveredPhone)) {
      discoveredName = null;
    }

    if (!discoveredName) discoveredName = 'Anonymous';
    const discoveredMessage = message || getFieldByTypeOrName('textarea', ['message', 'comment', 'inquiry', 'details']) || 'No message provided';

    // 1. Route and Store Data
    // Business Leads vs. General Form Submissions
    const leadSlugs = ['performance', 'collaboration', 'classes'];
    const targetTable = leadSlugs.includes(formSlug) ? 'leads' : 'form_submissions';

    // For cohort enrollments with a completed payment, the Razorpay webhook is the
    // single source of truth for form_submissions writes. Skip the DB insert here
    // entirely to prevent a duplicate row in /admin/responses.
    if (formSlug === 'cohort_enrollment' && payment_status === 'paid') {
      return NextResponse.json({ success: true, message: 'Cohort enrollment handled by webhook' });
    }

    const submissionRecord: any = {
      form_slug: formSlug || 'general',
      form_data: form_data || body,
    };

    // Table-specific fields
    if (targetTable === 'form_submissions') {
      submissionRecord.user_email = discoveredEmail;
      submissionRecord.user_name = discoveredName || 'Anonymous';
      submissionRecord.status = 'unread';
      if (payment_status) {
        submissionRecord.payment_status = payment_status;
        if (payment_status === 'paid') submissionRecord.is_verified = true;
      }
      if (razorpay_subscription_id) submissionRecord.razorpay_subscription_id = razorpay_subscription_id;
      if (razorpay_customer_id) submissionRecord.razorpay_customer_id = razorpay_customer_id;
      if (razorpay_order_id) submissionRecord.razorpay_order_id = razorpay_order_id;
      if (razorpay_payment_id) submissionRecord.razorpay_payment_id = razorpay_payment_id;
      if (cohortId) submissionRecord.cohort_id = cohortId;
    } else {
      submissionRecord.name = discoveredName || 'Anonymous';
      submissionRecord.status = 'new';
      if (cohortId) submissionRecord.cohort_id = cohortId;
    }

    // Use supabaseAdmin (service role) to bypass RLS — this is a trusted server route.
    const { error: dbError } = await supabaseAdmin
      .from(targetTable)
      .insert([submissionRecord]);

    if (dbError) {
      console.error(`Failed to store data in ${targetTable}:`, dbError);
      return NextResponse.json(
        { error: 'Database error: Failed to save your submission. Your data has not been sent. Please try again.' },
        { status: 500 }
      );
    }

    // If emails are disabled, store the lead but don't send anything
    if (!emailEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Lead stored successfully (Email notifications disabled for this form)',
      });
    }

    // 2. Get the appropriate auto-reply template
    // Use formSlug if available, fallback to inquiryType
    const effectiveSlug = formSlug || inquiryType || 'general';
    const templateConfig =
      emailTemplates[effectiveSlug as keyof typeof emailTemplates] ||
      emailTemplates.general;

    // 3. Render React component to HTML
    const userName = discoveredName || 'Valued Visitor';
    const userEmail = discoveredEmail;
    const userPhone = discoveredPhone;
    const userMessage = discoveredMessage;

    const autoReplyHtml = await render(templateConfig.component({ name: userName }));
    const notificationHtml = await render(
      ContactNotification({
        name: userName,
        email: userEmail,
        phone: userPhone,
        inquiryType: effectiveSlug,
        message: userMessage,
        formData: form_data,
        formFields: formFields
      })
    );

    // 4. Send notification email to you
    // Skip for cohort_enrollment — the Razorpay webhook handles all notifications
    // for that flow (welcome email + Telegram invite). Sending here too is duplicate noise.
    if (formSlug === 'cohort_enrollment') {
      return NextResponse.json({ success: true, message: 'Cohort submission stored (notifications handled by webhook)' });
    }

    const resendClient = getResend();
    if (!resendClient) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const notificationResult = await resendClient.emails.send({
      from: 'Contact Form <official@email.aishwaryamanikarnike.com>',
      to: process.env.ADMIN_EMAIL || 'official@aishwaryamanikarnike.com',
      subject: `New ${effectiveSlug} inquiry from ${userName}`,
      html: notificationHtml,
      replyTo: userEmail,
    });

    if (notificationResult.error) {
      console.error('Failed to send notification email:', notificationResult.error);
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    // 5. Send auto-reply to user (if email exists and it's NOT a cohort enrollment)
    if (userEmail && formSlug !== 'cohort_enrollment') {
      const finalSubject = customAutoReply?.subject || templateConfig.subject;
      
      let processedCustomMsg = customAutoReply?.message || '';
      if (processedCustomMsg) {
          processedCustomMsg = processedCustomMsg.replace(/{{name}}/g, userName);
      }

      const finalHtml = processedCustomMsg 
        ? `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333333;">${processedCustomMsg}</div>` 
        : autoReplyHtml;

      const autoReplyResult = await resendClient.emails.send({
        from: 'Aishwarya Manikarnike <official@email.aishwaryamanikarnike.com>',
        to: userEmail,
        subject: finalSubject,
        html: finalHtml,
        replyTo: 'official@aishwaryamanikarnike.com',
      });

      if (autoReplyResult.error) {
        console.error('Failed to send auto-reply:', autoReplyResult.error);
      }
    }

    // Update rate limit
    submissionTimes.set(ip, now);

    // Clean up old entries (prevent memory leak)
    setTimeout(() => {
      submissionTimes.delete(ip);
    }, RATE_LIMIT_WINDOW);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error in send-email API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
