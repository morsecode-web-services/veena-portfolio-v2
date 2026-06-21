-- Migration to create telegram_invite_logs table for audit trail and fallback invite tracking
CREATE TABLE IF NOT EXISTS public.telegram_invite_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'regenerated', 'reminded', 'joined', 'left'
    invite_link TEXT,
    telegram_username TEXT,
    created_by TEXT DEFAULT 'system', -- 'system', 'telegram_webhook', or admin email
    payload JSONB DEFAULT '{}'::jsonb, -- stores old link context, error logs, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.telegram_invite_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins/editors) to manage logs
CREATE POLICY "Allow authenticated users to manage telegram_invite_logs" ON public.telegram_invite_logs
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Indexing for fast lookups by submission ID and invite link
CREATE INDEX IF NOT EXISTS idx_telegram_invite_logs_sub_id ON public.telegram_invite_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_telegram_invite_logs_link ON public.telegram_invite_logs(invite_link);
