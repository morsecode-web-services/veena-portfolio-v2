INSERT INTO public.profiles (id, role, full_name)
VALUES ('aea73d7d-d889-4046-905d-021322f6a370', 'admin', 'Local Admin')
ON CONFLICT (id) DO UPDATE 
SET role = 'admin';