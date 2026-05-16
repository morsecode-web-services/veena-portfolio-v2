import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Query the unified view
    const { data, error } = await supabaseAdmin
      .from('student_search_view')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });

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
        link: item.payment_link_url
      });
    });

    const results = Array.from(groupedMap.values());
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('[Student Search API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
