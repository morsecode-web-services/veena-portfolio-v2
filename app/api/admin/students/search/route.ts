import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const filter = searchParams.get('filter');

    if (filter !== 'unjoined' && (!query || query.length < 2)) {
      return NextResponse.json({ results: [] });
    }

    let data: any[] = [];

    if (filter === 'unjoined') {
      const { data: enrollments, error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .select(`
          id,
          created_at,
          telegram_joined,
          telegram_username,
          telegram_invite_link,
          status,
          students (
            id,
            name,
            email,
            phone
          ),
          cohorts (
            title
          )
        `)
        .eq('status', 'active')
        .eq('telegram_joined', false)
        .order('created_at', { ascending: false });

      if (enrollError) throw enrollError;

      data = (enrollments || []).map((e: any) => ({
        id: e.id,
        student_id: e.students?.id,
        name: e.students?.name || 'Unknown',
        email: e.students?.email || 'Unknown',
        phone: e.students?.phone || '',
        cohort_title: e.cohorts?.title || 'Unknown',
        type: 'enrollment',
        status: 'paid',
        created_at: e.created_at,
        payment_link_url: e.telegram_invite_link,
        telegram_joined: e.telegram_joined,
        telegram_username: e.telegram_username,
        amount: null
      }));
    } else if (query) {
      const { data: matchedStudents, error: searchError } = await supabaseAdmin
        .from('students')
        .select(`
          id,
          name,
          email,
          phone,
          enrollments (
            id,
            created_at,
            telegram_joined,
            telegram_username,
            telegram_invite_link,
            status,
            cohorts (
              title
            ),
            payments (
              amount,
              status
            )
          ),
          reenrollment_invitations (
            id,
            created_at,
            payment_link_url,
            status,
            cohorts:target_cohort_id (
              title
            )
          )
        `)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (searchError) throw searchError;

      const flatResults: any[] = [];
      (matchedStudents || []).forEach((student: any) => {
        // Add enrollments
        if (student.enrollments) {
          student.enrollments.forEach((e: any) => {
            const paidPayment = e.payments?.find((p: any) => p.status === 'paid');
            flatResults.push({
              id: e.id,
              student_id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone || '',
              cohort_title: e.cohorts?.title || 'Unknown',
              type: 'enrollment',
              status: e.status === 'active' ? 'paid' : e.status,
              created_at: e.created_at,
              payment_link_url: e.telegram_invite_link,
              telegram_joined: e.telegram_joined || false,
              telegram_username: e.telegram_username || null,
              amount: paidPayment ? paidPayment.amount : null
            });
          });
        }
        
        // Add invitations
        if (student.reenrollment_invitations) {
          student.reenrollment_invitations.forEach((ri: any) => {
            flatResults.push({
              id: ri.id,
              student_id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone || '',
              cohort_title: ri.cohorts?.title || 'Unknown',
              type: 'invitation',
              status: ri.status,
              created_at: ri.created_at,
              payment_link_url: ri.payment_link_url,
              telegram_joined: false,
              telegram_username: null,
              amount: null
            });
          });
        }

        // Handle case where student exists but has no enrollments or invitations
        if ((!student.enrollments || student.enrollments.length === 0) && 
            (!student.reenrollment_invitations || student.reenrollment_invitations.length === 0)) {
          flatResults.push({
            id: student.id,
            student_id: student.id,
            name: student.name,
            email: student.email,
            phone: student.phone || '',
            cohort_title: 'No Cohorts Enrolled',
            type: 'enrollment',
            status: 'pending',
            created_at: new Date().toISOString(),
            payment_link_url: null,
            telegram_joined: false,
            telegram_username: null,
            amount: null
          });
        }
      });

      data = flatResults;
    }

    // 3. Group Results by Email
    const groupedMap = new Map<string, any>();

    data.forEach(item => {
      const email = item.email.toLowerCase();
      if (!groupedMap.has(email)) {
        groupedMap.set(email, {
            id: item.id,
            student_id: item.student_id,
            name: item.name,
            email: item.email,
            phone: item.phone,
            cohorts: []
        });
      }
      
      const student = groupedMap.get(email);
      student.cohorts.push({
        id: item.id,
        title: item.cohort_title || 'Unknown',
        type: item.type,
        status: item.status,
        date: item.created_at,
        link: item.payment_link_url,
        telegram_joined: item.telegram_joined || false,
        telegram_username: item.telegram_username || null,
        amount: item.amount || null
      });
    });

    const results = Array.from(groupedMap.values());
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('[Student Search API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
