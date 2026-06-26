import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendTwilioWhatsApp } from '@/lib/notifications/twilio';
import { generateAndUploadCertificate } from '@/lib/certificates/generate';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: cohortId } = await params;
    const body = await request.json();
    const { student_ids } = body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid student_ids array' }, { status: 400 });
    }

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

    // Fetch the cohort and template
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select('title, month_name')
      .eq('id', cohortId)
      .single();

    if (cohortError || !cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    const { data: template, error: templateError } = await supabaseAdmin
      .from('cohort_certificate_templates')
      .select('id')
      .eq('cohort_id', cohortId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        {
          error:
            'Certificate template not configured for this cohort. Please build a template first.',
        },
        { status: 400 }
      );
    }

    // Fetch students
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select('id, student_id, students(name, phone)')
      .eq('cohort_id', cohortId)
      .in('student_id', student_ids);

    if (enrollmentsError) {
      return NextResponse.json({ error: enrollmentsError.message }, { status: 500 });
    }

    let successCount = 0;
    let failedCount = 0;
    const failures = [];

    // We'll process sequentially for now.
    for (const enrollment of enrollments || []) {
      try {
        const student = enrollment.students as any;
        if (!student || !student.phone) {
          throw new Error('Student phone number missing');
        }

        // 1. Generate PNG and Upload to Supabase Storage
        // This checks if it already exists and skips regeneration, or generates a new one.
        const pdfUrl = await generateAndUploadCertificate(enrollment.id);

        // 2. Send WhatsApp notification
        const message = `Hi ${student.name}! Congratulations on completing ${cohort.title}. Here is your digital certificate: ${pdfUrl}`;

        const contentSid = process.env.TWILIO_WHATSAPP_CERTIFICATE_CONTENT_SID;
        const contentVariables = JSON.stringify({
          '1': student.name,
          '2': cohort.title,
          '3': pdfUrl, // Included in case the template uses {{3}} for the link
        });

        const twilioRes = await sendTwilioWhatsApp(
          student.phone,
          message,
          contentSid,
          contentVariables
        );
        if (!twilioRes.success) throw new Error(twilioRes.error);

        // 3. Update database: Record that it was sent
        await supabaseAdmin
          .from('enrollments')
          .update({
            certificate_sent_at: new Date().toISOString(),
            // certificate_url is already updated by generateAndUploadCertificate
          })
          .eq('id', enrollment.id);

        successCount++;
      } catch (err: any) {
        console.error(`Error sending cert to ${enrollment.student_id}:`, err);
        failedCount++;
        failures.push({ student_id: enrollment.student_id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      success_count: successCount,
      failed_count: failedCount,
      failures,
    });
  } catch (error: any) {
    console.error('Send certificates API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
