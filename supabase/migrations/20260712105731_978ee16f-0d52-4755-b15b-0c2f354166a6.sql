
-- ROLES ENUM & TABLES
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','viewer');
CREATE TYPE public.media_type AS ENUM ('photo','video');
CREATE TYPE public.media_status AS ENUM ('processing','published','hidden');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin'));
$$;

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events admin write" ON public.events FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.event_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0
);
GRANT SELECT ON public.event_days TO anon, authenticated;
GRANT ALL ON public.event_days TO service_role;
ALTER TABLE public.event_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "days public read" ON public.event_days FOR SELECT USING (true);
CREATE POLICY "days admin write" ON public.event_days FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  event_day_id UUID REFERENCES public.event_days(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  cover_media_id UUID,
  display_order INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, slug)
);
GRANT SELECT ON public.albums TO anon, authenticated;
GRANT ALL ON public.albums TO service_role;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albums public read" ON public.albums FOR SELECT USING (true);
CREATE POLICY "albums admin write" ON public.albums FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  event_day_id UUID REFERENCES public.event_days(id) ON DELETE SET NULL,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  media_type media_type NOT NULL,
  original_url TEXT NOT NULL,
  optimised_url TEXT,
  thumbnail_url TEXT,
  title TEXT,
  caption TEXT,
  photographer TEXT,
  tags TEXT[] DEFAULT '{}',
  captured_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  width INT,
  height INT,
  duration INT,
  file_size BIGINT,
  file_hash TEXT,
  featured BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public',
  status media_status DEFAULT 'published',
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  share_count INT DEFAULT 0
);
CREATE INDEX ON public.media(album_id);
CREATE INDEX ON public.media(event_day_id);
CREATE INDEX ON public.media(featured);
CREATE INDEX ON public.media(uploaded_at DESC);
GRANT SELECT ON public.media TO anon, authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media public read" ON public.media FOR SELECT USING (status = 'published' OR public.is_admin(auth.uid()));
CREATE POLICY "media admin write" ON public.media FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  media_id UUID,
  album_id UUID,
  session_id TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics insert anyone" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics admin read" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit super_admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "audit admin insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND actor_id = auth.uid());

CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "settings super_admin write" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ai_conversations TO anon, authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai session read" ON public.ai_conversations FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "ai session insert" ON public.ai_conversations FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "ai session update" ON public.ai_conversations FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid());

-- Trigger: auto-create profile + viewer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed event & days & albums
INSERT INTO public.events (id, title, slug, description, start_date, end_date, location, status)
VALUES ('00000000-0000-0000-0000-000000000001','ECOBA NEC Meeting 2026','nec-2026','ECOBA NEC Meeting 2026 hosted by Warri Branch','2026-07-17','2026-07-19','Warri, Nigeria','active');

INSERT INTO public.event_days (id, event_id, date, title, description, display_order) VALUES
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','2026-07-17','Friday, 17 July','Arrival & Royal Courtesy Visit',1),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','2026-07-18','Saturday, 18 July','NEC Meeting & Gala Night',2),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','2026-07-19','Sunday, 19 July','Farewell & Departure',3);

INSERT INTO public.albums (event_id, event_day_id, title, slug, description, event_date, display_order) VALUES
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Arrival of Delegates','arrival','Welcoming delegates to Warri','2026-07-17',1),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Royal Courtesy Visit','royal-visit','Courtesy visit to HRM the Ohworode of Olomu Kingdom','2026-07-17',2),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','NEC Meeting','nec-meeting','Official NEC Meeting','2026-07-18',3),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Gala Night','gala-night','Gala Night celebration','2026-07-18',4),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','Farewell & Departure','farewell','Farewell moments','2026-07-19',5),
('00000000-0000-0000-0000-000000000001',NULL,'Featured Moments','featured','Curated featured moments',NULL,6),
('00000000-0000-0000-0000-000000000001',NULL,'Behind the Scenes','behind-the-scenes','Behind the scenes',NULL,7);
