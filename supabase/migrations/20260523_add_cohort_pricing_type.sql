-- Migration: Add pricing_type column to cohorts
ALTER TABLE cohorts 
ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'fixed' 
CHECK (pricing_type IN ('fixed', 'pay_as_you_wish'));
