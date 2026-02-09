-- Create the gallery_images table
create table public.gallery_images (
  id uuid default gen_random_uuid() primary key,
  src text not null,
  alt text not null,
  caption text,
  width integer not null,
  height integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.gallery_images enable row level security;

-- Allow read access to everyone (public)
create policy "Public Gallery Read"
on public.gallery_images for select
to anon, authenticated
using (true);

-- Allow full access to authenticated users (admins) to manage gallery
create policy "Admin Gallery Manage"
on public.gallery_images for all
to authenticated
using (true);

-- Create a storage bucket for gallery images if it doesn't exist
-- Note: Buckets are usually created via the Supabase Dashboard, but you can also use the SQL editor
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Set up storage policies for the 'images' bucket

-- 1. Allow public read access to images
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'images' );

-- 2. Allow authenticated users to upload images
create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'images' );

-- 3. Allow authenticated users to update images
create policy "Authenticated Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'images' );

-- 4. Allow authenticated users to delete images
create policy "Authenticated Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'images' );
