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
    const { targetCohortId, students } = await request.json();

    if (!targetCohortId || !students || !Array.isArray(students)) {
      return NextResponse.json({ error: 'Missing target cohort ID or student list' }, { status: 400 });
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
      return NextResponse.json({ error: 'Email notifications are currently disabled.' }, { status: 400 });
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
        .eq('student_email', email)
        .single();

      if (existingLog && (existingLog.status === 'sent' || existingLog.status === 'paid')) {
        results.skipped++;
        continue;
      }

      // 2. Check if already enrolled in target cohort (actual submission)
      const { data: actualEnrollment } = await supabaseAdmin
        .from('form_submissions')
        .select('id')
        .eq('cohort_id', targetCohortId)
        .eq('user_email', email)
        .eq('payment_status', 'paid')
        .single();

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
          await supabaseAdmin.from('reenrollment_logs').upsert([{
            target_cohort_id: targetCohortId,
            student_name: name,
            student_email: email,
            student_phone: phone || null,
            status: 'failed',
            error_message: plink.error
          }], { onConflict: 'target_cohort_id,student_email' });
          continue;
        }
        inviteLinkUrl = plink.short_url!;
        paymentLinkId = plink.id!;
      }

      // Send Email
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

        results.sent++;
        await supabaseAdmin.from('reenrollment_logs').upsert([{
          target_cohort_id: targetCohortId,
          student_name: name,
          student_email: email,
          student_phone: phone || null,
          payment_link_id: paymentLinkId,
          payment_link_url: inviteLinkUrl,
          status: 'sent'
        }], { onConflict: 'target_cohort_id,student_email' });

        // Small breather
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailErr: any) {
        results.failed++;
        await supabaseAdmin.from('reenrollment_logs').upsert([{
          target_cohort_id: targetCohortId,
          student_name: name,
          student_email: email,
          student_phone: phone || null,
          status: 'failed',
          error_message: `Email failed: ${emailErr.message}`
        }], { onConflict: 'target_cohort_id,student_email' });
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Re-enroll API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
