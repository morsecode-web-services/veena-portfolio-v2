-- 0. Create backup tables just in case (Run this to snapshot current data)
CREATE TABLE payments_backup_pre_migration AS SELECT * FROM payments;
CREATE TABLE form_submissions_backup_pre_migration AS SELECT * FROM form_submissions;

-- 1. Add fee and tax columns to the payments table if they don't exist
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax INTEGER DEFAULT 0;

-- 2. Safely backfill fee, tax, and true INR base_amount using a CTE
-- We use DISTINCT ON to guarantee exactly one row per payment_id,
-- avoiding non-deterministic updates if multiple webhooks exist for the same payment.
WITH latest_webhooks AS (
  SELECT DISTINCT ON (payload->'payload'->'payment'->'entity'->>'id')
    payload->'payload'->'payment'->'entity'->>'id' AS payment_id,
    (payload->'payload'->'payment'->'entity'->>'fee')::INTEGER AS fee,
    (payload->'payload'->'payment'->'entity'->>'tax')::INTEGER AS tax,
    (payload->'payload'->'payment'->'entity'->>'base_amount')::INTEGER AS base_amount,
    (payload->'payload'->'payment'->'entity'->>'amount')::INTEGER AS amount
  FROM webhook_logs
  WHERE event_type IN ('order.paid', 'payment.captured', 'payment_link.paid')
    AND payload->'payload'->'payment'->'entity'->>'id' IS NOT NULL
  ORDER BY payload->'payload'->'payment'->'entity'->>'id', created_at DESC
)
UPDATE payments p
SET 
  fee = COALESCE(lw.fee, 0),
  tax = COALESCE(lw.tax, 0),
  amount = COALESCE(lw.base_amount, lw.amount, p.amount)
FROM latest_webhooks lw
WHERE p.razorpay_payment_id = lw.payment_id;

-- 3. Sync the updated amount to form_submissions
UPDATE form_submissions fs
SET 
  razorpay_amount = p.amount
FROM payments p
WHERE fs.razorpay_payment_id = p.razorpay_payment_id
  AND p.status = 'paid';
