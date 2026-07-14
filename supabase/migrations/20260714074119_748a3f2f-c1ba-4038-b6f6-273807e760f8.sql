
CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate every policy that used public.has_role to use app_private.has_role
-- agent_invocations
DROP POLICY IF EXISTS "Users read own invocations" ON public.agent_invocations;
CREATE POLICY "Users read own invocations" ON public.agent_invocations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR app_private.has_role(auth.uid(),'admin'));

-- agent_requests: elevated read + write
DROP POLICY IF EXISTS "auth read agent_requests" ON public.agent_requests;
DROP POLICY IF EXISTS "editors write agent_requests" ON public.agent_requests;
CREATE POLICY "elevated read agent_requests" ON public.agent_requests FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "editors write agent_requests" ON public.agent_requests FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- allowed_emails: admin only
DROP POLICY IF EXISTS "auth read allowed_emails" ON public.allowed_emails;
DROP POLICY IF EXISTS "admins manage allowed_emails" ON public.allowed_emails;
CREATE POLICY "admins manage allowed_emails" ON public.allowed_emails FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

-- cex_accounts
DROP POLICY IF EXISTS "auth read cex" ON public.cex_accounts;
DROP POLICY IF EXISTS "admin write cex" ON public.cex_accounts;
CREATE POLICY "elevated read cex" ON public.cex_accounts FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "admin write cex" ON public.cex_accounts FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

-- events_log
DROP POLICY IF EXISTS "Editors write events" ON public.events_log;
CREATE POLICY "Editors write events" ON public.events_log FOR INSERT TO authenticated
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor') OR app_private.has_role(auth.uid(),'actor'));

-- gri_disclosures
DROP POLICY IF EXISTS "admins delete gri" ON public.gri_disclosures;
DROP POLICY IF EXISTS "editors update gri" ON public.gri_disclosures;
DROP POLICY IF EXISTS "editors write gri" ON public.gri_disclosures;
CREATE POLICY "admins delete gri" ON public.gri_disclosures FOR DELETE TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'));
CREATE POLICY "editors update gri" ON public.gri_disclosures FOR UPDATE TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "editors write gri" ON public.gri_disclosures FOR INSERT TO authenticated
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- narrative_entries
DROP POLICY IF EXISTS "Editors write narrative" ON public.narrative_entries;
CREATE POLICY "Editors write narrative" ON public.narrative_entries FOR INSERT TO authenticated
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- operational_figures
DROP POLICY IF EXISTS "editors write figures" ON public.operational_figures;
CREATE POLICY "editors write figures" ON public.operational_figures FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- orderbook_snapshots
DROP POLICY IF EXISTS "auth read ob" ON public.orderbook_snapshots;
DROP POLICY IF EXISTS "editor write ob" ON public.orderbook_snapshots;
CREATE POLICY "elevated read ob" ON public.orderbook_snapshots FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "editor write ob" ON public.orderbook_snapshots FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- social_accounts
DROP POLICY IF EXISTS "editors write social_accounts" ON public.social_accounts;
CREATE POLICY "editors write social_accounts" ON public.social_accounts FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- social_posts
DROP POLICY IF EXISTS "editors write social_posts" ON public.social_posts;
CREATE POLICY "editors write social_posts" ON public.social_posts FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor') OR app_private.has_role(auth.uid(),'actor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor') OR app_private.has_role(auth.uid(),'actor'));

-- task_trade_budget
DROP POLICY IF EXISTS "auth read budget" ON public.task_trade_budget;
DROP POLICY IF EXISTS "admin write budget" ON public.task_trade_budget;
CREATE POLICY "elevated read budget" ON public.task_trade_budget FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "admin write budget" ON public.task_trade_budget FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

-- trade_fills
DROP POLICY IF EXISTS "auth read fills" ON public.trade_fills;
DROP POLICY IF EXISTS "service write fills" ON public.trade_fills;
CREATE POLICY "elevated read fills" ON public.trade_fills FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "service write fills" ON public.trade_fills FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- trade_intents
DROP POLICY IF EXISTS "auth read intents" ON public.trade_intents;
DROP POLICY IF EXISTS "editor write intents" ON public.trade_intents;
CREATE POLICY "elevated read intents" ON public.trade_intents FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "editor write intents" ON public.trade_intents FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- trade_pnl_daily
DROP POLICY IF EXISTS "auth read pnl" ON public.trade_pnl_daily;
DROP POLICY IF EXISTS "editor write pnl" ON public.trade_pnl_daily;
CREATE POLICY "elevated read pnl" ON public.trade_pnl_daily FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "editor write pnl" ON public.trade_pnl_daily FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- trade_positions
DROP POLICY IF EXISTS "auth read pos" ON public.trade_positions;
DROP POLICY IF EXISTS "editor write pos" ON public.trade_positions;
CREATE POLICY "elevated read pos" ON public.trade_positions FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "editor write pos" ON public.trade_positions FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- trade_universe
DROP POLICY IF EXISTS "auth read uni" ON public.trade_universe;
DROP POLICY IF EXISTS "editor write uni" ON public.trade_universe;
CREATE POLICY "elevated read uni" ON public.trade_universe FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "editor write uni" ON public.trade_universe FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- user_roles
DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

-- x402_settlements
DROP POLICY IF EXISTS "Auth read settlements" ON public.x402_settlements;
DROP POLICY IF EXISTS "Admins write settlements" ON public.x402_settlements;
CREATE POLICY "elevated read settlements" ON public.x402_settlements FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));
CREATE POLICY "elevated write settlements" ON public.x402_settlements FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin') OR app_private.has_role(auth.uid(),'editor'));

-- audit_trail: fix always-true INSERT
DROP POLICY IF EXISTS "auth insert audit" ON public.audit_trail;
CREATE POLICY "auth insert audit" ON public.audit_trail FOR INSERT TO authenticated
  WITH CHECK (
    app_private.has_role(auth.uid(),'admin') OR
    app_private.has_role(auth.uid(),'editor') OR
    app_private.has_role(auth.uid(),'actor')
  );

-- Finally drop the public function so it is no longer callable via the API
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
