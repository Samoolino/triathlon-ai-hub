import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

type Figure = { id: string; event_code: string | null; key: string; value: number | null; unit: string | null; status: string; source_agent: string | null; captured_at: string | null };

const REQUIRED_KEYS = [
  { key: "event_budget_usdc", unit: "USDC", agent: "finance-custodian", label: "Event budget" },
  { key: "prize_pool_usdc", unit: "USDC", agent: "finance-custodian", label: "Prize pool" },
  { key: "athlete_capacity", unit: "athletes", agent: "ops-orchestrator", label: "Athlete capacity" },
  { key: "sponsor_commitments_usdc", unit: "USDC", agent: "bd-strategist", label: "Sponsor commitments" },
  { key: "scope1_emissions_tco2e", unit: "tCO2e", agent: "esg-controller", label: "Scope 1 emissions" },
  { key: "water_withdrawal_m3", unit: "m³", agent: "esg-controller", label: "Water withdrawal" },
];

export default function OperationalFigures({ eventCode = "tarkwa-jabi" }: { eventCode?: string }) {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("operational_figures").select("*").eq("event_code", eventCode);
    setFigures((data ?? []) as Figure[]);
  }
  useEffect(() => { load(); }, [eventCode]);

  async function wipeAndRequest() {
    setBusy(true);
    try {
      await supabase.from("operational_figures").delete().eq("event_code", eventCode);
      const rows = REQUIRED_KEYS.map((r) => ({ event_code: eventCode, key: r.key, unit: r.unit, source_agent: r.agent, status: "pending" }));
      await supabase.from("operational_figures").insert(rows);
      await supabase.from("audit_trail").insert({
        actor: "operator", actor_type: "human", action: "wipe-and-request", subject: eventCode,
        payload: { keys: REQUIRED_KEYS.map((r) => r.key) },
      });
      toast.success("Figures wiped. Agents notified to retrieve actuals.");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function setValue(key: string, valueStr: string) {
    const v = parseFloat(valueStr);
    if (isNaN(v)) return;
    const meta = REQUIRED_KEYS.find((r) => r.key === key);
    await supabase.from("operational_figures").upsert({
      event_code: eventCode, key, value: v, unit: meta?.unit, source_agent: meta?.agent,
      status: "captured", captured_at: new Date().toISOString(),
    }, { onConflict: "event_code,key" });
    await supabase.from("audit_trail").insert({ actor: "operator", actor_type: "human", action: "capture-figure", subject: key, payload: { value: v } });
    load();
  }

  const byKey = new Map(figures.map((f) => [f.key, f]));

  return (
    <section className="rounded-sm border border-console-line bg-command-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Lead Guardian · Intake</p>
          <h3 className="font-display text-lg text-foreground">Operational figures</h3>
          <p className="text-xs text-muted-foreground">All stale figures cleared. Each cell pending agent retrieval — overwrite when actuals confirmed.</p>
        </div>
        <button onClick={wipeAndRequest} disabled={busy} className="rounded-sm border border-destructive/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-destructive hover:bg-destructive/10">
          Wipe & dispatch
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REQUIRED_KEYS.map((r) => {
          const f = byKey.get(r.key);
          return (
            <div key={r.key} className="rounded-sm border border-console-line bg-console-sunken p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.label}</p>
              <p className="mt-1 text-[10px] text-accent">{r.agent}</p>
              {f?.status === "captured" && f.value != null ? (
                <p className="mt-2 font-display text-xl text-foreground">{Number(f.value).toLocaleString()} <span className="text-xs text-muted-foreground">{f.unit}</span></p>
              ) : (
                <p className="mt-2 font-mono text-xs text-muted-foreground">Awaiting agent intake…</p>
              )}
              <input
                type="number" step="any" placeholder={`Set ${r.unit}`}
                onBlur={(e) => e.target.value && setValue(r.key, e.target.value)}
                className="mt-2 w-full rounded-sm border border-console-line bg-background px-2 py-1 text-xs"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
