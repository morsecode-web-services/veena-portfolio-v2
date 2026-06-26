import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    // 1. Session & Auth Check
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
    }

    // 3. Fetch logs from database
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('telegram_invite_logs')
      .select('*')
      .eq('enrollment_id', submissionId)
      .order('created_at', { ascending: false });

    if (logsError) {
      throw logsError;
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (error: any) {
    console.error('[Get Telegram Invite Logs API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
