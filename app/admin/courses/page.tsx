'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { BookOpen, Plus, Trash2, Edit, Loader2, GraduationCap, X } from 'lucide-react';
import Link from 'next/link';

interface CourseLesson {
    id: string;
}

interface Cohort {
    id: string;
    title: string;
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
    course_lessons: CourseLesson[];
    cohorts: Cohort[];
}

export default function CoursesPage() {
    const { addToast } = useToast();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('courses')
                .select(`
                    *,
                    course_lessons (id),
                    cohorts (id, title)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCourses(data || []);
        } catch (err: any) {
            console.error('Failed to fetch courses:', err);
            addToast('Failed to load courses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingCourse(null);
        setTitle('');
        setDescription('');
        setImageUrl('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (course: Course) => {
        setEditingCourse(course);
        setTitle(course.title);
        setDescription(course.description || '');
        setImageUrl(course.image_url || '');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            addToast('Course title is required', 'error');
            return;
        }

        setActionLoading(true);
        try {
            const courseData = {
                title: title.trim(),
                description: description.trim() || null,
                image_url: imageUrl.trim() || null,
            };

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Unauthorized: No active session');

            if (editingCourse) {
                const res = await fetch('/api/admin/courses', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ id: editingCourse.id, courseData })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to update course');
                }
                addToast('Course updated successfully', 'success');
            } else {
                const res = await fetch('/api/admin/courses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ courseData })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to create course');
                }
                addToast('Course created successfully', 'success');
            }

            setIsModalOpen(false);
            fetchCourses();
        } catch (err: any) {
            console.error('Failed to save course:', err);
            addToast(err.message || 'Failed to save course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm('Are you sure you want to delete this course? All associated lessons will be permanently deleted.')) {
            return;
        }

        setActionLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Unauthorized: No active session');

            const res = await fetch(`/api/admin/courses?id=${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to delete course');
            }

            addToast('Course deleted successfully', 'success');
            fetchCourses();
        } catch (err: any) {
            console.error('Failed to delete course:', err);
            addToast(err.message || 'Failed to delete course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-5 w-5 animate-spin text-slate-800 mb-2" />
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading Courses...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Courses & Curriculums</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Manage courses, build curriculum lists, and link them to cohorts.</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded shadow-sm transition-all"
                >
                    <Plus className="h-3.5 w-3.5" />
                    New Course
                </button>
            </div>

            {courses.length === 0 ? (
                <div className="bg-white rounded border border-slate-200 p-12 text-center">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">No courses created yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">Create your first course template, add lessons, and link it to an active cohort.</p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" /> Create Course
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const lessonCount = course.course_lessons?.length || 0;
                        const linkedCohortNames = course.cohorts?.map(c => c.title).join(', ');

                        return (
                            <div key={course.id} className="bg-white rounded border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="h-10 w-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleOpenEditModal(course)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
                                                title="Edit course info"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(course.id)}
                                                disabled={actionLoading}
                                                className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors"
                                                title="Delete course"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <h2 className="text-sm font-bold text-slate-900 mb-1">{course.title}</h2>
                                    {course.description ? (
                                        <p className="text-slate-500 text-xs line-clamp-2 mb-4">{course.description}</p>
                                    ) : (
                                        <p className="text-slate-400 text-xs italic mb-4">No description provided.</p>
                                    )}

                                    <div className="space-y-2 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold text-slate-400 uppercase tracking-wider">Lessons</span>
                                            <span className="font-bold text-slate-800">{lessonCount} video/PDF lessons</span>
                                        </div>
                                        <div className="flex items-start justify-between text-[11px] gap-2">
                                            <span className="font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Linked Cohorts</span>
                                            <span className="font-semibold text-slate-600 text-right line-clamp-2">
                                                {linkedCohortNames ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <GraduationCap className="h-3 w-3 inline text-slate-400" />
                                                        {linkedCohortNames}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">None</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-semibold">Created {new Date(course.created_at).toLocaleDateString()}</span>
                                    <Link
                                        href={`/admin/courses/${course.id}`}
                                        className="inline-flex items-center gap-1 text-slate-900 hover:text-slate-700 font-bold text-xs"
                                    >
                                        Manage Curriculum &rarr;
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-sm">{editingCourse ? 'Edit Course Template' : 'Create Course Template'}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Course Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Masterclass in Carnatic Vocals"
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief summary of what students will learn in this course..."
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none"
                                    />
                                </div>
                            </div>
                            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 px-3 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded flex items-center gap-1.5 transition-colors"
                                >
                                    {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                                    {editingCourse ? 'Save Changes' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
