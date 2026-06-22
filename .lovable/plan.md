## Agent Tarkwa — Auth swap, dashboard wipe, multi-CEX trade engine

### 1. Authentication — email/password + Google, allowlist kept

- Replace the magic-link only `/auth` page with a two-tab form: **Sign in** (email + password) and **Sign up** (email + password + display name). Keep a **Continue with Google** button using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- Keep the `allowed_emails` allowlist as the gate. The existing `handle_new_user` trigger already rejects un-allowlisted signups; pre-check on the client for friendly UX before calling `signUp`. Google sign-ins are checked client-side post-auth and signed out + toasted if not allowed.
- Add a `/reset-password` page calling `supabase.auth.updateUser({ password })` and a "Forgot password" link wired to `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`.
- Enable Lovable-managed Google provider via `configure_social_auth`; keep email provider on; do **not** disable signups (allowlist trigger is the gate).
- Admin allowlist UI on `/admin` already exists — unchanged.

### 2. Dashboard wipe & "review-then-repopulate" loop

Across `CommandCenter`, `ExecutiveCommand`, `BusinessDevelopment`, `GriAnalytics`, `GriProductMatrix`:

- Strip hard-coded budget / prize-money / capacity figures. Render each KPI tile as a **"Awaiting agent intake"** placeholder when the new `operational_figures` table has no current row.
- New table `operational_figures (event_code, key, value numeric, unit, source_agent, requested_at, captured_at, status: pending|captured|stale, citation jsonb)`. RLS: editors/admins write, viewers read.
- On mount of each board, if any required key is missing, dispatch a row into `agent_requests` (kind `figure-intake`) addressed to the owning department (Finance Custodian for budget, BD Accomplice for sponsorship, Ops Orchestrator for capacity, ESG Controller for emissions). The Lead Guardian broadcast in `deriveComms` calls the wipe out as "passive observation — figures cleared, intake dispatched."
- `AgentChat` persona `finance-custodian` gets a tool `record_operational_figure({ event_code, key, value, unit, citation })` (server-side via `agent-invoke` tool-call handling) that upserts into `operational_figures` and marks the matching `agent_requests` row `fulfilled`.

### 3. Multi-CEX spot trading + websocket scanner

#### 3.1 Exchanges & secrets

- Targets: **MEXC, LBank, Bybit, Phemex, HTX, Bitunix Pro**. Each needs a key+secret pair stored as runtime secrets (`MEXC_API_KEY` / `MEXC_API_SECRET`, etc.) — requested via `add_secret` once the user approves this plan. Trading scope required.
- Public order-book websockets (no key) are used for the scanner; private REST/WS endpoints are used for order placement.

#### 3.2 Tables

- `cex_accounts (exchange, label, status, daily_cap_usdc, hard_stop_pct)`
- `trade_universe (symbol, base, quote, exchanges text[], esg_tag, enabled)` — populated from a startup job that intersects each exchange's symbol list and tags ones whose project metadata contains ESG keywords (carbon, climate, renew, regen, green, water, impact). Tokens with no ESG affinity are still tradable but flagged `esg_tag = null`.
- `trade_intents (id, source_event_code, source_task_id, allocated_usdc, symbol, buy_exchange, sell_exchange, expected_spread_bps, status: queued|executing|filled|aborted|breakeven_hold, created_at)`
- `trade_fills (intent_id, side, exchange, price, qty, fee_usdc, ts, remote_order_id)`
- `trade_positions (symbol, exchange, qty, entry_price, entry_fees_usdc, current_floor)` — enforces hard-stop: never close below `entry_price + fees_per_unit`; trailing floor ratchets up.
- `trade_pnl_daily (date, realised_usdc, unrealised_usdc, allocated_usdc, status: green|halt)` — when `realised_usdc < 0` after a fill, scanner halts new buys for the day.
- `orderbook_snapshots (symbol, exchange, bid, ask, ts)` — rolling 5-min window, used by spread scanner.

#### 3.3 Edge functions

