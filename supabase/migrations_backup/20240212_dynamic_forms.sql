-- Create form_configs table
CREATE TABLE IF NOT EXISTS public.form_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add JSONB support for dynamic fields to leads table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='form_slug') THEN
    ALTER TABLE public.leads ADD COLUMN form_slug TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='form_data') THEN
    ALTER TABLE public.leads ADD COLUMN form_data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Enable RLS for form_configs
ALTER TABLE public.form_configs ENABLE ROW LEVEL SECURITY;

-- Policies for form_configs
CREATE POLICY "Allow public read access to active form configs"
  ON public.form_configs
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage form configs"
  ON public.form_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial configurations
INSERT INTO public.form_configs (form_slug, title, description, fields)
VALUES 
(
  'classes', 
  'Private Classes', 
  'Enroll for private Veena or Vocal classes.',
  '[
    {"name": "name", "label": "Full Name", "type": "text", "required": true, "placeholder": "Your Name"},
    {"name": "email", "label": "Email Address", "type": "email", "required": false, "placeholder": "your@email.com (Optional for auto-reply)"},
    {"name": "phone", "label": "Phone Number", "type": "tel", "required": true, "placeholder": "+91 ..."},
    {"name": "level", "label": "Experience Level", "type": "select", "required": true, "options": ["Beginner", "Intermediate", "Advanced"]},
    {"name": "message", "label": "What would you like to learn?", "type": "textarea", "required": true}
  ]'::jsonb
),
(
  'performance', 
  'Performance & Collaboration', 
  'Book for concerts, recordings, or collaborative projects.',
  '[
    {"name": "name", "label": "Full Name", "type": "text", "required": true, "placeholder": "Your Name"},
    {"name": "email", "label": "Email Address", "type": "email", "required": false, "placeholder": "your@email.com (Optional for auto-reply)"},
    {"name": "phone", "label": "Phone Number", "type": "tel", "required": true, "placeholder": "+91 ..."},
    {"name": "event_type", "label": "Event Type", "type": "select", "required": true, "options": ["Solo Concert", "Arangetram", "Fusion/Collab", "Recording", "Wedding/Corporate"]},
    {"name": "date", "label": "Preferred Date", "type": "date", "required": false},
    {"name": "message", "label": "Event details and requirements", "type": "textarea", "required": true}
  ]'::jsonb
)
ON CONFLICT (form_slug) DO NOTHING;
