import { useMemo, useState } from "react";
import { Activity, ShieldAlert, ShieldCheck, Target, Users, FileCheck2, Send, BarChart3 } from "lucide-react";
import type { EventRuntime } from "@/lib/event-engine";
import {
  buildCommandSnapshot,
  DISCLOSURE,
  formatNGN,
  PERSONAS,
  type DisclosureMode,
} from "@/lib/command-center";

const pillTone = (t: string) => {
  const s = t.toLowerCase();
  if (/verified|complete|confirmed|ready|stable/.test(s)) return "bg-state-stableBg text-state-stable border-state-stable/30";
  if (/active|in-progress|dispatched|approved/.test(s)) return "bg-state-infoBg text-state-info border-state-info/30";
  if (/gated|pending|drafted|future/.test(s)) return "bg-state-warningBg text-state-warning border-state-warning/30";
  if (/restricted|nda|blocked|critical/.test(s)) return "bg-state-dangerBg text-state-danger border-state-danger/30";
  return "bg-state-infoBg text-state-info border-state-info/30";
};

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${pillTone(String(children))}`}>
    {children}
  </span>
);

const Bar = ({ pct, tone = "stable" }: { pct: number; tone?: "stable" | "info" | "warning" | "danger" }) => {
  const cls =
    tone === "danger" ? "bg-state-danger" :
    tone === "warning" ? "bg-state-warning" :
    tone === "info" ? "bg-state-info" : "bg-state-stable";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-sm bg-console-sunken">
      <div className={`h-full ${cls} transition-all`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
};

type Props = {
  rt: EventRuntime;
  targetNGN?: number;
  securedNGN?: number;
  cohorts?: string[];
};

export default function CommandCenter({ rt, targetNGN, securedNGN, cohorts }: Props) {
  const [mode, setMode] = useState<DisclosureMode>("NDA_RESTRICTED");
  const snap = useMemo(
    () => buildCommandSnapshot(rt, { targetNGN, securedNGN, cohorts }),
    [rt, targetNGN, securedNGN, cohorts],
  );

  const visibleReports = snap.reports.filter((r) => r.def.disclosure === mode);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-stencil text-sm text-foreground">
            <Activity className="h-4 w-4 text-accent" /> Command Center · Multi-Persona Orchestration
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            CI loop · Ingest → Assign → Plan → Execute → Monitor. Personas activate per directive.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {(["NDA_RESTRICTED", "FULL_DISCLOSURE"] as DisclosureMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                mode === m ? "border-accent bg-accent/15 text-accent" : "border-console-line bg-console-sunken text-muted-foreground hover:bg-muted"
              }`}
            >
              {m === "NDA_RESTRICTED" ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
              {DISCLOSURE[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-sm border border-console-line bg-console-sunken p-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-widest">Funding Gap</span>
            <Target className="h-4 w-4" />
          </div>
          <div className="mt-1 font-stencil text-xl">{formatNGN(snap.funding.gapNGN)}</div>
          <p className="font-mono text-[10px] text-muted-foreground">
            Secured {formatNGN(snap.funding.securedNGN)} / Target {formatNGN(snap.funding.targetNGN)}
          </p>
          <div className="mt-2"><Bar pct={100 - snap.funding.gapPct} tone={snap.funding.gapPct > 50 ? "danger" : snap.funding.gapPct > 25 ? "warning" : "stable"} /></div>
        </div>
        <div className="rounded-sm border border-console-line bg-console-sunken p-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-widest">Sprint Completion</span>
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="mt-1 font-stencil text-xl">{snap.overallSprintCompletion}%</div>
          <p className="font-mono text-[10px] text-muted-foreground">Across S0 → S8</p>
          <div className="mt-2"><Bar pct={snap.overallSprintCompletion} tone="info" /></div>
        </div>
        <div className="rounded-sm border border-console-line bg-console-sunken p-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-widest">Evidence Closed</span>
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div className="mt-1 font-stencil text-xl">
            {snap.evidence.filter((e) => e.status === "verified").length}/{snap.evidence.length}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">EV-001 → EV-012</p>
        </div>
        <div className="rounded-sm border border-console-line bg-console-sunken p-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-widest">Invites Dispatched</span>
            <Send className="h-4 w-4" />
          </div>
          <div className="mt-1 font-stencil text-xl">{snap.invites.length}</div>
          <p className="font-mono text-[10px] text-muted-foreground">INV-001 → INV-{String(snap.invites.length).padStart(3, "0")}</p>
        </div>
      </div>

      {/* Personas */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-stencil text-xs uppercase tracking-wider text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-accent" /> Active Personas
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {snap.personaLoad.map(({ persona, assigned, completed, loadPct }) => (
            <div key={persona.id} className="rounded-sm border border-console-line bg-console-sunken p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{persona.id}</p>
              <p className="mt-0.5 font-stencil text-sm">{persona.codename}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{persona.mandate}</p>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>{completed}/{assigned} tasks</span>
                <span>{loadPct}%</span>
              </div>
              <div className="mt-1"><Bar pct={loadPct} tone="info" /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Sprint timeline */}
      <div>
        <h3 className="mb-2 font-stencil text-xs uppercase tracking-wider text-muted-foreground">Sprint Timeline · S0 → S8</h3>
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-9">
          {snap.sprints.map((s) => (
            <div key={s.sprint.code} className="rounded-sm border border-console-line bg-console-sunken p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-accent">{s.sprint.code}</span>
                <Tag>{s.status}</Tag>
              </div>
              <p className="mt-1 font-stencil text-[12px]">{s.sprint.label}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{s.scheduledAt}</p>
              <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{s.sprint.gate}</p>
              <div className="mt-2"><Bar pct={s.completionPct} tone="stable" /></div>
              <div className="mt-1"><Bar pct={s.evidencePct} tone="info" /></div>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{s.completionPct}% ops · {s.evidencePct}% ev</p>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence + Reports + Invites */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-sm border border-console-line bg-command-surface p-3">
          <h3 className="mb-2 font-stencil text-xs uppercase tracking-wider text-muted-foreground">Evidence Closeouts</h3>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {snap.evidence.map(({ item, closurePct, status }) => (
              <div key={item.code} className="rounded-sm border border-console-line bg-console-sunken p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-accent">{item.code}</span>
                  <Tag>{status}</Tag>
                </div>
                <p className="mt-0.5 text-[12px]">{item.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{item.sprint} · {item.griTag}</p>
                <div className="mt-1"><Bar pct={closurePct} tone={status === "verified" ? "stable" : "info"} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-console-line bg-command-surface p-3">
          <h3 className="mb-2 flex items-center justify-between font-stencil text-xs uppercase tracking-wider text-muted-foreground">
            <span>Auto Reports</span>
            <Tag>{DISCLOSURE[mode].label}</Tag>
          </h3>
          <p className="mb-2 text-[10px] text-muted-foreground">{DISCLOSURE[mode].desc}</p>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {visibleReports.map(({ def, coveragePct, ready }) => (
              <div key={def.code} className="rounded-sm border border-console-line bg-console-sunken p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-accent">{def.code}</span>
                  <Tag>{ready ? "ready" : "pending"}</Tag>
                </div>
                <p className="mt-0.5 text-[12px]">{def.title}</p>
                <p className="font-mono text-[10px] text-muted-foreground">owner · {def.owner}</p>
                <div className="mt-1"><Bar pct={coveragePct} tone="info" /></div>
              </div>
            ))}
            {visibleReports.length === 0 && (
              <p className="font-mono text-[11px] text-muted-foreground">No reports in this disclosure quadrant.</p>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-console-line bg-command-surface p-3">
          <h3 className="mb-2 font-stencil text-xs uppercase tracking-wider text-muted-foreground">Invite Dispatch</h3>
          <div className="max-h-72 space-y-1.5 overflow-auto pr-1">
            {snap.invites.map((i) => (
              <div key={i.code} className="flex items-center justify-between rounded-sm border border-console-line bg-console-sunken px-2 py-1.5">
                <div>
                  <p className="font-mono text-[10px] text-accent">{i.code} · {i.cluster}</p>
                  <p className="text-[12px]">{i.cohort}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Tag>{i.gate}</Tag>
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">{i.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
