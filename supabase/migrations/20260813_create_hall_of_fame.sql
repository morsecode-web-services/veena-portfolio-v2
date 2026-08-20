-- Migration: Create hall_of_fame table and storage bucket policy
-- Date: 2026-08-13

CREATE TABLE IF NOT EXISTS public.hall_of_fame (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    student_avatar TEXT,
    cohort TEXT,
    location TEXT,
    challenge_id TEXT DEFAULT 'c-general',
    challenge_title TEXT NOT NULL,
    piece_title TEXT NOT NULL,
    raga_name TEXT,
    video_url TEXT NOT NULL,
    video_type TEXT DEFAULT 'gdrive',
    thumbnail_url TEXT,
    mentor_praise TEXT,
    date_featured TEXT DEFAULT '2026',
    badges JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast category and featured queries
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_featured ON public.hall_of_fame(is_featured);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_created_at ON public.hall_of_fame(created_at DESC);

-- Enable RLS
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

-- Allow public read access for all visitors
CREATE POLICY "Allow public read access on hall_of_fame"
    ON public.hall_of_fame
    FOR SELECT
    USING (true);

-- Allow authenticated admin users full write access
CREATE POLICY "Allow admin insert on hall_of_fame"
    ON public.hall_of_fame
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Allow admin update on hall_of_fame"
    ON public.hall_of_fame
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Allow admin delete on hall_of_fame"
    ON public.hall_of_fame
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Create Storage Bucket for hall_of_fame if not existing
INSERT INTO storage.buckets (id, name, public)
VALUES ('hall-of-fame', 'hall-of-fame', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policy for hall-of-fame bucket
CREATE POLICY "Public Read Access on hall-of-fame bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'hall-of-fame');

CREATE POLICY "Admin Upload Access on hall-of-fame bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'hall-of-fame');
