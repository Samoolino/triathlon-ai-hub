
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.allowed_emails (
  email citext PRIMARY KEY,
  role public.app_role NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.allowed_emails TO authenticated;
GRANT ALL ON public.allowed_emails TO service_role;
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read allowed_emails" ON public.allowed_emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage allowed_emails" ON public.allowed_emails FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.allowed_emails (email, role, note) VALUES ('esgsportrive@gmail.com', 'admin', 'Root admin')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_email citext := LOWER(NEW.email)::citext;
BEGIN
  IF v_email <> 'esgsportrive@gmail.com' AND NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = v_email) THEN
    RAISE EXCEPTION 'Email % is not authorised. Ask the admin to add you to the access list.', NEW.email USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  IF v_email = 'esgsportrive@gmail.com' THEN
    v_role := 'admin';
  ELSE
    SELECT role INTO v_role FROM public.allowed_emails WHERE email = v_email;
    IF v_role IS NULL THEN v_role := 'viewer'; END IF;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.gri_disclosures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code text NOT NULL,
  gri_code text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in-progress','terminal')),
  disclosure_type text NOT NULL DEFAULT 'full' CHECK (disclosure_type IN ('full','nda')),
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  narrative text,
  citations text[] NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_code, gri_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gri_disclosures TO authenticated;
GRANT ALL ON public.gri_disclosures TO service_role;
ALTER TABLE public.gri_disclosures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read gri" ON public.gri_disclosures FOR SELECT TO authenticated USING (true);
CREATE POLICY "editors write gri" ON public.gri_disclosures FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "editors update gri" ON public.gri_disclosures FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "admins delete gri" ON public.gri_disclosures FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_gri_disclosures_updated BEFORE UPDATE ON public.gri_disclosures FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.gri_external_facts (
  key text PRIMARY KEY,
  source text NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gri_external_facts TO authenticated;
GRANT ALL ON public.gri_external_facts TO service_role;
ALTER TABLE public.gri_external_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read facts" ON public.gri_external_facts FOR SELECT TO authenticated USING (true);

CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code text,
  platform text NOT NULL CHECK (platform IN ('x','instagram','linkedin','facebook','tiktok','youtube')),
  handle text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','pending_oauth','connected','revoked')),
  connection_id text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read social_accounts" ON public.social_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "editors write social_accounts" ON public.social_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER tg_social_accounts_updated BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code text NOT NULL,
  account_id uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('image','video','text')),
  prompt text,
  generated_media_url text,
  caption text,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','posted','failed')),
  approval_state text NOT NULL DEFAULT 'pending' CHECK (approval_state IN ('pending','approved','rejected')),
  remote_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read social_posts" ON public.social_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "editors write social_posts" ON public.social_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'actor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'actor'));
CREATE TRIGGER tg_social_posts_updated BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.agent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('oauth-link','account-create','approval','generic')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','fulfilled','dismissed')),
  assignee_email citext,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_requests TO authenticated;
GRANT ALL ON public.agent_requests TO service_role;
ALTER TABLE public.agent_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read agent_requests" ON public.agent_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "editors write agent_requests" ON public.agent_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE TRIGGER tg_agent_requests_updated BEFORE UPDATE ON public.agent_requests FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.media_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('image','video')),
  prompt text NOT NULL,
  aspect_ratio text DEFAULT '16:9',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  result_url text,
  error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_jobs TO authenticated;
GRANT ALL ON public.media_jobs TO service_role;
ALTER TABLE public.media_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read media_jobs" ON public.media_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert media_jobs" ON public.media_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
