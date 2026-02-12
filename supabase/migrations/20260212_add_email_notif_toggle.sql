-- Add email_notifications_enabled column to form_configs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_configs' AND column_name='email_notifications_enabled') THEN
    ALTER TABLE public.form_configs ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;
