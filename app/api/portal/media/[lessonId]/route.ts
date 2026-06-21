import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPresignedGetUrl } from '@/lib/r2';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/portal/media/[lessonId]
 * Security gate: validates enrollment, then returns a short-lived presigned URL.
 * - 401: not authenticated
 * - 403: not enrolled in this lesson's cohort
 * - 200: { videoUrl?, pdfUrl? }
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    try {
        const { lessonId } = await params;

        // 1. Validate session
        const authHeader = request.headers.get('Authorization');
        let userId: string | null = null;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id || null;
        }

        if (!userId) {
            // Try cookie-based session via the anon key
            const cookieHeader = request.headers.get('Cookie') || '';
            // For client-side calls without Bearer header, we use the session cookie approach
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get student record
        const { data: student } = await supabaseAdmin
            .from('students')
            .select('id')
            .eq('auth_user_id', userId)
            .single();

        if (!student) {
            return NextResponse.json({ error: 'Student record not found' }, { status: 403 });
        }

        // 3. Get lesson + verify enrollment
        const { data: lesson } = await supabaseAdmin
            .from('course_lessons')
            .select(`
                id, video_url, is_free_preview,
                courses (
                    id,
                    cohorts (id)
                )
            `)
            .eq('id', lessonId)
            .single();

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Free preview: skip enrollment check
        if (!lesson.is_free_preview) {
            const cohortIds = (lesson as any).courses?.cohorts?.map((c: any) => c.id) || [];
            if (cohortIds.length === 0) {
                return NextResponse.json({ error: 'Lesson not linked to any cohort' }, { status: 403 });
            }

            const { data: enrollment } = await supabaseAdmin
                .from('enrollments')
                .select('id')
                .eq('student_id', student.id)
                .in('cohort_id', cohortIds)
                .eq('status', 'active')
                .single();

            if (!enrollment) {
                return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
            }
        }

        // 4. Generate presigned URL(s) from Cloudflare R2
        const result: { videoUrl?: string; pdfUrl?: string } = {};

        if (lesson.video_url) {
            // video_url stores the R2 object key (e.g. 'courses/lesson-abc/video.mp4')
            if (lesson.video_url.endsWith('.pdf')) {
                result.pdfUrl = await getPresignedGetUrl(lesson.video_url, 3600);
            } else {
                result.videoUrl = await getPresignedGetUrl(lesson.video_url, 3600);
            }
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Portal Media API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
