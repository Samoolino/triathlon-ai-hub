import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Snap = { id: number; symbol: string; exchange: string; bid: number; ask: number; ts: string };
type Intent = { id: string; symbol: string; buy_exchange: string; sell_exchange: string; expected_spread_bps: number; allocated_usdc: number; status: string; source_task_id: string | null; created_at: string };
type Pnl = { date: string; realised_usdc: number; allocated_usdc: number; status: string };
type Audit = { id: number; actor: string; action: string; subject: string | null; payload: Record<string, unknown>; ts: string };

export default function TradingConsole() {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [pnl, setPnl] = useState<Pnl | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    const today = new Date().toISOString().slice(0, 10);
    const [s, i, p, a] = await Promise.all([
      supabase.from("orderbook_snapshots").select("*").gte("ts", new Date(Date.now() - 5 * 60_000).toISOString()).order("ts", { ascending: false }).limit(200),
      supabase.from("trade_intents").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("trade_pnl_daily").select("*").eq("date", today).maybeSingle(),
      supabase.from("audit_trail").select("*").order("ts", { ascending: false }).limit(20),
    ]);
    setSnaps((s.data ?? []) as Snap[]);
    setIntents((i.data ?? []) as Intent[]);
    setPnl((p.data ?? null) as Pnl | null);
    setAudit((a.data ?? []) as Audit[]);
  }

  useEffect(() => {
    loadAll();
    const ch = supabase.channel("trading")
      .on("postgres_changes", { event: "*", schema: "public", table: "orderbook_snapshots" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "trade_intents" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_trail" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function triggerScan() {
    setBusy(true);
    try { await supabase.functions.invoke("scan-orderbooks", { body: {} }); await loadAll(); }
    finally { setBusy(false); }
  }

  async function triggerTrade() {
    setBusy(true);
    try {
      await supabase.functions.invoke("task-complete-trade", { body: { task_id: `manual-${Date.now()}`, task_class: "governance", event_code: "manual" } });
      await loadAll();
    } finally { setBusy(false); }
  }

  // Build spreads grid: latest per (symbol, exchange)
  const latest = new Map<string, Snap>();
  for (const s of snaps) {
    const k = `${s.symbol}|${s.exchange}`;
    if (!latest.has(k)) latest.set(k, s);
  }
  const symbols = Array.from(new Set(Array.from(latest.values()).map((v) => v.symbol)));
  const exchanges = Array.from(new Set(Array.from(latest.values()).map((v) => v.exchange)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Finance Custodian · Spot Trading</p>
          <h2 className="font-display text-xl text-foreground">Multi-CEX arbitrage console</h2>
          <p className="mt-1 text-xs text-muted-foreground">Hard-stop: never sell below entry+fees · daily floor enforced · paper-trade until exchange API keys land.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={triggerScan} disabled={busy} className="rounded-sm border border-console-line bg-console-sunken px-3 py-1.5 text-[10px] uppercase tracking-wider hover:bg-muted">Scan books</button>
          <button onClick={triggerTrade} disabled={busy} className="rounded-sm bg-primary px-3 py-1.5 text-[10px] uppercase tracking-wider text-primary-foreground">Simulate task→trade</button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Day PnL (USDC)" value={pnl ? pnl.realised_usdc.toFixed(4) : "0.0000"} accent={pnl?.status === "halt" ? "destructive" : "accent"} />
        <Stat label="Allocated today" value={pnl ? pnl.allocated_usdc.toFixed(2) : "0.00"} />
        <Stat label="Engine status" value={pnl?.status?.toUpperCase() ?? "GREEN"} accent={pnl?.status === "halt" ? "destructive" : "accent"} />
      </div>

      <section className="rounded-sm border border-console-line bg-command-surface p-4">
        <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live spreads (top of book, last 5 min)</h3>
        {symbols.length === 0 ? (
          <p className="text-xs text-muted-foreground">No snapshots yet — hit "Scan books".</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-muted-foreground">
                <tr><th className="px-2 py-1 text-left">Symbol</th>{exchanges.map((e) => <th key={e} className="px-2 py-1 text-right">{e}</th>)}<th className="px-2 py-1 text-right">Spread (bps)</th></tr>
              </thead>
              <tbody>
                {symbols.map((sym) => {
                  const row = exchanges.map((e) => latest.get(`${sym}|${e}`));
                  const asks = row.filter(Boolean).map((r) => r!.ask);
                  const bids = row.filter(Boolean).map((r) => r!.bid);
                  const bps = asks.length && bids.length ? ((Math.max(...bids) - Math.min(...asks)) / Math.min(...asks)) * 10000 : 0;
                  return (
                    <tr key={sym} className="border-t border-console-line/50">
                      <td className="px-2 py-1 font-mono">{sym}</td>
                      {row.map((r, i) => <td key={i} className="px-2 py-1 text-right font-mono">{r ? `${r.bid.toFixed(4)}/${r.ask.toFixed(4)}` : "—"}</td>)}
                      <td className={`px-2 py-1 text-right font-mono ${bps > 25 ? "text-accent" : "text-muted-foreground"}`}>{bps.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-sm border border-console-line bg-command-surface p-4">
        <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Trade intents</h3>
        {intents.length === 0 ? <p className="text-xs text-muted-foreground">No intents yet.</p> : (
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-muted-foreground">
              <tr><th className="px-2 py-1 text-left">Time</th><th className="px-2 py-1 text-left">Symbol</th><th className="px-2 py-1 text-left">Route</th><th className="px-2 py-1 text-right">Spread</th><th className="px-2 py-1 text-right">USDC</th><th className="px-2 py-1 text-left">Status</th></tr>
            </thead>
            <tbody>
              {intents.map((it) => (
                <tr key={it.id} className="border-t border-console-line/50">
                  <td className="px-2 py-1 font-mono">{new Date(it.created_at).toLocaleTimeString()}</td>
                  <td className="px-2 py-1 font-mono">{it.symbol}</td>
                  <td className="px-2 py-1 font-mono">{it.buy_exchange} → {it.sell_exchange}</td>
                  <td className="px-2 py-1 text-right font-mono">{Number(it.expected_spread_bps).toFixed(1)} bps</td>
                  <td className="px-2 py-1 text-right font-mono">{Number(it.allocated_usdc).toFixed(2)}</td>
                  <td className="px-2 py-1 font-mono uppercase text-[10px]">{it.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-sm border border-console-line bg-command-surface p-4">
        <h3 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live audit trail</h3>
        <ul className="space-y-1 font-mono text-[11px]">
          {audit.map((a) => (
            <li key={a.id} className="flex gap-2 border-b border-console-line/30 py-1">
              <span className="text-muted-foreground">{new Date(a.ts).toLocaleTimeString()}</span>
              <span className="text-accent">{a.actor}</span>
              <span className="uppercase text-[10px] text-muted-foreground">{a.action}</span>
              <span className="truncate text-foreground/80">{a.subject ?? ""}</span>
            </li>
          ))}
          {audit.length === 0 && <li className="text-muted-foreground">No audit events yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, accent = "accent" }: { label: string; value: string; accent?: "accent" | "destructive" }) {
  return (
    <div className="rounded-sm border border-console-line bg-command-surface p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-xl ${accent === "destructive" ? "text-destructive" : "text-accent"}`}>{value}</p>
    </div>
  );
}
