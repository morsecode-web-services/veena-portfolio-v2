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
        const { lessonData } = await request.json();

        if (!lessonData || !lessonData.course_id || !lessonData.title) {
            return NextResponse.json({ error: 'Missing required fields course_id or title' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('course_lessons')
            .insert([lessonData])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error('[Lessons API POST] Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to create lesson' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const auth = await checkAdminAuth(request);
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const body = await request.json();

        if (body.updates && Array.isArray(body.updates)) {
            // Batch update (e.g. for reordering)
            const results = [];
            for (const update of body.updates) {
                if (!update.id || !update.data) {
                    return NextResponse.json({ error: 'Invalid batch update structure' }, { status: 400 });
                }

                const { data, error } = await supabaseAdmin
                    .from('course_lessons')
                    .update(update.data)
                    .eq('id', update.id)
                    .select();

                if (error) throw error;
                results.push(data);
            }
            return NextResponse.json({ data: results });
        } else {
            // Single update
            const { id, data: updateData } = body;

            if (!id || !updateData) {
                return NextResponse.json({ error: 'Missing id or update data' }, { status: 400 });
            }

            const { data, error } = await supabaseAdmin
                .from('course_lessons')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ data });
        }
    } catch (err: any) {
        console.error('[Lessons API PUT] Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to update lesson' }, { status: 500 });
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
            .from('course_lessons')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (err: any) {
        console.error('[Lessons API DELETE] Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to delete lesson' }, { status: 500 });
    }
}
