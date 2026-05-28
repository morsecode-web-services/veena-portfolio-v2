-- Migration to add razorpay_amount to form_submissions table
ALTER TABLE public.form_submissions 
ADD COLUMN IF NOT EXISTS razorpay_amount INTEGER;

-- ─────────────────────────────────────────────────────────────────────────────
-- Data Backfilling for Existing Paid Submissions
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Backfill from webhook_logs
-- For existing paid submissions, we extract the amount paid directly from the matching webhook log payload.
UPDATE public.form_submissions fs
SET razorpay_amount = (wl.payload->'payload'->'payment'->'entity'->>'amount')::INTEGER
FROM public.webhook_logs wl
WHERE fs.razorpay_payment_id = wl.event_id
  AND fs.payment_status = 'paid'
  AND fs.razorpay_amount IS NULL;
