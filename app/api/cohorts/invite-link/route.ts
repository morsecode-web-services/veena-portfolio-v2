import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    // We updated the webhook handler to use paymentId as the event_id for idempotency
    const { data: log, error } = await supabaseAdmin
      .from('webhook_logs')
      .select('status, notification_status')
      .eq('event_id', paymentId)
      .maybeSingle();

    if (error || !log) {
      return NextResponse.json({ status: 'pending' });
    }

    // If it's still pending, return pending
    if (log.status === 'pending') {
      return NextResponse.json({ status: 'pending' });
    }

    // If processed, extract the telegram link
    const link = log.notification_status?.telegram?.link;
    if (link) {
      return NextResponse.json({ status: 'success', link });
    } else {
      return NextResponse.json({ status: 'failed', error: 'No link generated' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
