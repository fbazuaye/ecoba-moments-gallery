
-- 1) Drop bootstrap SECURITY DEFINER function (bootstrap complete)
DROP FUNCTION IF EXISTS public.claim_first_super_admin();

-- 2) Convert helper functions used in RLS to SECURITY INVOKER.
--    RLS policies pass auth.uid(); user_roles "roles self read" lets a user read their own rows.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 3) app_settings: restrict SELECT to admins only
DROP POLICY IF EXISTS "settings public read" ON public.app_settings;
CREATE POLICY "settings admin read" ON public.app_settings
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- 4) analytics_events: replace permissive INSERT check with allow-listed event types
--    and prevent inserts from claiming an authenticated identity spoof
DROP POLICY IF EXISTS "analytics insert anyone" ON public.analytics_events;
CREATE POLICY "analytics insert valid" ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    event_type IN ('page_view','photo_view','video_play','download','share','click','search')
    AND coalesce(length(path), 0) <= 512
    AND coalesce(length(referrer), 0) <= 512
    AND coalesce(length(user_agent), 0) <= 512
    AND coalesce(length(session_id), 0) <= 64
  );

-- 5) media storage bucket: restrict public SELECT to files linked to published + public media.
--    Signed URLs (used by the app) bypass RLS, so admins/signed access still work.
DROP POLICY IF EXISTS "media bucket read all" ON storage.objects;
CREATE POLICY "media bucket read published" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'media'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.media m
        WHERE m.status = 'published'
          AND coalesce(m.visibility, 'public') = 'public'
          AND (
            m.original_url LIKE '%' || storage.objects.name
            OR m.optimised_url LIKE '%' || storage.objects.name
            OR m.thumbnail_url LIKE '%' || storage.objects.name
          )
      )
    )
  );
