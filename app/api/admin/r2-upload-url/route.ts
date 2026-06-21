import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPresignedPutUrl } from '@/lib/r2';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        // 1. Session Check
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

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

        // 2. Parse and Validate Request Body
        const { courseId, filename, contentType } = await request.json();

        if (!courseId || !filename || !contentType) {
            return NextResponse.json(
                { error: 'Missing required fields: courseId, filename, contentType' },
                { status: 400 }
            );
        }

        // 3. Generate key and presigned URL
        const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `courses/${courseId}/${Date.now()}-${cleanFilename}`;

        const uploadUrl = await getPresignedPutUrl(key, contentType);

        return NextResponse.json({ uploadUrl, key });
    } catch (error) {
        console.error('[R2 Upload URL API] Error:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
}
