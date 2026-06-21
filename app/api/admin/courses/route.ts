import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdminAuth(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return { error: 'Unauthorized', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !user) {
        return { error: 'Invalid session', status: 401 };
    }

    const { data: profile } = await supabaseAnon
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
        return { error: 'Forbidden', status: 403 };
    }

    return { user, profile };
}

export async function POST(request: Request) {
    const auth = await checkAdminAuth(request);
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { courseData } = await request.json();

        if (!courseData || !courseData.title) {
            return NextResponse.json({ error: 'Missing course title' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('courses')
            .insert([courseData])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error('[Courses API POST] Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to create course' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const auth = await checkAdminAuth(request);
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { id, courseData } = await request.json();

        if (!id || !courseData) {
            return NextResponse.json({ error: 'Missing id or courseData' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('courses')
            .update(courseData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error('[Courses API PUT] Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to update course' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const auth = await checkAdminAuth(request);
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('courses')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error('[Courses API DELETE] Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to delete course' }, { status: 500 });
    }
}
