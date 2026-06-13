import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    // 1. Session & Auth Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
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

    // 2. Parse Input
    const { submissionId, telegramJoined, telegramUsername } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
    }

    // 3. Update Enrollment Status
    const updateData: any = {
      telegram_joined: !!telegramJoined,
      telegram_username: telegramJoined ? (telegramUsername || null) : null
    };

    const { error: dbError } = await supabaseAdmin
      .from('enrollments')
      .update(updateData)
      .eq('id', submissionId);

    if (dbError) {
      throw dbError;
    }

    // 4. Log manual status update in telegram_invite_logs
    await supabaseAdmin.from('telegram_invite_logs').insert([{
      enrollment_id: submissionId,
      action: telegramJoined ? 'joined' : 'left',
      telegram_username: telegramJoined ? (telegramUsername || 'Manual Admin Overwrite') : null,
      created_by: user.email || 'admin',
      payload: { info: telegramJoined ? 'Manually marked as joined by admin' : 'Manually marked as left by admin' }
    }]);

    return NextResponse.json({ success: true, telegram_joined: !!telegramJoined });

  } catch (error: any) {
    console.error('[Manual Join API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
