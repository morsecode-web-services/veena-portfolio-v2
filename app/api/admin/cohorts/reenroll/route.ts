import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createPersonalizedPaymentLink } from '@/lib/razorpay';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ReenrollInvite from '@/emails/ReenrollInvite';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 1. Session & Auth Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse Input
    const { sourceCohortId, targetCohortId } = await request.json();

    if (!sourceCohortId || !targetCohortId) {
      return NextResponse.json({ error: 'Missing cohort IDs' }, { status: 400 });
    }

    // 3. Fetch Cohort Details
    const { data: targetCohort, error: targetError } = await supabaseAdmin
      .from('cohorts')
      .select('*')
      .eq('id', targetCohortId)
      .single();

    if (targetError || !targetCohort) return NextResponse.json({ error: 'Target cohort not found' }, { status: 404 });

    // ── Fetch Global Automation Settings ──────────────────────────────
    const { data: configData } = await supabaseAdmin
      .from('site_config')
      .select('data')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();
    
    const automation = configData?.data?.automation || { email_enabled: true };
    
    if (!automation.email_enabled) {
      return NextResponse.json({ error: 'Email notifications are currently disabled in the Automations tab.' }, { status: 400 });
    }

    // 4. Fetch Students from Source Cohort
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('form_submissions')
      .select('user_name, user_email, form_data')
      .eq('cohort_id', sourceCohortId)
      .eq('payment_status', 'paid');

    if (studentsError) return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    if (!students || students.length === 0) return NextResponse.json({ message: 'No students found to invite' });

    // 5. Fetch existing enrollments for target to skip them
    const { data: existingEnrollments } = await supabaseAdmin
      .from('form_submissions')
      .select('user_email')
      .eq('cohort_id', targetCohortId)
      .eq('payment_status', 'paid');

    const enrolledEmails = new Set(existingEnrollments?.map(e => e.user_email) || []);

    // 6. Process Invitations
    const results = {
      total: students.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[]
    };

    for (const student of students) {
      const name = student.user_name || 'Student';
      const email = student.user_email;

      if (!email) {
        results.failed++;
        continue;
      }

      // ── Duplicate Check ─────────────────────────────────────────────
      // Skip if this student has already been invited to this target cohort
      const { data: existingLog } = await supabaseAdmin
        .from('reenrollment_logs')
        .select('id')
        .eq('target_cohort_id', targetCohortId)
        .eq('student_email', email)
        .eq('status', 'sent')
        .single();

      if (existingLog) {
        results.skipped++;
        continue;
      }

      // Use standard cohort price
      const finalPrice = targetCohort.price;

      // Generate Razorpay Link
      const plink = await createPersonalizedPaymentLink({
        name,
        email,
        phone: student.form_data?.phone,
        amount: finalPrice,
        description: `Hi ${name}! Enrollment for ${targetCohort.title}`,
        cohortId: targetCohortId
      });

      if (!plink.success) {
        results.failed++;
        await supabaseAdmin.from('reenrollment_logs').insert([{
          source_cohort_id: sourceCohortId,
          target_cohort_id: targetCohortId,
          student_name: name,
          student_email: email,
          status: 'failed',
          error_message: plink.error
        }]);
        continue;
      }

      // Send Email
      try {
        const html = await render(ReenrollInvite({
          name,
          cohortTitle: targetCohort.title,
          paymentLink: plink.short_url!,
          price: `₹${(finalPrice / 100).toLocaleString()}`
        }));

        await resend.emails.send({
          from: 'Aishwarya Manikarnike <official@email.aishwaryamanikarnike.com>',
          to: email,
          subject: `✨ Your invitation for ${targetCohort.title}`,
          html,
          replyTo: 'official@aishwaryamanikarnike.com',
        });

        results.sent++;
        await supabaseAdmin.from('reenrollment_logs').insert([{
          source_cohort_id: sourceCohortId,
          target_cohort_id: targetCohortId,
          student_name: name,
          student_email: email,
          payment_link_id: plink.id,
          payment_link_url: plink.short_url,
          status: 'sent'
        }]);

        // ── Rate Limit Safety ───────────────────────────────────────
        // Add a 200ms breather between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (emailErr: any) {
        results.failed++;
        await supabaseAdmin.from('reenrollment_logs').insert([{
          source_cohort_id: sourceCohortId,
          target_cohort_id: targetCohortId,
          student_name: name,
          student_email: email,
          status: 'failed',
          error_message: `Email failed: ${emailErr.message}`
        }]);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Re-enroll API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
