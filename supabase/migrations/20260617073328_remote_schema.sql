drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Admins can manage images"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using (((bucket_id = 'events'::text) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))))
with check (((bucket_id = 'events'::text) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role]))));



  create policy "Allow authenticated deletes 7v1pu6_0"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'blog-assets'::text));



  create policy "Allow authenticated deletes 7v1pu6_1"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'blog-assets'::text));



  create policy "Allow authenticated updates 7v1pu6_0"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'blog-assets'::text));



  create policy "Allow authenticated updates 7v1pu6_1"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'blog-assets'::text));



  create policy "Allow authenticated uploads 7v1pu6_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'blog-assets'::text));



  create policy "Allow public reads 7v1pu6_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'blog-assets'::text));



  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'events'::text));



