import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createClient } from '@supabase/supabase-js';
import PerformanceInquiry from '@/emails/PerformanceInquiry';
import ClassesInquiry from '@/emails/ClassesInquiry';
import CollaborationInquiry from '@/emails/CollaborationInquiry';
import GeneralInquiry from '@/emails/GeneralInquiry';
import ContactNotification from '@/emails/ContactNotification';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { name, email, phone, inquiryType, message } = body;

    // Validate required fields
    if (!name || !email || !phone || !inquiryType || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate inquiry type
    if (!['performance', 'classes', 'collaboration', 'general'].includes(inquiryType)) {
      return NextResponse.json(
        { error: 'Invalid inquiry type' },
        { status: 400 }
      );
    }

    // 1. Store lead in Supabase
    const { error: dbError } = await supabase.from('leads').insert([
      {
        name,
        email,
        phone,
        inquiry_type: inquiryType,
        message,
      },
    ]);

    if (dbError) {
      console.error('Failed to store lead in Supabase:', dbError);
      // Continue even if database insert fails (graceful degradation)
    }

    // 2. Get the appropriate auto-reply template
    const templateConfig =
      emailTemplates[inquiryType as keyof typeof emailTemplates] ||
      emailTemplates.general;

    // 3. Render React component to HTML
    const autoReplyHtml = await render(templateConfig.component({ name }));
    const notificationHtml = await render(
      ContactNotification({ name, email, phone, inquiryType, message })
    );

    // 4. Send notification email to you
    const notificationResult = await resend.emails.send({
      // from: 'Contact Form <noreply@aishwaryamanikarnike.com>',
      from: 'Contact Form <onboarding@resend.dev>', // Change to your domain after verification                           
      to: process.env.ADMIN_EMAIL || 'your@email.com', // Add this to .env.local
      subject: `New ${inquiryType} inquiry from ${name}`,
      html: notificationHtml,
      replyTo: email, // Allow quick reply
    });

    if (notificationResult.error) {
      console.error('Failed to send notification email:', notificationResult.error);
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    // 5. Send auto-reply to user
    const autoReplyResult = await resend.emails.send({
      // from: 'Aishwarya Manikarnike <noreply@aishwaryamanikarnike.com>',
      from: 'Contact Form <onboarding@resend.dev>', // Change to your domain after verification                           
      to: email,
      subject: templateConfig.subject,
      html: autoReplyHtml,
    });

    if (autoReplyResult.error) {
      console.error('Failed to send auto-reply:', autoReplyResult.error);
      // Don't fail the request if auto-reply fails - notification is more important
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
