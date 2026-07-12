
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Storage policies for media bucket
CREATE POLICY "media bucket read all" ON storage.objects FOR SELECT
  USING (bucket_id = 'media');
CREATE POLICY "media bucket admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));
CREATE POLICY "media bucket admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.is_admin(auth.uid()));
CREATE POLICY "media bucket admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.is_admin(auth.uid()));
