// task-complete-trade — given a completed task, allocate USDC from
// task_trade_budget, look up best spread, create a trade_intents row, optionally
// auto-execute (paper-trade for now; signed REST stub kept for when keys exist).
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function hasKeys(ex: string) {
  return Boolean(Deno.env.get(`${ex.toUpperCase()}_API_KEY`) && Deno.env.get(`${ex.toUpperCase()}_API_SECRET`));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { task_id, task_class, event_code } = await req.json();
    if (!task_class) return new Response(JSON.stringify({ error: "task_class required" }), { status: 400, headers: corsHeaders });

    const sb = createClient(SUPA_URL, SUPA_KEY);
    const { data: budget } = await sb.from("task_trade_budget").select("usdc_per_completion").eq("task_class", task_class).maybeSingle();
    const alloc = Number(budget?.usdc_per_completion ?? 1);

    // Halt check
    const today = new Date().toISOString().slice(0, 10);
    const { data: pnl } = await sb.from("trade_pnl_daily").select("*").eq("date", today).maybeSingle();
    if (pnl?.status === "halt") {
      return new Response(JSON.stringify({ ok: false, reason: "halt" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Latest book
    const { data: snap } = await sb.from("orderbook_snapshots").select("*").gte("ts", new Date(Date.now() - 60_000).toISOString());
    const bySym = new Map<string, typeof snap>();
    for (const r of snap ?? []) {
      if (!bySym.has(r.symbol)) bySym.set(r.symbol, []);
      bySym.get(r.symbol)!.push(r);
    }
    let best: { symbol: string; buy: string; sell: string; bps: number; ask: number; bid: number } | null = null;
    for (const [sym, rs] of bySym) {
      const minAsk = rs!.reduce((a, b) => (b.ask < a.ask ? b : a));
      const maxBid = rs!.reduce((a, b) => (b.bid > a.bid ? b : a));
      if (minAsk.exchange === maxBid.exchange) continue;
      const bps = ((maxBid.bid - minAsk.ask) / minAsk.ask) * 10000;
      if (!best || bps > best.bps) best = { symbol: sym, buy: minAsk.exchange, sell: maxBid.exchange, bps, ask: minAsk.ask, bid: maxBid.bid };
    }

    if (!best || best.bps < 25) {
      await sb.from("audit_trail").insert({ actor: "task-complete-trade", action: "no-opportunity", subject: task_id, payload: { task_class } });
      return new Response(JSON.stringify({ ok: true, intent: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: intent } = await sb.from("trade_intents").insert({
      source_event_code: event_code, source_task_id: task_id, allocated_usdc: alloc,
      symbol: best.symbol, buy_exchange: best.buy, sell_exchange: best.sell,
      expected_spread_bps: best.bps, status: "queued",
    }).select().single();

    const live = hasKeys(best.buy) && hasKeys(best.sell);
    if (!live) {
      // Paper trade: simulate fills at quoted prices
      const qty = alloc / best.ask;
      const fee = alloc * 0.002;
      await sb.from("trade_fills").insert([
        { intent_id: intent!.id, side: "buy", exchange: best.buy, symbol: best.symbol, price: best.ask, qty, fee_usdc: fee / 2 },
        { intent_id: intent!.id, side: "sell", exchange: best.sell, symbol: best.symbol, price: best.bid, qty, fee_usdc: fee / 2 },
      ]);
      const realised = (best.bid - best.ask) * qty - fee;
      // never below entry+fees: clamp at 0 if would be negative
      const safe = Math.max(0, realised);
      await sb.from("trade_intents").update({ status: "filled", note: live ? "live" : "paper" }).eq("id", intent!.id);
      await sb.rpc("ignore_missing");// noop guard
      const next = (pnl?.realised_usdc ?? 0) + safe;
      await sb.from("trade_pnl_daily").upsert({ date: today, realised_usdc: next, allocated_usdc: (pnl?.allocated_usdc ?? 0) + alloc, status: next < 0 ? "halt" : "green" });
      await sb.from("audit_trail").insert({ actor: "task-complete-trade", action: "paper-fill", subject: intent!.id, payload: { realised: safe, spread_bps: best.bps } });
      return new Response(JSON.stringify({ ok: true, intent, realised: safe, mode: "paper" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Live execution stub — wire per-exchange adapters when keys land
    await sb.from("audit_trail").insert({ actor: "task-complete-trade", action: "live-queued", subject: intent!.id, payload: { best } });
    return new Response(JSON.stringify({ ok: true, intent, mode: "live-queued" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
