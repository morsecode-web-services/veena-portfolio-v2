'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface Enrollment {
    id: string;
    cohort_id: string;
    status: string;
    created_at: string;
    cohorts: {
        id: string;
        title: string;
        description: string;
        image_url: string;
        course_id: string;
    };
}

interface LessonCount {
    course_id: string;
    total: number;
    completed: number;
}

export default function PortalDashboard() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [lessonCounts, setLessonCounts] = useState<Record<string, LessonCount>>({});
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get student record
            const { data: student } = await supabase
                .from('students')
                .select('id, name')
                .eq('auth_user_id', user.id)
                .single();

            if (!student) return;
            setStudentName(student.name || user.email || '');

            // Get enrollments with cohort info
            const { data: enrollmentData } = await supabase
                .from('enrollments')
                .select(`
                    id, cohort_id, status, created_at,
                    cohorts (id, title, description, image_url, course_id)
                `)
                .eq('student_id', student.id)
                .eq('status', 'active');

            const enr = (enrollmentData as any[]) || [];
            setEnrollments(enr);

            // Get lesson progress for each course
            const courseIds = enr.map((e: any) => e.cohorts?.course_id).filter(Boolean);
            if (courseIds.length > 0) {
                const { data: lessons } = await supabase
                    .from('course_lessons')
                    .select('id, course_id')
                    .in('course_id', courseIds);

                const { data: progress } = await supabase
                    .from('lesson_progress')
                    .select('lesson_id, completed')
                    .eq('student_id', student.id)
                    .eq('completed', true);

                const completedIds = new Set((progress || []).map((p: any) => p.lesson_id));
                const counts: Record<string, LessonCount> = {};
                (lessons || []).forEach((l: any) => {
                    if (!counts[l.course_id]) counts[l.course_id] = { course_id: l.course_id, total: 0, completed: 0 };
                    counts[l.course_id].total++;
                    if (completedIds.has(l.id)) counts[l.course_id].completed++;
                });
                setLessonCounts(counts);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-navy-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <p className="text-sm text-slate-500 font-medium">Welcome back</p>
                <h1 className="text-2xl font-bold text-slate-900">{studentName}</h1>
            </div>

            {enrollments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-slate-700 mb-1">No courses yet</h2>
                    <p className="text-slate-500 text-sm mb-4">You haven&apos;t enrolled in any cohorts.</p>
                    <Link
                        href="/cohorts"
                        className="inline-flex items-center gap-2 bg-navy-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-800 transition-colors"
                    >
                        Browse Cohorts
                    </Link>
                </div>
            ) : (
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Your Courses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {enrollments.map((enrollment, i) => {
                            const cohort = enrollment.cohorts;
                            const courseId = cohort?.course_id;
                            const counts = courseId ? lessonCounts[courseId] : null;
                            const progress = counts ? Math.round((counts.completed / counts.total) * 100) : 0;

                            return (
                                <motion.div
                                    key={enrollment.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <Link
                                        href={courseId ? `/portal/${courseId}` : '#'}
                                        className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                            {cohort?.image_url ? (
                                                <img src={cohort.image_url} alt={cohort.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="w-10 h-10 text-slate-300" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <PlayCircle className="w-12 h-12 text-white" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{cohort?.title}</h3>

                                            {counts ? (
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {counts.completed}/{counts.total} lessons
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-700">{progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span className="text-xs text-slate-400">Course content coming soon</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
