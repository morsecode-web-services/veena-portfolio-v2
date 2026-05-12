-- Create webhook_logs table to monitor automated notifications
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT, -- Razorpay event ID
    event_type TEXT NOT NULL, -- e.g., 'subscription.charged', 'order.paid'
    payload JSONB, -- The full Razorpay payload
    status TEXT DEFAULT 'success', -- 'success', 'failed', 'partial_success'
    error_message TEXT,
    
    -- Status of individual notification channels
    notification_status JSONB DEFAULT '{
        "telegram": {"status": "pending"},
        "email": {"status": "pending"},
        "whatsapp": {"status": "pending"}
    }'::JSONB,
    
    student_email TEXT,
    student_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view logs
CREATE POLICY "Allow authenticated users to manage webhook logs" ON webhook_logs
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_student_email ON webhook_logs(student_email);
