'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit,
    MoveUp,
    MoveDown,
    Loader2,
    Video,
    FileText,
    Upload,
    X,
    CheckCircle2,
    BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface Course {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
}

interface Lesson {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    video_duration: number | null;
    is_free_preview: boolean;
    order_index: number;
    created_at: string;
}

export default function CourseCurriculumPage() {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToast();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal state for Lesson
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonDescription, setLessonDescription] = useState('');
    const [lessonDuration, setLessonDuration] = useState<number | ''>('');
    const [isFreePreview, setIsFreePreview] = useState(false);

    // File upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeUploadLessonId, setActiveUploadLessonId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ [lessonId: string]: number }>({});
    const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);

    useEffect(() => {
        fetchCourseAndLessons();
    }, [courseId]);

    const fetchCourseAndLessons = async () => {
        setLoading(true);
        try {
            // 1. Fetch course details
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (courseError) throw courseError;
            setCourse(courseData);

            // 2. Fetch course lessons ordered by order_index
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('course_lessons')
                .select('*')
                .eq('course_id', courseId)
                .order('order_index', { ascending: true });

            if (lessonsError) throw lessonsError;
            setLessons(lessonsData || []);
        } catch (err: any) {
            console.error('Error fetching details:', err);
            addToast('Failed to load course details', 'error');
            router.push('/admin/courses');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingLesson(null);
        setLessonTitle('');
        setLessonDescription('');
        setLessonDuration('');
        setIsFreePreview(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (lesson: Lesson) => {
        setEditingLesson(lesson);
        setLessonTitle(lesson.title);
        setLessonDescription(lesson.description || '');
        setLessonDuration(lesson.video_duration || '');
        setIsFreePreview(lesson.is_free_preview);
        setIsModalOpen(true);
    };

    const handleLessonSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lessonTitle.trim()) {
            addToast('Lesson title is required', 'error');
            return;
        }

        setActionLoading(true);
        try {
            const nextOrderIndex = editingLesson
                ? editingLesson.order_index
                : lessons.length > 0
                    ? Math.max(...lessons.map(l => l.order_index)) + 1
                    : 0;

            const lessonData = {
                course_id: courseId,
                title: lessonTitle.trim(),
                description: lessonDescription.trim() || null,
                video_duration: lessonDuration === '' ? null : Number(lessonDuration),
                is_free_preview: isFreePreview,
                order_index: nextOrderIndex,
            };

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Unauthorized: No active session');

            if (editingLesson) {
                const res = await fetch('/api/admin/lessons', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ id: editingLesson.id, data: lessonData })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to update lesson');
                }
                addToast('Lesson updated successfully', 'success');
            } else {
                const res = await fetch('/api/admin/lessons', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ lessonData })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to add lesson');
                }
                addToast('Lesson added successfully', 'success');
            }

            setIsModalOpen(false);
            fetchCourseAndLessons();
        } catch (err: any) {
            console.error('Failed to save lesson:', err);
            addToast(err.message || 'Failed to save lesson', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Are you sure you want to delete this lesson? The lesson contents and progress will be deleted.')) {
            return;
        }

        setActionLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Unauthorized: No active session');

            const res = await fetch(`/api/admin/lessons?id=${lessonId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to delete lesson');
            }

            addToast('Lesson deleted successfully', 'success');
            fetchCourseAndLessons();
        } catch (err: any) {
            console.error('Failed to delete lesson:', err);
            addToast(err.message || 'Failed to delete lesson', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const moveLesson = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= lessons.length) return;

        const newLessons = [...lessons];
        // Swap order_index values
        const tempOrder = newLessons[index].order_index;
        newLessons[index].order_index = newLessons[targetIndex].order_index;
        newLessons[targetIndex].order_index = tempOrder;

        // Swap visual items
        [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];

        setLessons(newLessons);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Unauthorized: No active session');

            const res = await fetch('/api/admin/lessons', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    updates: [
                        { id: newLessons[index].id, data: { order_index: newLessons[index].order_index } },
                        { id: newLessons[targetIndex].id, data: { order_index: newLessons[targetIndex].order_index } }
                    ]
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to update lesson order');
            }

            addToast('Curriculum order updated', 'success');
        } catch (err) {
            console.error('Failed to update lesson order:', err);
            addToast('Failed to save order change', 'error');
            fetchCourseAndLessons();
        }
    };

    const triggerUploadInput = (lessonId: string) => {
        setActiveUploadLessonId(lessonId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const lessonId = activeUploadLessonId;
        if (!file || !lessonId) return;

        // Reset input
        e.target.value = '';
        setActiveUploadLessonId(null);
        setUploadingLessonId(lessonId);
        setUploadProgress(prev => ({ ...prev, [lessonId]: 0 }));

        try {
            // 1. Get auth session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Unauthorized session');

            // 2. Fetch presigned PUT URL
            const res = await fetch('/api/admin/r2-upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    courseId,
                    filename: file.name,
                    contentType: file.type
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to retrieve upload configuration');
            }

            const { uploadUrl, key } = await res.json();

            // 3. Perform Direct-to-R2 upload using XMLHttpRequest
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (progressEvent) => {
                    if (progressEvent.lengthComputable) {
                        const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        setUploadProgress(prev => ({ ...prev, [lessonId]: percentage }));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status code: ${xhr.status}`));
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Network error occurred during direct upload.'));
                };

                xhr.send(file);
            });

            // 4. Update the DB lesson record with R2 object key
            const dbRes = await fetch('/api/admin/lessons', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ id: lessonId, data: { video_url: key } })
            });

            if (!dbRes.ok) {
                const errData = await dbRes.json();
                throw new Error(errData.error || 'Failed to update lesson media configuration');
            }

            addToast('Media file uploaded successfully', 'success');
            fetchCourseAndLessons();
        } catch (err: any) {
            console.error('File upload failed:', err);
            addToast(err.message || 'Media upload failed', 'error');
        } finally {
            setUploadingLessonId(null);
            setUploadProgress(prev => {
                const copy = { ...prev };
                delete copy[lessonId];
                return copy;
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-5 w-5 animate-spin text-slate-800 mb-2" />
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading Curriculum...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back to courses */}
            <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
            </Link>

            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5 mb-8">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Course Curriculum Builder</span>
                    <h1 className="text-xl font-bold text-slate-900">{course?.title}</h1>
                    {course?.description && <p className="text-slate-500 text-xs mt-1">{course.description}</p>}
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded shadow-sm transition-all"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Lesson
                </button>
            </div>

            {/* Hidden upload input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*,application/pdf"
                className="hidden"
            />

            {/* Curriculum list */}
            <div className="space-y-4">
                {lessons.length === 0 ? (
                    <div className="bg-white rounded border border-slate-200 border-dashed p-12 text-center">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-xs mb-4">No lessons in this course yet. Get started by adding a lesson.</p>
                        <button
                            onClick={handleOpenCreateModal}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add First Lesson
                        </button>
                    </div>
                ) : (
                    lessons.map((lesson, idx) => {
                        const isPdf = lesson.video_url?.endsWith('.pdf');
                        const isUploading = uploadingLessonId === lesson.id;
                        const progress = uploadProgress[lesson.id] || 0;

                        return (
                            <div
                                key={lesson.id}
                                className="bg-white rounded border border-slate-200 p-4 hover:border-slate-350 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    {/* Order buttons */}
                                    <div className="flex flex-col gap-1 flex-shrink-0 pt-0.5">
                                        <button
                                            disabled={idx === 0 || actionLoading}
                                            onClick={() => moveLesson(idx, 'up')}
                                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                                            title="Move Up"
                                        >
                                            <MoveUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            disabled={idx === lessons.length - 1 || actionLoading}
                                            onClick={() => moveLesson(idx, 'down')}
                                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                                            title="Move Down"
                                        >
                                            <MoveDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Media Type Icon */}
                                    <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500">
                                        {isPdf ? <FileText className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                    </div>

                                    {/* Lesson description details */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                            <h3 className="text-xs font-bold text-slate-800 truncate">
                                                {idx + 1}. {lesson.title}
                                            </h3>
                                            {lesson.is_free_preview && (
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold px-1.5 py-0.2">
                                                    Free Preview
                                                </span>
                                            )}
                                        </div>
                                        {lesson.description ? (
                                            <p className="text-slate-500 text-[11px] line-clamp-1 mb-1">{lesson.description}</p>
                                        ) : (
                                            <p className="text-slate-400 text-[11px] italic mb-1">No description.</p>
                                        )}
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                                            {lesson.video_duration && (
                                                <span>Duration: {Math.floor(lesson.video_duration / 60)}m {lesson.video_duration % 60}s</span>
                                            )}
                                            {lesson.video_url ? (
                                                <span className="text-slate-500 flex items-center gap-1 font-semibold truncate max-w-[250px]" title={lesson.video_url}>
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                                    R2: {lesson.video_url.split('/').pop()}
                                                </span>
                                            ) : (
                                                <span className="text-amber-500 font-semibold">No video/PDF file uploaded</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Upload and controls */}
                                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                                    {isUploading ? (
                                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-1.5 pr-3">
                                            <Loader2 className="w-3.5 h-3.5 text-slate-600 animate-spin flex-shrink-0" />
                                            <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden flex-shrink-0">
                                                <div className="bg-slate-900 h-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-700 min-w-[28px] text-right">{progress}%</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => triggerUploadInput(lesson.id)}
                                            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-250 font-bold text-[11px] py-1.5 px-2.5 rounded transition-all"
                                            title="Upload MP4 or PDF to R2"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            {lesson.video_url ? 'Replace File' : 'Upload File'}
                                        </button>
                                    )}

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEditModal(lesson)}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded transition-colors"
                                            title="Edit details"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                            disabled={actionLoading}
                                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors"
                                            title="Delete lesson"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal for Lesson Edit/Create */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-slate-200 w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-sm">
                                {editingLesson ? 'Edit Lesson Details' : 'Add Lesson to Curriculum'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleLessonSubmit}>
                            <div className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Lesson Title</label>
                                    <input
                                        type="text"
                                        value={lessonTitle}
                                        onChange={(e) => setLessonTitle(e.target.value)}
                                        placeholder="e.g. Chapter 1: Introduction to Ragas"
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Description</label>
                                    <textarea
                                        value={lessonDescription}
                                        onChange={(e) => setLessonDescription(e.target.value)}
                                        placeholder="Brief summary of what this specific lesson covers..."
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block ml-0.5">Duration (Seconds)</label>
                                        <input
                                            type="number"
                                            value={lessonDuration}
                                            onChange={(e) => setLessonDuration(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="e.g. 1200"
                                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                                            min={0}
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={isFreePreview}
                                                onChange={(e) => setIsFreePreview(e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-305 text-slate-900 focus:ring-slate-500"
                                            />
                                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Free Preview</span>
                                        </label>
                                    </div>
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
                                    {editingLesson ? 'Save Details' : 'Add Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
