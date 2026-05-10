-- Add Payment Type and Amount to Form Configs
ALTER TABLE form_configs 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'subscription',
ADD COLUMN IF NOT EXISTS razorpay_amount INTEGER;

-- Add Order and Payment IDs to Form Submissions
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
