import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateConfig } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';
import { saveDbConfig, getDbConfig } from '@/lib/db-config';

// Initialize Supabase (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET - Retrieve the current site configuration
 */
export async function GET() {
  try {
    const data = await getDbConfig();
    if (data) {
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  } catch (error) {
    console.error('[Config API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
}

/**
 * POST - Update the site configuration
 */
export async function POST(request: Request) {
  try {
    // 1. Session Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check if user is admin/editor (based on profiles table)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse and Validate Data
    const newData = await request.json();
    const validation = validateConfig(newData);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    // 3. Save to Database
    const success = await saveDbConfig(validation.data, token);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
    }
    // 4. Trigger ISR Revalidation
    try {
      revalidatePath('/');
      revalidatePath('/cohorts');
      const { revalidateTag } = await import('next/cache');
      revalidateTag('config');
    } catch (e) {
      console.error('[Config API] Failed to revalidate cache:', e);
    }

    return NextResponse.json({ success: true, data: validation.data });
  } catch (error) {
    console.error('[Config API] POST Error:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
