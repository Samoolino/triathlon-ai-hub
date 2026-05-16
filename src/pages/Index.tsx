import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Crosshair,
  FileUp,
  GitBranch,
  HeartPulse,
  Play,
  Plus,
  Radio,
  RefreshCcw,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  awareness,
  createEventRuntime,
  failTaskCascade,
  runEngineStep,
  type EventRuntime,
  type EventSpec,
} from "@/lib/event-engine";
import {
  DOC_CORPUS,
  MASTER_SECTIONS,
  TASK_SEEDS,
  type Discipline,
  type DistanceBand,
} from "@/lib/master-playbook";
import GriAnalytics from "@/components/GriAnalytics";
import GriProductMatrix from "@/components/GriProductMatrix";
import BusinessDevelopment from "@/components/BusinessDevelopment";

// ─── Helpers ────────────────────────────────────────────────────────────────
const tone = (v?: string) => {
  const s = String(v || "").toLowerCase();
  if (s.match(/critical|blocked|failed|red|escalated|destroy/)) return "bg-state-dangerBg text-state-danger border-state-danger/30";
  if (s.match(/elevated|amber|await|assigned|recovery|review|validating|routing|suspended|warning/)) return "bg-state-warningBg text-state-warning border-state-warning/30";
  if (s.match(/live|active|executing|green|completed|stable/)) return "bg-state-stableBg text-state-stable border-state-stable/30";
  return "bg-state-infoBg text-state-info border-state-info/30";
};

