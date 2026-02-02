-- Blogs table definition
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'Music',
  author TEXT DEFAULT 'Aishwarya Manikarnike',
  is_published BOOLEAN DEFAULT FALSE,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view published blogs" ON blogs
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin can manage all blogs" ON blogs
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- STORAGE BUCKET SETUP (Must be done via Supabase Dashboard)
-- ============================================================================
-- 
-- You cannot create storage policies via SQL Editor. Instead:
-- 
-- 1. Go to Supabase Dashboard → Storage → Policies
-- 2. Click on "New Policy" for the blog-assets bucket
-- 3. Create the following policies:
--
-- Policy 1: "Allow authenticated uploads"
--   - Allowed operation: INSERT
--   - Target roles: authenticated
--   - Policy definition: bucket_id = 'blog-assets'
--
-- Policy 2: "Allow public reads"
--   - Allowed operation: SELECT
--   - Target roles: public
--   - Policy definition: bucket_id = 'blog-assets'
--
-- Policy 3: "Allow authenticated updates"
--   - Allowed operation: UPDATE
--   - Target roles: authenticated
--   - Policy definition: bucket_id = 'blog-assets'
--
-- Policy 4: "Allow authenticated deletes"
--   - Allowed operation: DELETE
--   - Target roles: authenticated
--   - Policy definition: bucket_id = 'blog-assets'
--
-- OR use this simpler approach:
-- In Storage → Configuration → Policies, you can use the policy templates
-- and select "Allow authenticated users full access" for blog-assets bucket.
-- ============================================================================
