-- Add success_message column to cohorts table
ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS success_message TEXT;

-- Set a default value for existing cohorts
UPDATE public.cohorts 
SET success_message = 'Welcome aboard! Your enrollment is successful.'
WHERE success_message IS NULL;

-- Update the view or policies if necessary (usually not needed for simple column additions)
COMMENT ON COLUMN public.cohorts.success_message IS 'Dynamic success message shown after enrollment';
