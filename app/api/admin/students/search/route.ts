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

    let queryBuilder = supabaseAdmin
      .from('student_search_view')
      .select('*');

    if (filter === 'unjoined') {
      queryBuilder = queryBuilder
        .eq('type', 'enrollment')
        .eq('status', 'paid')
        .or('telegram_joined.eq.false,telegram_joined.is.null')
        .order('created_at', { ascending: false });
    } else if (query) {
      queryBuilder = queryBuilder
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    // 3. Group Results by Email
    const groupedMap = new Map<string, any>();

    (data || []).forEach(item => {
      const email = item.email.toLowerCase();
      if (!groupedMap.has(email)) {
        groupedMap.set(email, {
            id: item.id,
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
