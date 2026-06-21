-- Simplified RLS setup for leads table
-- This is more permissive and easier to debug

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous lead submissions" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.leads;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.leads;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.leads;

-- Disable RLS completely for testing
-- OPTION A: Disable RLS (simplest, but less secure)
-- Uncomment the line below if you want to disable RLS entirely:
-- ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- OPTION B: Enable RLS with permissive policies (recommended)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow all inserts (anyone can submit form)
CREATE POLICY "Allow all inserts"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to select
CREATE POLICY "Allow authenticated select"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (true);

-- Verify table exists and has correct structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Verify policies
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'leads';
