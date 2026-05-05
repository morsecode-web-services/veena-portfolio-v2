-- Site Configuration Table
-- This stores the global website configuration (text, categories, and Cloudinary URLs)
CREATE TABLE IF NOT EXISTS public.site_config (
    id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access on site_config" ON public.site_config;
DROP POLICY IF EXISTS "Allow authenticated admins to manage site_config" ON public.site_config;

-- Policy: Allow public read access (essential for the site to load)
CREATE POLICY "Allow public read access on site_config"
ON public.site_config
FOR SELECT
USING (true);

-- Policy: Authenticated admins/editors can manage
CREATE POLICY "Allow authenticated admins to manage site_config"
ON public.site_config
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'editor')
    )
);

-- Insert the default empty config row if it doesn't exist
-- We use a fixed zero UUID for the singleton record
INSERT INTO public.site_config (id, data)
VALUES ('00000000-0000-0000-0000-000000000000', '{}')
ON CONFLICT (id) DO NOTHING;