const Pill = ({ children, t }: { children: React.ReactNode; t?: string }) => (
  <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider ${tone(t || String(children))}`}>
    {children}
  </span>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`tac-frame rounded-sm border border-console-line bg-command-surface p-4 shadow-console ${className}`}>
    {children}
  </section>
);

const SectionHeader = ({ icon: Icon, label, desc }: { icon: LucideIcon; label: string; desc?: string }) => (
  <div className="mb-4">
    <h2 className="flex items-center gap-2 text-sm font-stencil text-foreground">
      <Icon className="h-4 w-4 text-accent" /> {label}
    </h2>
    {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
  </div>
);

const inputCls =
  "w-full rounded-sm border border-input bg-console-sunken px-3 py-2 text-sm font-mono outline-none ring-ring focus:ring-2";

const btnPrimary =
  "rounded-sm bg-primary px-4 py-2 text-sm font-stencil text-primary-foreground transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring";
const btnSecondary =
  "rounded-sm border border-console-line bg-console-sunken px-4 py-2 text-sm font-stencil text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring";
const btnDanger =
  "rounded-sm bg-destructive px-4 py-2 text-sm font-stencil text-destructive-foreground transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring";

const DISCIPLINES: Discipline[] = [
  "triathlon", "duathlon", "aquathlon", "aquabike", "cross-tri", "winter-tri", "paratri", "mixed-relay",
];
const DISTANCES: DistanceBand[] = ["super-sprint", "sprint", "standard", "middle", "long"];

// ─── Demo seed event so the console isn't empty ─────────────────────────────
const demoEvent: EventSpec = {
  id: "EVT-JABI",
  name: "Jabi Lake AI-ESG Triathlon",
  city: "Abuja",
  country: "Nigeria",
  startDate: "2026-06-13",
  disciplines: ["triathlon", "paratri"],
  distance: "sprint",
  expectedAthletes: 320,
  expectedWBGT: 28.4,
  notes: "Inaugural AI-ESG flagship. Tarkwa serving as guardian assigner.",
  createdAt: new Date().toISOString(),
};

const Index = () => {
  const [events, setEvents] = useState<Record<string, EventRuntime>>(() => {
    const rt = createEventRuntime(demoEvent);
    return { [demoEvent.id]: rt };
  });
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [view, setView] = useState<"roster" | "intake" | "ops">("roster");

  // Intake form
  const [draft, setDraft] = useState({
    name: "",
    city: "",
    country: "",
    startDate: new Date().toISOString().slice(0, 10),
    disciplines: ["triathlon"] as Discipline[],
    distance: "sprint" as DistanceBand,
    expectedAthletes: "200",
    expectedWBGT: "26",
    notes: "",
    playbookFileName: "",
    playbookExcerpt: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const activeRt = activeEventId ? events[activeEventId] : null;

  const submitIntake = () => {
    const id = `EVT-${Date.now().toString(36).toUpperCase()}`;
    const spec: EventSpec = {
      id,
      name: draft.name.trim() || "Untitled Event",
      city: draft.city.trim() || "—",
      country: draft.country.trim() || "—",
      startDate: draft.startDate,
      disciplines: draft.disciplines,
      distance: draft.distance,
      expectedAthletes: Number(draft.expectedAthletes) || 0,
      expectedWBGT: Number(draft.expectedWBGT) || undefined,
      notes: draft.notes,
      playbookFileName: draft.playbookFileName || undefined,
      playbookExcerpt: draft.playbookExcerpt || undefined,
      createdAt: new Date().toISOString(),
    };
    const rt = createEventRuntime(spec);
    setEvents((cur) => ({ ...cur, [id]: rt }));
    setActiveEventId(id);
    setView("ops");
    setDraft({
      name: "", city: "", country: "",
      startDate: new Date().toISOString().slice(0, 10),
      disciplines: ["triathlon"], distance: "sprint",
      expectedAthletes: "200", expectedWBGT: "26",
      notes: "", playbookFileName: "", playbookExcerpt: "",
    });
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text().catch(() => "");
    setDraft((d) => ({
      ...d,
      playbookFileName: file.name,
      playbookExcerpt: text.slice(0, 600),
    }));
  };

  const advance = () => {
    if (!activeRt) return;
    setEvents((cur) => ({ ...cur, [activeRt.spec.id]: runEngineStep(cur[activeRt.spec.id]) }));
  };
  const failCascade = (taskId: string) => {
    if (!activeRt) return;
    setEvents((cur) => ({ ...cur, [activeRt.spec.id]: failTaskCascade(cur[activeRt.spec.id], taskId) }));
  };

  // ─── HEADER ──────────────────────────────────────────────────────────────
  const header = (
    <section className="relative border-b border-console-line bg-console-sunken/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan-flow bg-hero-radar motion-reduce:animate-none" />
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-sm border border-accent/40 bg-command-surface shadow-glow">
            <Crosshair className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Tarkwa · Triathlon AI Workforce</p>
            <h1 className="text-xl md:text-2xl font-stencil text-foreground">Workforce Operations Command</h1>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <button
            onClick={() => { setView("roster"); setActiveEventId(null); }}
            className={view === "roster" ? btnPrimary : btnSecondary}
          >
            Mission Roster
          </button>
          <button onClick={() => { setView("intake"); setActiveEventId(null); }} className={view === "intake" ? btnPrimary : btnSecondary}>
            <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Initiate Event</span>
          </button>
        </nav>
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-console-grid text-foreground">
      {header}
      {view === "roster" && (
        <RosterView
          events={Object.values(events)}
          onOpen={(id) => { setActiveEventId(id); setView("ops"); }}
          onNew={() => setView("intake")}
        />
      )}
      {view === "intake" && (
        <IntakeView
          draft={draft}
          setDraft={setDraft}
          onFile={onFile}
          fileRef={fileRef}
          submit={submitIntake}
        />
      )}
      {view === "ops" && activeRt && (
        <OpsView
          rt={activeRt}
          onBack={() => { setView("roster"); setActiveEventId(null); }}
          onAdvance={advance}
          onFail={failCascade}
        />
      )}
    </main>
  );
};

// ─── ROSTER ────────────────────────────────────────────────────────────────
function RosterView({ events, onOpen, onNew }: { events: EventRuntime[]; onOpen: (id: string) => void; onNew: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="font-stencil text-lg">Active Missions</h2>
          <p className="text-xs text-muted-foreground">Each event is an isolated workforce theatre. Tarkwa orchestrates all of them in parallel.</p>
        </div>
        <button onClick={onNew} className={btnPrimary}><span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Initiate New Event</span></button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((rt) => {
          const a = awareness(rt);
          return (
            <article key={rt.spec.id} className="tac-frame group cursor-pointer rounded-sm border border-console-line bg-command-surface p-4 shadow-console transition hover:border-accent/60" onClick={() => onOpen(rt.spec.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">OP · {rt.spec.id}</p>
                  <h3 className="font-stencil text-base">{rt.spec.name}</h3>
                  <p className="text-xs text-muted-foreground">{rt.spec.city}, {rt.spec.country} · {rt.spec.startDate}</p>
                </div>
                <Pill t={rt.state}>{rt.state}</Pill>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Tasks" value={a.totals.tasks} />
                <Stat label="Done" value={a.totals.completed} />
                <Stat label="Blocked" value={a.totals.blocked} />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-sm bg-console-sunken">
                <div className="h-full bg-state-stable transition-all" style={{ width: `${a.completion}%` }} />
              </div>
              <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{a.completion}% executed · {a.tarkwaMode.replace(/_/g, " ")}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-10">
        <SectionHeader icon={BookOpen} label="Master File · Event Organiser's Manual" desc="ITU/World Triathlon EOM (2019) sections functionally encoded as task seeds." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MASTER_SECTIONS.map((s) => {
            const seedCount = TASK_SEEDS.filter((t) => t.source.includes(s.code) || t.source.toLowerCase().includes(s.id)).length;
            return (
              <Card key={s.id}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{s.code} · {s.manualRef}</p>
                <h3 className="mt-1 font-stencil text-sm">{s.label}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{seedCount || "Linked"} task seeds bound to this section.</p>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <SectionHeader icon={ShieldCheck} label="Grounding Corpus" desc="Documents Tarkwa cites in every routing decision." />
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {DOC_CORPUS.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-xs">
              <span className="font-mono text-muted-foreground">{d.name}</span>
              <Pill t={d.kind === "master" ? "active" : d.kind === "uploaded" ? "info" : "stable"}>{d.kind}</Pill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-sm border border-console-line bg-console-sunken py-2">
    <div className="font-stencil text-lg">{value}</div>
    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

// ─── INTAKE ────────────────────────────────────────────────────────────────
function IntakeView({
  draft, setDraft, onFile, fileRef, submit,
}: {
  draft: any; setDraft: any; onFile: (f: File | null) => void; fileRef: React.RefObject<HTMLInputElement>; submit: () => void;
}) {
  const toggleDisc = (d: Discipline) => {
    setDraft((cur: any) => ({
      ...cur,
      disciplines: cur.disciplines.includes(d) ? cur.disciplines.filter((x: Discipline) => x !== d) : [...cur.disciplines, d],
    }));
  };
  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8">
      <SectionHeader icon={ClipboardList} label="Event Intake · Briefing Packet" desc="Provide event basics or upload an event playbook/brochure. Tarkwa generates the workforce task plan from the master file." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Event Name">
              <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Lagos World Cup" />
            </Field>
            <Field label="Start Date">
              <input type="date" className={inputCls} value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
            </Field>
            <Field label="City">
              <input className={inputCls} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
            </Field>
            <Field label="Country">
              <input className={inputCls} value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
            </Field>
            <Field label="Distance Band">
              <select className={inputCls} value={draft.distance} onChange={(e) => setDraft({ ...draft, distance: e.target.value })}>
                {DISTANCES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Expected Athletes">
              <input className={inputCls} type="number" value={draft.expectedAthletes} onChange={(e) => setDraft({ ...draft, expectedAthletes: e.target.value })} />
            </Field>
            <Field label="Expected WBGT (°C)">
              <input className={inputCls} type="number" step="0.1" value={draft.expectedWBGT} onChange={(e) => setDraft({ ...draft, expectedWBGT: e.target.value })} />
            </Field>
            <Field label="Disciplines">
              <div className="flex flex-wrap gap-1.5">
                {DISCIPLINES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDisc(d)}
                    className={`rounded-sm border px-2 py-1 text-[11px] font-mono uppercase tracking-wider ${draft.disciplines.includes(d) ? "border-accent bg-accent/15 text-accent" : "border-console-line bg-console-sunken text-muted-foreground hover:bg-muted"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Operational Notes">
              <textarea rows={3} className={inputCls} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Hot weather profile, paratri considerations, sponsor protocol …" />
            </Field>
          </div>
        </Card>

        <Card>
          <SectionHeader icon={FileUp} label="Event Playbook / Brochure" desc="Optional. Plain text is parsed for context; PDF/DOCX is registered as an artifact." />
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} accept=".txt,.md,.csv,.pdf,.docx" />
          <button className={btnSecondary} onClick={() => fileRef.current?.click()}>
            <span className="inline-flex items-center gap-2"><FileUp className="h-4 w-4" /> Upload File</span>
          </button>
          {draft.playbookFileName && (
            <div className="mt-3 rounded-sm border border-console-line bg-console-sunken p-2 font-mono text-[11px]">
              <p className="text-accent">📎 {draft.playbookFileName}</p>
              {draft.playbookExcerpt && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-muted-foreground">{draft.playbookExcerpt}</pre>}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={submit} className={btnPrimary}>
          <span className="inline-flex items-center gap-2"><Play className="h-4 w-4" /> Hand Off to Tarkwa</span>
        </button>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    {children}
  </label>
);

// ─── OPS WORKSPACE ─────────────────────────────────────────────────────────
function OpsView({ rt, onBack, onAdvance, onFail }: { rt: EventRuntime; onBack: () => void; onAdvance: () => void; onFail: (id: string) => void }) {
  const a = awareness(rt);
  const [filter, setFilter] = useState<string>("all");

  const visible = useMemo(
    () => (filter === "all" ? rt.tasks : rt.tasks.filter((t) => t.taskClass === filter)),
    [rt.tasks, filter],
  );
  const completed = rt.tasks.filter((t) => t.state === "completed");
  const classes = Array.from(new Set(rt.tasks.map((t) => t.taskClass)));

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
      {/* Op header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className={btnSecondary}><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">OP · {rt.spec.id}</p>
            <h2 className="font-stencil text-xl">{rt.spec.name}</h2>
            <p className="text-xs text-muted-foreground">{rt.spec.city}, {rt.spec.country} · {rt.spec.startDate} · {rt.spec.distance} · {rt.spec.disciplines.join(", ")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill t={rt.state}>State: {rt.state}</Pill>
          <Pill t={a.tarkwaMode}>Tarkwa: {a.tarkwaMode.replace(/_/g, " ")}</Pill>
          <button onClick={onAdvance} className={btnPrimary}><span className="inline-flex items-center gap-2"><RefreshCcw className="h-4 w-4" /> Advance Engine</span></button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        {([
          ["Agents", a.totals.agents, BrainCircuit],
          ["Tasks", a.totals.tasks, Activity],
          ["In-flight", a.totals.inFlight, HeartPulse],
          ["Completed", a.totals.completed, CheckCircle2],
          ["Blocked", a.totals.blocked, AlertTriangle],
        ] as Array<[string, number, LucideIcon]>).map(([l, v, I]) => (
          <Card key={l}>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-widest">{l}</span>
              <I className="h-4 w-4" />
            </div>
            <div className="mt-2 font-stencil text-2xl">{v}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Output / processed flow column */}
        <Card className="lg:col-span-7">
          <SectionHeader icon={CheckCircle2} label="Executed Procedure Flow" desc="Personalized output for this event — every completed agent action with grounded source." />
          {completed.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">No procedures executed yet. Press <span className="text-accent">Advance Engine</span> to run a workforce step.</p>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-accent/40 pl-4">
              {completed.map((t) => (
                <li key={t.id} className="rounded-sm border border-console-line bg-console-sunken p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-accent">{t.id}</span>
                    <Pill t="completed">completed</Pill>
                  </div>
                  <p className="mt-1 text-sm">{t.title}</p>
                  {t.output && <p className="mt-1 font-mono text-xs text-state-stable">▸ {t.output}</p>}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t.source}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Awareness + workforce */}
        <div className="space-y-4 lg:col-span-5">
          <Card>
            <SectionHeader icon={Radio} label="Tarkwa Awareness" />
            <pre className="max-h-64 overflow-auto rounded-sm border border-console-line bg-console-sunken p-3 text-[11px] leading-relaxed text-muted-foreground">
{JSON.stringify(a, null, 2)}
            </pre>
          </Card>
          <Card>
            <SectionHeader icon={BrainCircuit} label="Workforce on Theatre" />
            <div className="grid max-h-[18rem] gap-2 overflow-auto pr-1">
              {rt.agents.map((ag) => (
                <div key={ag.id} className="rounded-sm border border-console-line bg-console-sunken p-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm">{ag.name}</strong>
                    <Pill t={ag.health}>{ag.health}</Pill>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{ag.role} · {ag.cluster}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">Rep {ag.reputationScore.toFixed(3)} · {ag.reputationTier}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Task board with filters */}
        <Card className="lg:col-span-12">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SectionHeader icon={ShieldCheck} label="Task Board · Tarkwa-classified" />
            <div className="flex flex-wrap gap-1.5">
              <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>all</FilterBtn>
              {classes.map((c) => (
                <FilterBtn key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</FilterBtn>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((t) => (
              <article key={t.id} className="rounded-sm border border-console-line bg-console-sunken p-3 animate-fade-up">
                <div className="flex items-center justify-between">
                  <strong className="font-mono text-xs text-accent">{t.id}</strong>
                  <Pill t={t.state}>{t.state}</Pill>
                </div>
                <p className="mt-1 text-sm">{t.title}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t.taskClass} · {t.taskType} · prio {t.priority}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">Agent: {t.assignedAgent || "—"}</p>
                {t.dependencyTaskIds?.length ? (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">Deps: {t.dependencyTaskIds.join(", ")}</p>
                ) : null}
                {t.cascadeBlockedBy && <p className="mt-1 font-mono text-[11px] text-state-danger">⚠ cascade-blocked by {t.cascadeBlockedBy}</p>}
                <div className="mt-2 flex items-center justify-between border-t border-console-line pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t.source}</span>
                  {t.state !== "completed" && t.state !== "failed" && (
                    <button onClick={() => onFail(t.id)} className="font-mono text-[10px] uppercase text-state-danger hover:underline">Fail</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-12">
          <BusinessDevelopment rt={rt} />
        </Card>

        <Card className="lg:col-span-12">
          <GriAnalytics rt={rt} />
        </Card>

        <Card className="lg:col-span-12">
          <GriProductMatrix />
        </Card>

        <Card className="lg:col-span-12">
          <SectionHeader icon={BookOpen} label="Engine Log" />
          <div className="max-h-48 space-y-1 overflow-auto font-mono text-[11px] text-muted-foreground">
            {rt.log.slice().reverse().map((l, i) => (
              <div key={i}>[{l.ts.slice(11, 19)}] {l.msg}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const FilterBtn = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${active ? "border-accent bg-accent/15 text-accent" : "border-console-line bg-console-sunken text-muted-foreground hover:bg-muted"}`}
  >
    {children}
  </button>
);

export default Index;
