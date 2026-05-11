-- Add original_price for discount control
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS original_price INTEGER; -- in paise
