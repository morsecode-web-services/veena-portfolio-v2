-- Migration: Lesson Progress Tracking Table
-- Tracks which lessons each student has completed, and their last watch position.

CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    last_watched_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);

-- Auto-update updated_at
CREATE TRIGGER update_lesson_progress_updated_at
    BEFORE UPDATE ON public.lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own progress" ON public.lesson_progress;
CREATE POLICY "Students can view their own progress" ON public.lesson_progress
    FOR SELECT TO authenticated USING (
        student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Students can upsert their own progress" ON public.lesson_progress;
CREATE POLICY "Students can upsert their own progress" ON public.lesson_progress
    FOR ALL TO authenticated USING (
        student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
    ) WITH CHECK (
        student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.lesson_progress;
CREATE POLICY "Admins can view all lesson progress" ON public.lesson_progress
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );
