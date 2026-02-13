import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    const { name, email, phone, inquiryType, message, formSlug, form_data } = body;

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
    if (formSlug) {
      const { data: config } = await supabase
        .from('form_configs')
        .select('email_notifications_enabled, fields')
        .eq('form_slug', formSlug)
        .single();

      if (config) {
        if (config.email_notifications_enabled === false) {
          emailEnabled = false;
        }
        formFields = config.fields || [];
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

    const discoveredName = name || getFieldByTypeOrName('text', ['name', 'full name']);
    const discoveredEmail = email || getFieldByTypeOrName('email', ['email', 'email address']);
    const discoveredPhone = phone || getFieldByTypeOrName('tel', ['phone', 'contact', 'mobile', 'whatsapp']);
    const discoveredMessage = message || form_data?.message || form_data?.comments || 'No message provided';

    // 1. Store lead in Supabase
    const { error: dbError } = await supabase.from('leads').insert([
      {
        form_slug: formSlug || 'general',
        form_data: form_data || body,
        status: 'new',
        name: discoveredName || 'Anonymous',
      },
    ]);

    if (dbError) {
      console.error('Failed to store lead in Supabase:', dbError);
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
        message: userMessage
      })
    );

    // 4. Send notification email to you
    const resendClient = getResend();
    if (!resendClient) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const notificationResult = await resendClient.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL || 'your@email.com',
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

    // 5. Send auto-reply to user (if email exists)
    if (userEmail) {
      const autoReplyResult = await resendClient.emails.send({
        from: 'Contact Form <onboarding@resend.dev>',
        to: userEmail,
        subject: templateConfig.subject,
        html: autoReplyHtml,
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
