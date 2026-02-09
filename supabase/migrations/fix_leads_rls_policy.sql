-- Fix RLS policies for leads table
-- Run this if you're getting "row violates row-level security policy" errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous lead submissions" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;

-- Disable RLS temporarily to ensure clean slate
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public/anonymous inserts (for contact form)
-- This allows anyone to submit the contact form
CREATE POLICY "Enable insert for anon users"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read all leads
CREATE POLICY "Enable read for authenticated users"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow authenticated users to update leads
CREATE POLICY "Enable update for authenticated users"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (true);

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'leads';
