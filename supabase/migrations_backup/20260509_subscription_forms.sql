-- Add payment configuration to form_configs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_configs' AND column_name='requires_payment') THEN
    ALTER TABLE public.form_configs ADD COLUMN requires_payment BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_configs' AND column_name='razorpay_plan_id') THEN
    ALTER TABLE public.form_configs ADD COLUMN razorpay_plan_id TEXT;
  END IF;
  
  -- Add payment tracking to form_submissions (where new dynamic forms are routed)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions' AND column_name='payment_status') THEN
    ALTER TABLE public.form_submissions ADD COLUMN payment_status TEXT DEFAULT 'none'; -- none, pending, paid, failed, cancelled
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions' AND column_name='razorpay_subscription_id') THEN
    ALTER TABLE public.form_submissions ADD COLUMN razorpay_subscription_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions' AND column_name='razorpay_customer_id') THEN
    ALTER TABLE public.form_submissions ADD COLUMN razorpay_customer_id TEXT;
  END IF;
END $$;
