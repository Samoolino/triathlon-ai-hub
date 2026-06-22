
-- Operational figures (dashboard wipe + agent intake)
CREATE TABLE public.operational_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code text,
  key text NOT NULL,
  value numeric,
  unit text,
  source_agent text,
  status text NOT NULL DEFAULT 'pending',
  citation jsonb DEFAULT '{}'::jsonb,
  requested_at timestamptz NOT NULL DEFAULT now(),
  captured_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_code, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_figures TO authenticated;
GRANT ALL ON public.operational_figures TO service_role;
ALTER TABLE public.operational_figures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read figures" ON public.operational_figures FOR SELECT TO authenticated USING (true);
CREATE POLICY "editors write figures" ON public.operational_figures FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER trg_opfig_updated BEFORE UPDATE ON public.operational_figures
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- CEX accounts
CREATE TABLE public.cex_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange text NOT NULL UNIQUE,
  label text,
  status text NOT NULL DEFAULT 'pending',
  daily_cap_usdc numeric NOT NULL DEFAULT 50,
  hard_stop_pct numeric NOT NULL DEFAULT 0.0,
  spread_threshold_bps integer NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cex_accounts TO authenticated;
GRANT ALL ON public.cex_accounts TO service_role;
ALTER TABLE public.cex_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read cex" ON public.cex_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write cex" ON public.cex_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_cex_updated BEFORE UPDATE ON public.cex_accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

INSERT INTO public.cex_accounts (exchange,label) VALUES
  ('mexc','MEXC'),('lbank','LBank'),('bybit','Bybit'),
  ('phemex','Phemex'),('htx','HTX'),('bitunix','Bitunix Pro');

-- Trade universe
CREATE TABLE public.trade_universe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  base text NOT NULL,
  quote text NOT NULL DEFAULT 'USDT',
  exchanges text[] NOT NULL DEFAULT '{}',
  esg_tag text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (symbol)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_universe TO authenticated;
GRANT ALL ON public.trade_universe TO service_role;
ALTER TABLE public.trade_universe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read uni" ON public.trade_universe FOR SELECT TO authenticated USING (true);
CREATE POLICY "editor write uni" ON public.trade_universe FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Trade intents
CREATE TABLE public.trade_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_code text,
  source_task_id text,
  allocated_usdc numeric NOT NULL,
  symbol text NOT NULL,
  buy_exchange text,
  sell_exchange text,
  expected_spread_bps numeric,
  status text NOT NULL DEFAULT 'queued',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_intents TO authenticated;
GRANT ALL ON public.trade_intents TO service_role;
ALTER TABLE public.trade_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read intents" ON public.trade_intents FOR SELECT TO authenticated USING (true);
CREATE POLICY "editor write intents" ON public.trade_intents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER trg_intents_updated BEFORE UPDATE ON public.trade_intents
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- Trade fills
CREATE TABLE public.trade_fills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid REFERENCES public.trade_intents(id) ON DELETE CASCADE,
  side text NOT NULL,
  exchange text NOT NULL,
  symbol text NOT NULL,
  price numeric NOT NULL,
  qty numeric NOT NULL,
  fee_usdc numeric NOT NULL DEFAULT 0,
  remote_order_id text,
  ts timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_fills TO authenticated;
GRANT ALL ON public.trade_fills TO service_role;
ALTER TABLE public.trade_fills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read fills" ON public.trade_fills FOR SELECT TO authenticated USING (true);
CREATE POLICY "service write fills" ON public.trade_fills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Trade positions
CREATE TABLE public.trade_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  exchange text NOT NULL,
  qty numeric NOT NULL DEFAULT 0,
  entry_price numeric NOT NULL DEFAULT 0,
  entry_fees_usdc numeric NOT NULL DEFAULT 0,
  current_floor numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (symbol, exchange)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_positions TO authenticated;
GRANT ALL ON public.trade_positions TO service_role;
ALTER TABLE public.trade_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read pos" ON public.trade_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "editor write pos" ON public.trade_positions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER trg_pos_updated BEFORE UPDATE ON public.trade_positions
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- Daily PnL
CREATE TABLE public.trade_pnl_daily (
  date date PRIMARY KEY DEFAULT current_date,
  realised_usdc numeric NOT NULL DEFAULT 0,
  unrealised_usdc numeric NOT NULL DEFAULT 0,
  allocated_usdc numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'green',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_pnl_daily TO authenticated;
GRANT ALL ON public.trade_pnl_daily TO service_role;
ALTER TABLE public.trade_pnl_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read pnl" ON public.trade_pnl_daily FOR SELECT TO authenticated USING (true);
CREATE POLICY "editor write pnl" ON public.trade_pnl_daily FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Orderbook snapshots
CREATE TABLE public.orderbook_snapshots (
  id bigserial PRIMARY KEY,
  symbol text NOT NULL,
  exchange text NOT NULL,
  bid numeric NOT NULL,
  ask numeric NOT NULL,
  ts timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ob_symbol_ts ON public.orderbook_snapshots (symbol, ts DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orderbook_snapshots TO authenticated;
GRANT ALL ON public.orderbook_snapshots TO service_role;
ALTER TABLE public.orderbook_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read ob" ON public.orderbook_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "editor write ob" ON public.orderbook_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Per-task-class budget
CREATE TABLE public.task_trade_budget (
  task_class text PRIMARY KEY,
  usdc_per_completion numeric NOT NULL DEFAULT 1.0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_trade_budget TO authenticated;
GRANT ALL ON public.task_trade_budget TO service_role;
ALTER TABLE public.task_trade_budget ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read budget" ON public.task_trade_budget FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write budget" ON public.task_trade_budget FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.task_trade_budget (task_class, usdc_per_completion) VALUES
  ('governance', 1.0),('reporting', 1.0),('prize-money', 2.0),
  ('environmental', 1.0),('anti-doping', 0.5),('fop', 0.5),
  ('medical', 0.5),('nutrition', 0.5),('registration', 0.5),
  ('services', 0.5),('communications', 1.0);

-- Audit trail (append-only)
CREATE TABLE public.audit_trail (
  id bigserial PRIMARY KEY,
  actor text NOT NULL,
  actor_type text NOT NULL DEFAULT 'agent',
  action text NOT NULL,
  subject text,
  payload jsonb DEFAULT '{}'::jsonb,
  ts timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_ts ON public.audit_trail (ts DESC);
GRANT SELECT, INSERT ON public.audit_trail TO authenticated;
GRANT ALL ON public.audit_trail TO service_role;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read audit" ON public.audit_trail FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert audit" ON public.audit_trail FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orderbook_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_intents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_fills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_trail;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_figures;