- `cex-ws-scanner` (Deno, long-running via `Deno.serve` + scheduled `keep-alive` cron every 4 min): opens public depth WS per exchange, writes top-of-book to `orderbook_snapshots`, emits Postgres `NOTIFY arb_signal` when cross-exchange spread > 25 bps (configurable).
- `trade-execute`: invoked by NOTIFY listener + by `task-completion` hook. Inputs `{ intent_id }`. Pulls latest book, places limit-buy on cheap venue + limit-sell on rich venue via the exchange's signed REST (per-exchange adapter modules: `mexc.ts`, `lbank.ts`, `bybit.ts`, `phemex.ts`, `htx.ts`, `bitunix.ts`). Writes `trade_fills`. Refuses if `trade_pnl_daily.status = halt` or if sell price would break the hard-stop floor (then sets intent `breakeven_hold`).
- `task-completion-hook`: triggered from the existing event-engine when a `tasks` row flips to `completed`. Allocates a fixed USDC budget keyed off `taskClass` (lookup table `task_trade_budget`), picks current top spread from `orderbook_snapshots`, inserts a `trade_intents` row, then invokes `trade-execute` if `pnl_daily ≥ 0` and `spread > threshold`. Otherwise the intent stays `queued` for human review in `agent_requests`.
- `position-floor-keeper` (cron every 1 min): ratchets `current_floor` upward as price rises so positions never close below entry+fees.

#### 3.4 Frontend

- New `/command/trading` route with three panels:
  1. **Live spreads** — top-of-book grid per symbol across the six venues (streamed via Supabase Realtime on `orderbook_snapshots`).
  2. **Intents & fills** — table of `trade_intents` with status badges, originating task chip, allocated USDC, PnL.
  3. **Positions & PnL** — open positions, floor vs market, day PnL bar, halt indicator.
- Comm stream (`deriveComms`) gains synthesized "Finance Custodian → Guardian" lines when trades fill or get held at break-even.
- Wallet panel (`executive-workforce.ts` `WalletState`) now sources `balanceUSDC` from aggregated CEX balances (per-exchange `/account` poll every 30 s).

#### 3.5 Guardrails

- Per-task allocation capped by `cex_accounts.daily_cap_usdc`.
- `consecutive402` analogue: two consecutive failed fills on the same symbol/venue blacklist that pair for 15 min.
- Hard-stop enforced server-side in `trade-execute`, not just UI.
- All exchange secrets server-only; client only sees aggregated state.

### 4. x402 funding link

`executeX402` in `executive-workforce.ts` already gates spend; extend so that when a payment settles, the Finance Custodian queues a matching `trade_intents` row sized to recover the spend (so x402 outflow is offset by spot opportunity). Same hard-stop applies.

### 5. Out of scope (this iteration)

- Margin, futures, perp funding-rate arbitrage.
- On-chain DEX trading.
- Tax accounting export.
- Building bespoke OAuth flows for any exchange that doesn't expose a public WS.

### Sequencing

1. Migration: drop hard-coded figure seeds; add `operational_figures`, `cex_accounts`, `trade_universe`, `trade_intents`, `trade_fills`, `trade_positions`, `trade_pnl_daily`, `orderbook_snapshots`, `task_trade_budget`. GRANT + RLS for each.
2. Auth rebuild: `/auth` (tabs), `/reset-password`, `configure_social_auth(['google'])`.
3. Request CEX secrets via `add_secret` (12 secrets total).
4. Edge functions: per-exchange adapters, `cex-ws-scanner`, `trade-execute`, `task-completion-hook`, `position-floor-keeper`.
5. Frontend: wipe figure placeholders, add `/command/trading`, wire Realtime channels, add comm stream entries.
6. pg_cron schedules: scanner keep-alive (4 min), floor keeper (1 min), balance poll (30 s via edge function self-invoke).

### User actions required after approval

- Paste API key+secret pairs for each of the six exchanges into the secure form when prompted.
- Confirm initial per-exchange `daily_cap_usdc` and the spread threshold (default 25 bps) on the new `/command/trading` settings panel.                     

Ensure our activies are reflecting in the ESG reports 

&nbsp;

allow a live audit report  trails