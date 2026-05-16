import { useMemo, useState } from "react";
import { Briefcase, Target, Coins, Sparkles, ChevronRight } from "lucide-react";
import type { EventRuntime } from "@/lib/event-engine";
import {
  BD_ACTIVITIES,
  LEAD_STATUSES,
  advanceLeadStatus,
  buildLedger,
  scoreActivities,
  seedLeadsForEvent,
  synthesizeBrief,
  type BdLead,
  type LeadStatus,
} from "@/lib/business-development";

const tone = (v: string) => {
  const s = v.toLowerCase();
  if (s.match(/won|viable|stable|green/)) return "bg-state-stableBg text-state-stable border-state-stable/30";
  if (s.match(/proposal|engaged|conditional|amber|warning/)) return "bg-state-warningBg text-state-warning border-state-warning/30";
  if (s.match(/lost|not-ready|critical|danger|red/)) return "bg-state-dangerBg text-state-danger border-state-danger/30";
  return "bg-state-infoBg text-state-info border-state-info/30";
};

const Pill = ({ children }: { children: string }) => (
  <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${tone(children)}`}>
    {children}
  </span>
);

const fmt = (n: number) => `$${n.toLocaleString()}`;

// Per-event in-memory lead store
const LEAD_STORE: Record<string, BdLead[]> = {};
function getLeads(eventId: string): BdLead[] {
  if (!LEAD_STORE[eventId]) LEAD_STORE[eventId] = seedLeadsForEvent(eventId);
  return LEAD_STORE[eventId];
}

export default function BusinessDevelopment({ rt }: { rt: EventRuntime }) {
  const [, force] = useState(0);
  const leads = getLeads(rt.spec.id);
  const scores = useMemo(() => scoreActivities(rt, leads), [rt, leads]);
  const ledger = useMemo(() => buildLedger(rt, leads), [rt, leads]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const advance = (id: string) => {
    const l = leads.find((x) => x.id === id);
    if (!l) return;
    l.status = advanceLeadStatus(l.status);
    force((x) => x + 1);
  };
  const generateBrief = (id: string) => {
    const l = leads.find((x) => x.id === id);
    if (!l) return;
    const act = BD_ACTIVITIES.find((a) => a.id === l.activity)!;
    l.brief = synthesizeBrief(l, act, rt);
    setSelectedLead(id);
    force((x) => x + 1);
  };

  const byStatus = (s: LeadStatus) => leads.filter((l) => l.status === s);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-sm font-stencil text-foreground">
          <Briefcase className="h-4 w-4 text-accent" /> BD & Corporate Sponsorship
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          BD-Scout researches leads, scores product viability against live ops + GRI evidence, and ties cost/revenue back to the reporting suite.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Kpi label="Ops Cost" value={fmt(ledger.totalCost)} />
        <Kpi label="Pipeline" value={fmt(ledger.pipelineRevenue)} />
        <Kpi label="Won" value={fmt(ledger.wonRevenue)} />
        <Kpi label="Attainment" value={`${ledger.attainmentPct}%`} />
      </div>

      {/* Activity / Viability board */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-stencil text-sm"><Target className="h-4 w-4 text-accent" /> Activity Viability Board</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {scores.map((s) => (
            <article key={s.activity.id} className="rounded-sm border border-console-line bg-console-sunken p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{s.activity.id}</p>
                  <h4 className="font-stencil text-sm">{s.activity.label}</h4>
                </div>
                <Pill>{s.flag}</Pill>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.activity.thesis}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-command-surface">
                <div className="h-full bg-accent transition-all" style={{ width: `${s.viabilityScore}%` }} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>ops {s.opsReadinessPct}%</span>
                <span>evi {s.evidencePct}%</span>
                <span>pipe {s.pipelineDepth}%</span>
              </div>
              <div className="mt-2 border-t border-console-line pt-2 font-mono text-[11px] text-muted-foreground">
                Pipeline {fmt(s.pipelineValue)} · Won {fmt(s.wonValue)}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Lead pipeline kanban */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-stencil text-sm"><Sparkles className="h-4 w-4 text-accent" /> Lead Pipeline</h3>
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {LEAD_STATUSES.map((st) => (
            <div key={st} className="rounded-sm border border-console-line bg-console-sunken p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{st}</span>
                <span className="font-stencil text-xs">{byStatus(st).length}</span>
              </div>
              <div className="space-y-2">
                {byStatus(st).map((l) => {
                  const act = BD_ACTIVITIES.find((a) => a.id === l.activity)!;
                  return (
                    <button
                      key={l.id}
                      onClick={() => generateBrief(l.id)}
                      className={`w-full rounded-sm border border-console-line bg-command-surface p-2 text-left transition hover:border-accent/60 ${selectedLead === l.id ? "border-accent" : ""}`}
                    >
                      <p className="font-stencil text-[11px]">{l.company}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{act.label}</p>
                      <p className="mt-1 font-mono text-[10px] text-accent">{fmt(l.estimatedValue)} · ESG {l.esgFitScore}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedLead && (() => {
          const l = leads.find((x) => x.id === selectedLead);
          if (!l) return null;
          const act = BD_ACTIVITIES.find((a) => a.id === l.activity)!;
          return (
            <div className="mt-3 rounded-sm border border-accent/40 bg-console-sunken p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent">BD-SCOUT BRIEF · {l.id}</p>
                  <h4 className="font-stencil text-sm">{l.company} <span className="text-muted-foreground">· {l.sector}</span></h4>
                </div>
                <div className="flex items-center gap-2">
                  <Pill>{l.status}</Pill>
                  {l.status !== "won" && l.status !== "lost" && (
                    <button onClick={() => advance(l.id)} className="rounded-sm border border-console-line bg-command-surface px-2 py-1 font-mono text-[10px] uppercase text-accent hover:bg-muted">
                      Advance <ChevronRight className="inline h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{l.notes}</p>
              {l.brief && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-sm border border-console-line bg-command-surface p-2 font-mono text-[11px] text-state-stable">{l.brief}</pre>
              )}
              <div className="mt-2 grid gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:grid-cols-2">
                <span>Activity: {act.label}</span>
                <span>Product link: {act.productLink}</span>
                <span>Tiers: {act.revenueTiers.map((t) => `${t.name} ${fmt(t.value)}`).join(" · ")}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Revenue ledger */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-stencil text-sm"><Coins className="h-4 w-4 text-accent" /> Cost / Revenue Ledger</h3>
        <div className="overflow-x-auto rounded-sm border border-console-line">
          <table className="w-full text-xs">
            <thead className="bg-console-sunken font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Task Class</th>
                <th className="px-3 py-2 text-right">Executed</th>
                <th className="px-3 py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {ledger.lines.length === 0 ? (
                <tr><td colSpan={3} className="px-3 py-3 text-center text-muted-foreground">No executed tasks yet — advance the engine to generate cost.</td></tr>
              ) : ledger.lines.map((l) => (
                <tr key={l.taskClass} className="border-t border-console-line">
                  <td className="px-3 py-2 font-mono">{l.taskClass}</td>
                  <td className="px-3 py-2 text-right">{l.executedTasks}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(l.cost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-console-sunken font-mono">
              <tr className="border-t border-console-line">
                <td className="px-3 py-2">Total cost</td>
                <td />
                <td className="px-3 py-2 text-right">{fmt(ledger.totalCost)}</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Won revenue</td>
                <td />
                <td className="px-3 py-2 text-right text-state-stable">{fmt(ledger.wonRevenue)}</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Net</td>
                <td />
                <td className={`px-3 py-2 text-right ${ledger.net >= 0 ? "text-state-stable" : "text-state-danger"}`}>{fmt(ledger.net)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-console-sunken">
          <div className="h-full bg-state-stable" style={{ width: `${Math.min(100, ledger.attainmentPct)}%` }} />
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Attainment {ledger.attainmentPct}% of {fmt(ledger.targetRevenue)} target across all activities
        </p>
      </div>
    </div>
  );
}

const Kpi = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-sm border border-console-line bg-console-sunken p-3">
    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="mt-1 font-stencil text-lg">{value}</div>
  </div>
);
