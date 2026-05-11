-- Create cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    month_name TEXT NOT NULL, -- e.g., "June"
    price INTEGER NOT NULL, -- in paise
    razorpay_plan_id TEXT,
    status TEXT DEFAULT 'coming_soon', -- 'active', 'coming_soon', 'completed'
    telegram_chat_id TEXT,
    order_index INTEGER DEFAULT 0,
    is_highlighted BOOLEAN DEFAULT false,
    image_url TEXT, -- Udemy-style thumbnail
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on cohorts" ON cohorts
    FOR SELECT USING (true);

-- Allow authenticated users to manage cohorts
CREATE POLICY "Allow authenticated users to manage cohorts" ON cohorts
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Add cohort_id to existing tables
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions' AND column_name='cohort_id') THEN
    ALTER TABLE public.form_submissions ADD COLUMN cohort_id UUID REFERENCES public.cohorts(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='cohort_id') THEN
    ALTER TABLE public.leads ADD COLUMN cohort_id UUID REFERENCES public.cohorts(id);
  END IF;
END $$;
