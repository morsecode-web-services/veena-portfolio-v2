-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    category_id TEXT DEFAULT 'general',
    subcategory_id TEXT,
    is_featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Management (Idempotent)
DROP POLICY IF EXISTS "Allow public read access" ON videos;
DROP POLICY IF EXISTS "Allow authenticated users to manage videos" ON videos;

-- Allow public read access
CREATE POLICY "Allow public read access" ON videos
    FOR SELECT USING (true);

-- Allow authenticated users to manage videos
CREATE POLICY "Allow authenticated users to manage videos" ON videos
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Create smart_links table
CREATE TABLE IF NOT EXISTS smart_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    target_url TEXT NOT NULL,
    platform TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE smart_links ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Management (Idempotent)
DROP POLICY IF EXISTS "Allow public read access on smart_links" ON smart_links;
DROP POLICY IF EXISTS "Allow authenticated users to manage smart_links" ON smart_links;

-- Allow public read access
CREATE POLICY "Allow public read access on smart_links" ON smart_links
    FOR SELECT USING (true);

-- Allow authenticated users to manage smart_links
CREATE POLICY "Allow authenticated users to manage smart_links" ON smart_links
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
