-- Create the certificates bucket for generated images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Create the certificate_templates bucket for admin uploaded backgrounds (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate_templates', 'certificate_templates', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure tracking columns exist on enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS certificate_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Create the new table for configurable certificate templates
CREATE TABLE IF NOT EXISTS public.cohort_certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  background_url TEXT NOT NULL,
  canvas_width INTEGER DEFAULT 800,
  canvas_height INTEGER DEFAULT 1000,
  fields_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.cohort_certificate_templates ENABLE ROW LEVEL SECURITY;

-- Admins and editors have full access
CREATE POLICY "Admins and editors can manage templates" ON public.cohort_certificate_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Function to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_cohort_certificate_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cohort_certificate_templates_updated_at
BEFORE UPDATE ON public.cohort_certificate_templates
FOR EACH ROW
EXECUTE FUNCTION update_cohort_certificate_templates_updated_at();

-- Storage Policies for 'certificate_templates' bucket
CREATE POLICY "Cert Templates Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'certificate_templates');
CREATE POLICY "Cert Templates Admin Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificate_templates');
CREATE POLICY "Cert Templates Admin Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'certificate_templates');
CREATE POLICY "Cert Templates Admin Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificate_templates');

-- Storage Policies for 'certificates' bucket
CREATE POLICY "Certs Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Certs Admin Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificates');
CREATE POLICY "Certs Admin Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'certificates');
CREATE POLICY "Certs Admin Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificates');
