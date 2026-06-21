-- Aggressive cleanup of the leads table to support specialized dynamic forms
DO $$ 
BEGIN
    -- 1. Remove rigid constraints
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_inquiry_type_check;
    
    -- 2. Drop legacy indexes that rely on removed columns
    DROP INDEX IF EXISTS idx_leads_inquiry_type;

    -- 3. Remove redundant columns (data now lives in form_data)
    -- We keep 'name' for now to avoid breaking the UI immediately, but make it nullable
    ALTER TABLE public.leads ALTER COLUMN name DROP NOT NULL;
    ALTER TABLE public.leads ALTER COLUMN email DROP NOT NULL;
    ALTER TABLE public.leads ALTER COLUMN phone DROP NOT NULL;
    ALTER TABLE public.leads ALTER COLUMN message DROP NOT NULL;
    ALTER TABLE public.leads ALTER COLUMN inquiry_type DROP NOT NULL;

    -- 4. In a real production scenario, we would migrate data here. 
    -- Since this is a fresh development phase, we'll proceed to drop them eventually.
    -- For this step, we just make them nullable to allow the new API to work.
    
    -- 5. Add GIN index for faster JSONB querying
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_form_data') THEN
        CREATE INDEX idx_leads_form_data ON public.leads USING GIN (form_data);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leads_form_slug') THEN
        CREATE INDEX idx_leads_form_slug ON public.leads (form_slug);
    END IF;
END $$;
