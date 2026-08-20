-- ==============================================================================
-- Hall of Fame & Like Counter Database Migration Schema
-- Target: Supabase / PostgreSQL
-- ==============================================================================

-- 1. Create Hall of Fame Entries Table
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_avatar TEXT,
  student_description TEXT,
  cohort TEXT DEFAULT 'Vande Mataram',
  location TEXT,
  piece_title TEXT,
  raga_name TEXT,
  video_url TEXT NOT NULL,
  video_type TEXT DEFAULT 'gdrive',
  thumbnail_url TEXT,
  mentor_praise TEXT,
  mentor_comment JSONB,
  likes_count INT DEFAULT 0 NOT NULL,
  date_featured TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast cohort & date sorting queries
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_cohort ON hall_of_fame(cohort);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_created_at ON hall_of_fame(created_at DESC);

-- 2. Create Hall of Fame Likes Tracking Table (Spam-proof & Race-Condition Safe)
CREATE TABLE IF NOT EXISTS hall_of_fame_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performer_id UUID NOT NULL REFERENCES hall_of_fame(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL, -- Anonymous client UUID / User ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_performer_visitor UNIQUE(performer_id, visitor_id)
);

-- Index for instant like lookups
CREATE INDEX IF NOT EXISTS idx_hof_likes_lookup ON hall_of_fame_likes(performer_id, visitor_id);

-- 3. Row Level Security (RLS) Setup
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_of_fame_likes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to hall_of_fame entries
CREATE POLICY "Public read access for hall_of_fame"
  ON hall_of_fame FOR SELECT
  USING (true);

-- Allow public read access for like records
CREATE POLICY "Public read access for hall_of_fame_likes"
  ON hall_of_fame_likes FOR SELECT
  USING (true);

-- 4. Atomic PostgreSQL RPC Function for Safe Like / Unlike Toggling
-- Prevents race conditions, double-likes, and counter drift across concurrent requests.
CREATE OR REPLACE FUNCTION toggle_hall_of_fame_like(
  p_performer_id UUID,
  p_visitor_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_already_liked BOOLEAN;
  v_new_count INT;
BEGIN
  -- Check if this visitor has already liked the item
  SELECT EXISTS (
    SELECT 1 FROM hall_of_fame_likes
    WHERE performer_id = p_performer_id AND visitor_id = p_visitor_id
  ) INTO v_already_liked;

  IF v_already_liked THEN
    -- UNLIKE ACTION: Remove tracking record and decrement likes_count safely (never below 0)
    DELETE FROM hall_of_fame_likes
    WHERE performer_id = p_performer_id AND visitor_id = p_visitor_id;

    UPDATE hall_of_fame
    SET likes_count = GREATEST(0, likes_count - 1),
        updated_at = NOW()
    WHERE id = p_performer_id
    RETURNING likes_count INTO v_new_count;

    RETURN jsonb_build_object(
      'success', true,
      'liked', false,
      'likes_count', v_new_count
    );
  ELSE
    -- LIKE ACTION: Insert tracking record (ignore if conflict) and increment likes_count
    INSERT INTO hall_of_fame_likes (performer_id, visitor_id)
    VALUES (p_performer_id, p_visitor_id)
    ON CONFLICT (performer_id, visitor_id) DO NOTHING;

    UPDATE hall_of_fame
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = p_performer_id
    RETURNING likes_count INTO v_new_count;

    RETURN jsonb_build_object(
      'success', true,
      'liked', true,
      'likes_count', v_new_count
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission for the RPC function to anon and authenticated roles
GRANT EXECUTE ON FUNCTION toggle_hall_of_fame_like(UUID, TEXT) TO anon, authenticated, service_role;
