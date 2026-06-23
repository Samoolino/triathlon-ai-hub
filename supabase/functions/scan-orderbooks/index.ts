// scan-orderbooks — polls public ticker REST endpoints for enabled CEXs and
// writes top-of-book to orderbook_snapshots. Simpler + more robust than holding
// long-lived WS in an edge function. Triggered by pg_cron every minute or on demand.
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Ticker = { symbol: string; bid: number; ask: number };

const DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL", "KLIMA", "MCO2", "NCT", "BCT", "REGEN"];

async function fetchMexc(symbols: string[]): Promise<Ticker[]> {
  const r = await fetch("https://api.mexc.com/api/v3/ticker/bookTicker");
  if (!r.ok) return [];
  const all = await r.json() as Array<{ symbol: string; bidPrice: string; askPrice: string }>;
  return all
    .filter((t) => symbols.some((s) => t.symbol === `${s}USDT`))
    .map((t) => ({ symbol: t.symbol.replace("USDT", "/USDT"), bid: +t.bidPrice, ask: +t.askPrice }));
}
async function fetchLbank(symbols: string[]): Promise<Ticker[]> {
  const out: Ticker[] = [];
  for (const s of symbols) {
    const pair = `${s.toLowerCase()}_usdt`;
    try {
      const r = await fetch(`https://api.lbkex.com/v2/ticker.do?symbol=${pair}`);
      const d = await r.json();
      const t = d?.data?.[0]?.ticker;
      if (t) out.push({ symbol: `${s}/USDT`, bid: +t.high === 0 ? 0 : +t.latest, ask: +t.latest });
    } catch { /* skip */ }
  }
  return out;
}
async function fetchHtx(symbols: string[]): Promise<Ticker[]> {
  const r = await fetch("https://api.huobi.pro/market/tickers");
  if (!r.ok) return [];
  const d = await r.json();
  const list = (d?.data ?? []) as Array<{ symbol: string; bid: number; ask: number }>;
  return list
    .filter((t) => symbols.some((s) => t.symbol === `${s.toLowerCase()}usdt`))
    .map((t) => ({ symbol: t.symbol.toUpperCase().replace("USDT", "/USDT"), bid: t.bid, ask: t.ask }));
}
async function fetchPhemex(symbols: string[]): Promise<Ticker[]> {
  try {
    const r = await fetch("https://api.phemex.com/md/spot/ticker/24hr/all");
    const d = await r.json();
    const list = (d?.result ?? []) as Array<{ symbol: string; bidEp: number; askEp: number; priceScale?: number }>;
    return list
      .filter((t) => symbols.some((s) => t.symbol === `s${s}USDT`))
      .map((t) => {
        const scale = Math.pow(10, t.priceScale ?? 8);
        return { symbol: t.symbol.slice(1).replace("USDT", "/USDT"), bid: t.bidEp / scale, ask: t.askEp / scale };
      });
  } catch { return []; }
}

const FETCHERS: Record<string, (s: string[]) => Promise<Ticker[]>> = {
  mexc: fetchMexc, lbank: fetchLbank, htx: fetchHtx, phemex: fetchPhemex,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const sb = createClient(SUPA_URL, SUPA_KEY);
  const { data: accts } = await sb.from("cex_accounts").select("exchange,status").neq("status", "disabled");
  const enabled = (accts ?? []).map((a) => a.exchange).filter((e) => FETCHERS[e]);
  const rows: Array<{ symbol: string; exchange: string; bid: number; ask: number }> = [];
  for (const ex of enabled) {
    try {
      const ts = await FETCHERS[ex](DEFAULT_SYMBOLS);
      for (const t of ts) {
        if (t.bid > 0 && t.ask > 0) rows.push({ exchange: ex, ...t });
      }
    } catch (e) { console.warn(ex, e); }
  }
  if (rows.length) await sb.from("orderbook_snapshots").insert(rows);
  // garbage collect
  await sb.from("orderbook_snapshots").delete().lt("ts", new Date(Date.now() - 15 * 60_000).toISOString());

  // Detect arbitrage spreads
  const { data: snap } = await sb.from("orderbook_snapshots").select("*").gte("ts", new Date(Date.now() - 60_000).toISOString());
  const bySym = new Map<string, typeof snap>();
  for (const row of snap ?? []) {
    if (!bySym.has(row.symbol)) bySym.set(row.symbol, []);
    bySym.get(row.symbol)!.push(row);
  }
  const signals: Array<{ symbol: string; buy_exchange: string; sell_exchange: string; spread_bps: number }> = [];
  for (const [sym, rs] of bySym) {
    const minAsk = rs!.reduce((a, b) => (b.ask < a.ask ? b : a));
    const maxBid = rs!.reduce((a, b) => (b.bid > a.bid ? b : a));
    if (minAsk.exchange === maxBid.exchange) continue;
    const bps = ((maxBid.bid - minAsk.ask) / minAsk.ask) * 10000;
    if (bps > 25) signals.push({ symbol: sym, buy_exchange: minAsk.exchange, sell_exchange: maxBid.exchange, spread_bps: bps });
  }

  await sb.from("audit_trail").insert({
    actor: "scan-orderbooks", action: "scan", subject: "cex",
    payload: { exchanges: enabled, rows: rows.length, signals: signals.length },
  });

  return new Response(JSON.stringify({ ok: true, rows: rows.length, signals }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
