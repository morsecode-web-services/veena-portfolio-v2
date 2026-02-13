import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { validateConfig } from '@/lib/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (server-side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CONFIG_PATH = path.join(process.cwd(), 'public', 'config', 'site-config.json');

/**
 * GET - Retrieve the current site configuration
 */
export async function GET() {
    try {
        const fileContents = await readFile(CONFIG_PATH, 'utf-8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
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
        // 1. Basic Session Check (Simplified for now, expecting Bearer token)
        // In a real prod env, we'd use @supabase/auth-helpers-nextjs or similar
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

        // 2. Parse and Validate Data
        const newData = await request.json();
        const validation = validateConfig(newData);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.format()
            }, { status: 400 });
        }

        // 3. Write to File
        // Note: This only works in local development or environments with persistent FS
        // For Vercel/Netlify, this will write to the ephemeral disk.
        // In a final production version, we might want to sync this to Supabase storage or a DB.
        await writeFile(CONFIG_PATH, JSON.stringify(validation.data, null, 2), 'utf-8');

        return NextResponse.json({ success: true, data: validation.data });
    } catch (error) {
        console.error('[Config API] POST Error:', error);
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }
}
