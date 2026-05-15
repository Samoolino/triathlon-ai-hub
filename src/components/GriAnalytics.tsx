import { useMemo, useState } from "react";
import { Download, FileBarChart2, Layers } from "lucide-react";
import {
  GRI_MODULES,
  GRI_ROUTES,
  buildReport,
  deriveEvidence,
  type GriRoute,
} from "@/lib/gri-framework";
import type { EventRuntime } from "@/lib/event-engine";

const tone = (s: string) => {
  switch (s) {
    case "Verified": return "bg-state-stableBg text-state-stable border-state-stable/30";
    case "Review":   return "bg-state-infoBg text-state-info border-state-info/30";
    case "Active":   return "bg-state-warningBg text-state-warning border-state-warning/30";
    default:         return "border-console-line bg-console-sunken text-muted-foreground";
  }
};

export default function GriAnalytics({ rt }: { rt: EventRuntime }) {
  const [route, setRoute] = useState<GriRoute | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(() => {
    // pre-arm modules whose evidence pipeline already has tasks in this event
    const ev = deriveEvidence(rt);
    return new Set(ev.filter((e) => e.fedTasks.length).map((e) => e.module.id));
  });
  const evidence = useMemo(() => deriveEvidence(rt), [rt]);
  const evidenceById = useMemo(
    () => Object.fromEntries(evidence.map((e) => [e.module.id, e])),
    [evidence],
  );

  const visible = route === "all" ? GRI_MODULES : GRI_MODULES.filter((m) => m.route === route);
  const report = buildReport(rt, selected);

  const toggle = (id: string) =>
    setSelected((cur) => {
      const n = new Set(cur);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const exportReport = () => {
    const lines: string[] = [];
    lines.push(`# GRI / ESRS Disclosure Report — ${rt.spec.name}`);
    lines.push(`Event: ${rt.spec.id} · ${rt.spec.city}, ${rt.spec.country} · ${rt.spec.startDate}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Modules: ${report.evidence.length} · Disclosures: ${report.totalDisc} · Suite completion: ${report.completion}% · Evidence: ${report.evidenceAvg}%`);
    lines.push("");
    report.evidence.forEach((e) => {
      lines.push(`## ${e.module.code} — ${e.module.name} [${e.status} · ${e.evidencePct}%]`);
      lines.push(`Mapping: ${e.module.map}`);
      lines.push(`Evidence tasks: ${e.completedTasks.length}/${e.fedTasks.length}`);
      e.module.disclosures.forEach((d) => lines.push(` - ${d}`));
      if (e.completedTasks.length) {
        lines.push("Source actions:");
        e.completedTasks.forEach((t) => lines.push(`  • [${t.id}] ${t.title} — ${t.output ?? ""}`));
      }
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rt.spec.id}_GRI_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-stencil text-sm">
            <Layers className="h-4 w-4 text-accent" /> GRI Suite · Run-Analytical Utility
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Live disclosure index — modules auto-arm from event execution; toggle to refine the report.
          </p>
        </div>
        <button
          onClick={exportReport}
          className="rounded-sm border border-console-line bg-console-sunken px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground hover:bg-muted"
        >
          <span className="inline-flex items-center gap-1.5"><Download className="h-3 w-3" /> Export .md</span>
        </button>
      </div>

      {/* KPI strip */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Modules selected" value={report.evidence.length} />
        <Stat label="Disclosures active" value={report.totalDisc} />
        <Stat label="Suite completion" value={`${report.completion}%`} />
        <Stat label="Live evidence" value={`${report.evidenceAvg}%`} />
      </div>

      {/* Route tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {GRI_ROUTES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRoute(r.id)}
            className={`rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
              route === r.id
                ? "border-accent bg-accent/15 text-accent"
                : "border-console-line bg-console-sunken text-muted-foreground hover:bg-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Module grid */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((m) => {
          const ev = evidenceById[m.id];
          const on = selected.has(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`rounded-sm border p-2 text-left transition ${
                on ? "border-accent bg-accent/10" : "border-console-line bg-console-sunken hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent">{m.code}</span>
                <span className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] ${tone(ev.status)}`}>
                  {ev.status} · {ev.evidencePct}%
                </span>
              </div>
              <div className="mt-1 text-sm">{m.name}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">{m.map}</div>
              <div className="mt-1 h-1 overflow-hidden rounded-sm bg-console-sunken">
                <div className="h-full bg-state-stable" style={{ width: `${ev.evidencePct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Disclosure index report */}
      <div className="rounded-sm border border-console-line bg-console-sunken p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 font-stencil text-xs">
            <FileBarChart2 className="h-4 w-4 text-accent" /> Report disclosure index
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {report.evidence.length} modules · {report.totalDisc} disclosures · {report.completion}% suite
          </span>
        </div>
        <div className="mb-3 h-1 overflow-hidden rounded-sm bg-background">
          <div className="h-full bg-accent" style={{ width: `${report.completion}%` }} />
        </div>
        {report.evidence.length === 0 ? (
          <p className="py-4 text-center font-mono text-xs text-muted-foreground">
            No modules selected. Pick any card above to populate the live report.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {report.evidence.map((e) => (
              <div key={e.module.id} className="rounded-sm border border-console-line bg-background p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-accent">{e.module.code} · {e.module.name}</span>
                  <span className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] ${tone(e.status)}`}>{e.status}</span>
                </div>
                <ul className="mt-1.5 space-y-0.5">
                  {e.module.disclosures.map((d) => (
                    <li key={d} className="flex gap-2 text-[11px]">
                      <span className="min-w-[60px] font-mono text-accent">{d.split(" ")[0]}</span>
                      <span className="text-foreground/90">{d.replace(/^\S+\s/, "")}</span>
                    </li>
                  ))}
                </ul>
                {e.completedTasks.length > 0 && (
                  <p className="mt-1.5 font-mono text-[10px] text-state-stable">
                    ✓ {e.completedTasks.length} live action{e.completedTasks.length > 1 ? "s" : ""} from workforce
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-sm border border-console-line bg-console-sunken py-2 text-center">
    <div className="font-stencil text-lg">{value}</div>
    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);
