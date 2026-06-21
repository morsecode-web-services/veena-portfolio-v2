-- Add Telegram Routing to form_configs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_configs' AND column_name='telegram_chat_id') THEN
    ALTER TABLE public.form_configs ADD COLUMN telegram_chat_id TEXT;
  END IF;
END $$;
