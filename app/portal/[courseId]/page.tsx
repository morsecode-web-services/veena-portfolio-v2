'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Lock, PlayCircle, FileText, ChevronLeft, Clock } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
    id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    video_duration: number | null;
    is_free_preview: boolean;
    order_index: number;
    completed?: boolean;
}

interface Course {
    id: string;
    title: string;
    description: string | null;
}

export default function CourseCurriculumPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState<string | null>(null);

    useEffect(() => {
        fetchCurriculum();
    }, [courseId]);

    const fetchCurriculum = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/portal/login');
                return;
            }

            // Check if user is admin or editor
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const isAdminOrEditor = profile && (profile.role === 'admin' || profile.role === 'editor');

            let studentIdVal = null;

            if (!isAdminOrEditor) {
                const { data: student } = await supabase
                    .from('students')
                    .select('id')
                    .eq('auth_user_id', user.id)
                    .single();

                if (!student) {
                    router.replace('/portal');
                    return;
                }
                studentIdVal = student.id;
                setStudentId(student.id);

                // Verify enrollment
                const { data: enrollments } = await supabase
                    .from('enrollments')
                    .select('id, cohorts!inner(course_id)')
                    .eq('student_id', student.id)
                    .eq('status', 'active')
                    .eq('cohorts.course_id', courseId);

                if (!enrollments || enrollments.length === 0) {
                    router.replace('/portal');
                    return;
                }
            }

            // Get course info
            const { data: courseData } = await supabase
                .from('courses')
                .select('id, title, description')
                .eq('id', courseId)
                .single();

            setCourse(courseData);

            // Get lessons
            const { data: lessonData } = await supabase
                .from('course_lessons')
                .select('id, title, description, video_url, video_duration, is_free_preview, order_index')
                .eq('course_id', courseId)
                .order('order_index', { ascending: true });

            const lessonList = lessonData || [];

            // Get progress
            if (studentIdVal) {
                const { data: progress } = await supabase
                    .from('lesson_progress')
                    .select('lesson_id, completed')
                    .eq('student_id', studentIdVal)
                    .in('lesson_id', lessonList.map((l: any) => l.id));

                const completedSet = new Set((progress || []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));
                setLessons(lessonList.map((l: any) => ({ ...l, completed: completedSet.has(l.id) })));
            } else {
                // For admins/editors, just show everything as uncompleted
                setLessons(lessonList.map((l: any) => ({ ...l, completed: false })));
            }
        } catch (err) {
            console.error('Failed to load curriculum:', err);
            router.replace('/portal');
        } finally {
            setLoading(false);
        }
    };

    const completedCount = lessons.filter(l => l.completed).length;
    const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return null;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-navy-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back */}
            <Link href="/portal" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>

            {/* Course Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <h1 className="text-xl font-bold text-slate-900 mb-1">{course?.title}</h1>
                {course?.description && <p className="text-slate-500 text-sm mb-4">{course.description}</p>}

                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">{completedCount} of {lessons.length} lessons completed</span>
                    <span className="text-xs font-bold text-slate-700">{progressPct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
            </div>

            {/* Lesson List */}
            <div className="space-y-2">
                {lessons.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">Course content is being prepared. Check back soon!</p>
                    </div>
                ) : (
                    lessons.map((lesson, i) => (
                        <motion.div
                            key={lesson.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <Link
                                href={`/portal/${courseId}/lesson/${lesson.id}`}
                                className="group flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                    {lesson.completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : lesson.video_url ? (
                                        <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-slate-200" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lesson {i + 1}</span>
                                        {lesson.is_free_preview && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Free Preview</span>
                                        )}
                                    </div>
                                    <p className="font-semibold text-sm text-slate-900 truncate">{lesson.title}</p>
                                    {lesson.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{lesson.description}</p>}
                                </div>

                                {/* Meta */}
                                <div className="flex-shrink-0 flex items-center gap-3">
                                    {lesson.video_url && (
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <PlayCircle className="w-3.5 h-3.5" />
                                            {formatDuration(lesson.video_duration) && (
                                                <span className="text-xs">{formatDuration(lesson.video_duration)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
