'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, CheckCircle2, AlertCircle, Loader2, FileText, Lock } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
    id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    video_duration: number | null;
    is_free_preview: boolean;
    order_index: number;
}

export default function LessonPage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const lessonId = params.lessonId as string;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchLesson();
    }, [lessonId]);

    const fetchLesson = async () => {
        setLoading(true);
        setError(null);
        setVideoUrl(null);
        setPdfUrl(null);

        try {
            // Get session
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            const token = session?.access_token;

            if (!user) {
                setError('Please log in to access this lesson.');
                setLoading(false);
                return;
            }

            // Check if user is admin or editor
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const isAdminOrEditor = profile && (profile.role === 'admin' || profile.role === 'editor');

            if (!isAdminOrEditor) {
                const { data: student } = await supabase
                    .from('students')
                    .select('id')
                    .eq('auth_user_id', user.id)
                    .single();

                if (!student) {
                    setError('You are not enrolled in this course.');
                    setLoading(false);
                    return;
                }

                setStudentId(student.id);

                // Verify active enrollment in this specific course
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('id, cohorts!inner(course_id)')
                    .eq('student_id', student.id)
                    .eq('status', 'active')
                    .eq('cohorts.course_id', courseId);

                if (!enrollments || enrollments.length === 0) {
                    setError('You are not enrolled in this course.');
                    setLoading(false);
                    return;
                }

                // Check existing progress
                const { data: prog } = await supabase
                    .from('lesson_progress')
                    .select('completed')
                    .eq('student_id', student.id)
                    .eq('lesson_id', lessonId)
                    .single();

                if (prog?.completed) setCompleted(true);
            }

            // Get lesson metadata
            const { data: lessonData, error: lessonError } = await supabase
                .from('course_lessons')
                .select('*')
                .eq('id', lessonId)
                .single();

            if (lessonError || !lessonData) {
                setError('Lesson not found or you do not have permission to view it.');
                setLoading(false);
                return;
            }

            setLesson(lessonData);

            // Request presigned URL if there's a video or PDF
            if (lessonData.video_url) {
                const res = await fetch(`/api/portal/media/${lessonId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.videoUrl) setVideoUrl(data.videoUrl);
                    if (data.pdfUrl) setPdfUrl(data.pdfUrl);
                } else if (res.status === 403) {
                    setError('You are not enrolled in this course.');
                } else if (res.status === 401) {
                    setError('Please log in to access this lesson.');
                } else {
                    setError('Failed to load lesson content. Please try again.');
                }
            }
        } catch (err) {
            console.error('Failed to fetch lesson:', err);
            setError('Failed to load lesson. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const markComplete = useCallback(async () => {
        if (!studentId || completed) return;
        setCompleted(true);
        await supabase.from('lesson_progress').upsert({
            student_id: studentId,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
        }, { onConflict: 'student_id,lesson_id' });
    }, [studentId, lessonId, completed]);

    const saveProgress = useCallback(async (currentTime: number) => {
        if (!studentId) return;
        await supabase.from('lesson_progress').upsert({
            student_id: studentId,
            lesson_id: lessonId,
            last_watched_seconds: Math.floor(currentTime),
        }, { onConflict: 'student_id,lesson_id' });
    }, [studentId, lessonId]);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const { currentTime, duration } = videoRef.current;
        // Mark complete at 90%
        if (duration > 0 && currentTime / duration >= 0.9) {
            markComplete();
        }
        // Save position every 10s
        if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
        progressSaveTimer.current = setTimeout(() => saveProgress(currentTime), 10000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-navy-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back */}
            <Link href={`/portal/${courseId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Curriculum
            </Link>

            {/* Lesson title */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Now Playing</p>
                    <h1 className="text-xl font-bold text-slate-900">{lesson?.title}</h1>
                    {lesson?.description && <p className="text-slate-500 text-sm mt-1">{lesson.description}</p>}
                </div>
                {completed && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">Completed</span>
                    </div>
                )}
            </div>

            {error ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    {error.includes('not enrolled') ? (
                        <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    ) : (
                        <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
                    )}
                    <p className="text-slate-600 font-medium">{error}</p>
                </div>
            ) : videoUrl ? (
                <>
                    {/* Secure Video Player */}
                    <div
                        className="bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 select-none"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            controls
                            controlsList="nodownload noremoteplayback"
                            disablePictureInPicture
                            className="w-full aspect-video"
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={markComplete}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>

                    {/* Mark complete button (manual) */}
                    {!completed && (
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={markComplete}
                                className="flex items-center gap-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-4 py-2 transition-all"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Mark as Complete
                            </button>
                        </div>
                    )}
                </>
            ) : !lesson?.video_url ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Video content for this lesson is being uploaded. Check back soon!</p>
                </div>
            ) : null}

            {/* PDF Viewer */}
            {pdfUrl && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Lesson Notes</span>
                    </div>
                    <div
                        className="select-none"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <iframe
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                            className="w-full"
                            style={{ height: '600px', border: 'none' }}
                            title="Lesson Notes"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
