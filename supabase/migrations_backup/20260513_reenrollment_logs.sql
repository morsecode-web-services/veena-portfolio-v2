-- Create reenrollment_logs table
CREATE TABLE IF NOT EXISTS public.reenrollment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
    target_cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT,
    payment_link_id TEXT, -- Razorpay Payment Link ID (plink_...)
    payment_link_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'paid'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reenrollment_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to manage logs
CREATE POLICY "Allow authenticated users to manage reenrollment_logs" ON public.reenrollment_logs
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reenrollment_target_cohort ON public.reenrollment_logs(target_cohort_id);
CREATE INDEX IF NOT EXISTS idx_reenrollment_email ON public.reenrollment_logs(student_email);
