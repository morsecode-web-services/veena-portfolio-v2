-- Add is_verified flag to form_submissions and leads
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions' AND column_name='is_verified') THEN
    ALTER TABLE public.form_submissions ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='is_verified') THEN
    ALTER TABLE public.leads ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;
