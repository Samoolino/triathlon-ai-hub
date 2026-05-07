import {
  Activity,
  AlertTriangle,
  BookOpen,
  BrainCircuit,
  Droplets,
  FileSpreadsheet,
  GitBranch,
  HeartPulse,
  Play,
  RefreshCcw,
  ShieldCheck,
  Stethoscope,
  ThermometerSun,
  Trophy,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Redefined Task Execution State Machine
// queued      → task accepted by Tarkwa, awaiting capability match
// routing     → Tarkwa scoring agent candidates
// assigned    → bound to an agent, not yet started
// awaiting    → blocked on an external signal (sensor, official, athlete)
// executing   → agent actively performing work
// validating  → output under peer/guardian validation
// review      → under ESG/medical/technical delegate review
// completed   → closed, reputation credited
// failed      → terminal failure, triggers cascade
// cascade-blocked → blocked because an upstream dep failed
// suspended   → manually paused by guardian
// escalated   → handed up to direct guardian intervention
// ─────────────────────────────────────────────────────────────────────────────
type TaskState =
  | "queued"
  | "routing"
  | "assigned"
  | "awaiting"
  | "executing"
  | "validating"
  | "review"
  | "completed"
  | "failed"
  | "cascade-blocked"
  | "suspended"
  | "escalated";

type AgentState = "idle" | "assigned" | "active" | "waiting" | "blocked" | "escalated" | "completed" | "degraded";
type EventState = "planning" | "pre-live" | "live-normal" | "live-elevated" | "live-critical" | "recovery" | "post-event";

type TaskClass =
  | "environmental"
  | "medical"
  | "anti-doping"
  | "nutrition"
  | "course"
  | "registration"
  | "results"
  | "prize-money"
  | "reporting"
  | "governance";

type Agent = {
  id: string;
  name: string;
  role: string;
  cluster: string;
  capabilities: string[];
  sources: string[]; // docs that ground this agent
  state: AgentState;
  health: "green" | "amber" | "red";
  workload: number;
  reputationScore: number;
  reputationTier: string;
  completedTaskCount: number;
};

type Task = {
  id: string;
  title: string;
  taskClass: TaskClass;
  priority: number;
  requiredCapabilities: string[];
  assignedAgent?: string;
  state: TaskState;
  parentTaskId?: string;
  dependencyTaskIds?: string[];
  childTaskIds?: string[];
  validationTaskId?: string;
  cascadeBlockedBy?: string;
  taskType: string;
  source: string; // grounding document
  trigger?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Workforce — expanded to match the document corpus
// ─────────────────────────────────────────────────────────────────────────────
const initialAgents: Agent[] = [
  {
    id: "tarkwa",
    name: "Tarkwa",
    role: "Guardian / Assigner AI",
    cluster: "Command",
    capabilities: ["orchestration", "risk-scoring", "routing", "escalation"],
    sources: ["all"],
    state: "active",
    health: "green",
    workload: 0.66,
    reputationScore: 0.987,
    reputationTier: "guardian",
    completedTaskCount: 142,
  },
  {
    id: "wbgt-agent",
    name: "WBGT Sentinel",
    role: "Environmental Monitoring Agent",
    cluster: "Intelligence",
    capabilities: ["wbgt", "air-temp", "humidity", "water-temp", "wind", "flag-call"],
    sources: ["Weather_Report_Data_Sheet_2020", "WBGT_index_form"],
    state: "active",
    health: "green",
    workload: 0.58,
    reputationScore: 0.931,
    reputationTier: "trusted",
    completedTaskCount: 41,
  },
  {
    id: "medical-agent",
    name: "Medical Delegate",
    role: "Medical Operations Agent",
    cluster: "Health",
    capabilities: ["medical-emergency", "triage", "PHE", "cardiac-screening", "delegate-duties"],
    sources: [
      "guidelines-for-medical-emergencies",
      "periodic-health-evaluation-phe",
      "pre-participation-cardiac-screening",
      "itu-medical-delegate-roles-responsabilities",
    ],
    state: "active",
    health: "green",
    workload: 0.71,
    reputationScore: 0.952,
    reputationTier: "guardian",
    completedTaskCount: 58,
  },
  {
    id: "nutrition-agent",
    name: "Fluid & Nutrition Officer",
    role: "Athlete Performance Agent",
    cluster: "Health",
    capabilities: ["fluid-replacement", "nutrition", "TO-nutrition", "hydration-plan"],
    sources: ["guidelines-for-fluid-replacement", "technical-officials-nutrition-guidelines"],
    state: "active",
    health: "green",
    workload: 0.44,
    reputationScore: 0.889,
    reputationTier: "trusted",
    completedTaskCount: 33,
  },
  {
    id: "doping-agent",
    name: "Anti-Doping Steward",
    role: "Compliance Agent",
    cluster: "Governance",
    capabilities: ["anti-doping", "chain-of-custody", "athlete-selection", "audit"],
    sources: ["medical-and-anti-doping-management"],
    state: "waiting",
    health: "amber",
    workload: 0.39,
    reputationScore: 0.917,
    reputationTier: "trusted",
    completedTaskCount: 24,
  },
  {
    id: "course-agent",
    name: "Run Course Surveyor",
    role: "Technical Agent",
    cluster: "Operations",
    capabilities: ["course-measurement", "calibration", "signage", "transition-flow"],
    sources: ["run-course-measurement-manual"],
    state: "active",
    health: "green",
    workload: 0.62,
    reputationScore: 0.873,
    reputationTier: "field-ready",
    completedTaskCount: 19,
  },
  {
    id: "registration-agent",
    name: "Athlete Registration Bot",
    role: "Operations Agent",
    cluster: "Operations",
    capabilities: ["registration", "form-macro", "data-validation"],
    sources: ["Registration_Form_Macro_NEW_2024"],
    state: "active",
    health: "green",
    workload: 0.51,
    reputationScore: 0.842,
    reputationTier: "verified",
    completedTaskCount: 27,
  },
  {
    id: "results-agent",
    name: "Results & Prize Calculator",
    role: "Reporting Agent",
    cluster: "Intelligence",
    capabilities: ["results", "prize-money-formula", "ranking", "publication"],
    sources: ["worldtriathlon_prize-money-calculation-formula_2022"],
    state: "idle",
    health: "green",
    workload: 0.18,
    reputationScore: 0.866,
    reputationTier: "verified",
    completedTaskCount: 22,
  },
  {
    id: "report-agent",
    name: "Live Reporting Desk",
    role: "Reporting Agent",
    cluster: "Intelligence",
    capabilities: ["briefing", "public-report", "summaries"],
    sources: ["all"],
    state: "idle",
    health: "green",
    workload: 0.22,
    reputationScore: 0.846,
    reputationTier: "verified",
    completedTaskCount: 19,
  },
];

// Tarkwa-classified, Tarkwa-assigned workforce tasks
const initialTasks: Task[] = [
  // ENVIRONMENTAL — WBGT / Weather monitoring loop
  {
    id: "T-200",
    title: "Begin WBGT monitoring 3h pre-start (every 30 min, finish line, 1.5 m, direct sun)",
    taskClass: "environmental",
    priority: 0.95,
    requiredCapabilities: ["wbgt", "air-temp", "humidity"],
    assignedAgent: "wbgt-agent",
    state: "executing",
    taskType: "sensing-loop",
    childTaskIds: ["T-201", "T-202"],
    source: "Weather_Report_Data_Sheet_2020 + WBGT_index_form",
    trigger: "T-3h before start",
  },
  {
    id: "T-201",
    title: "Classify heat-risk flag (Black/Red/Orange/Yellow/Green) and broadcast",
    taskClass: "environmental",
    priority: 0.93,
    requiredCapabilities: ["flag-call", "risk-scoring"],
    assignedAgent: "wbgt-agent",
    state: "validating",
    parentTaskId: "T-200",
    dependencyTaskIds: ["T-200"],
    validationTaskId: "T-203",
    taskType: "classification",
    source: "Weather_Report_Data_Sheet_2020 (risk table)",
  },
  {
    id: "T-202",
    title: "Capture water temperature & wetsuit decision input",
    taskClass: "environmental",
    priority: 0.82,
    requiredCapabilities: ["water-temp"],
    assignedAgent: "wbgt-agent",
    state: "executing",
    parentTaskId: "T-200",
    dependencyTaskIds: ["T-200"],
    taskType: "sensing",
    source: "Weather_Report_Data_Sheet_2020",
  },
  {
    id: "T-203",
    title: "Medical Delegate co-sign of heat flag & competition continue/cancel call",
    taskClass: "medical",
    priority: 0.96,
    requiredCapabilities: ["delegate-duties", "medical-emergency"],
    assignedAgent: "medical-agent",
    state: "review",
    dependencyTaskIds: ["T-201"],
    taskType: "review",
    source: "itu-medical-delegate-roles-responsabilities",
  },

  // MEDICAL — emergencies, PHE, cardiac
  {
    id: "T-210",
    title: "Verify PHE & pre-participation cardiac screening completion for all entrants",
    taskClass: "medical",
    priority: 0.88,
    requiredCapabilities: ["PHE", "cardiac-screening"],
    assignedAgent: "medical-agent",
    state: "executing",
    taskType: "compliance-check",
    source: "periodic-health-evaluation-phe + pre-participation-cardiac-screening",
  },
  {
    id: "T-211",
    title: "Stage medical emergency response (aid stations, AED, evac route)",
    taskClass: "medical",
    priority: 0.94,
    requiredCapabilities: ["medical-emergency", "triage"],
    assignedAgent: "medical-agent",
    state: "assigned",
    dependencyTaskIds: ["T-210"],
    taskType: "deployment",
    source: "guidelines-for-medical-emergencies",
  },

  // NUTRITION / FLUIDS
  {
    id: "T-220",
    title: "Compute athlete fluid replacement plan vs WBGT band",
    taskClass: "nutrition",
    priority: 0.78,
    requiredCapabilities: ["fluid-replacement", "hydration-plan"],
    assignedAgent: "nutrition-agent",
    state: "awaiting",
    dependencyTaskIds: ["T-201"],
    taskType: "computation",
    source: "guidelines-for-fluid-replacement",
    trigger: "awaiting confirmed flag",
  },
  {
    id: "T-221",
    title: "Brief Technical Officials on nutrition handling at aid stations",
    taskClass: "nutrition",
    priority: 0.6,
    requiredCapabilities: ["TO-nutrition"],
    assignedAgent: "nutrition-agent",
    state: "queued",
    taskType: "briefing",
    source: "technical-officials-nutrition-guidelines",
  },

  // ANTI-DOPING
  {
    id: "T-230",
    title: "Select athletes for in-competition testing & open chain-of-custody",
    taskClass: "anti-doping",
    priority: 0.84,
    requiredCapabilities: ["anti-doping", "chain-of-custody"],
    assignedAgent: "doping-agent",
    state: "routing",
    taskType: "selection",
    source: "medical-and-anti-doping-management",
  },

  // COURSE
  {
    id: "T-240",
    title: "Re-measure run course per WT manual (calibrated wheel, certified path)",
    taskClass: "course",
    priority: 0.86,
    requiredCapabilities: ["course-measurement", "calibration"],
    assignedAgent: "course-agent",
    state: "executing",
    taskType: "measurement",
    source: "run-course-measurement-manual",
  },

  // REGISTRATION
  {
    id: "T-250",
    title: "Ingest 2024 Registration Form macro submissions & validate fields",
    taskClass: "registration",
    priority: 0.7,
    requiredCapabilities: ["registration", "form-macro", "data-validation"],
    assignedAgent: "registration-agent",
    state: "executing",
    childTaskIds: ["T-210"],
    taskType: "ingest",
    source: "Registration_Form_Macro_NEW_2024",
  },

  // RESULTS / PRIZE MONEY
  {
    id: "T-260",
    title: "Compute prize money split (Top 5 / 10 / 15) from official results",
    taskClass: "prize-money",
    priority: 0.55,
    requiredCapabilities: ["prize-money-formula", "results"],
    assignedAgent: "results-agent",
    state: "queued",
    dependencyTaskIds: ["T-203", "T-240"],
    taskType: "calculation",
    source: "worldtriathlon_prize-money-calculation-formula_2022",
    trigger: "post-finish",
  },

  // REPORTING / GUARDIAN
  {
    id: "T-270",
    title: "Publish Tarkwa guardian awareness snapshot to command channel",
    taskClass: "reporting",
    priority: 0.6,
    requiredCapabilities: ["briefing", "summaries"],
    assignedAgent: "report-agent",
    state: "queued",
    dependencyTaskIds: ["T-203", "T-211", "T-220"],
    taskType: "reporting",
    source: "all",
  },
];

const eventStates: EventState[] = ["planning", "pre-live", "live-normal", "live-elevated", "live-critical", "recovery", "post-event"];

const taskClassMeta: Record<TaskClass, { label: string; icon: LucideIcon }> = {
  environmental: { label: "Environmental", icon: ThermometerSun },
  medical: { label: "Medical", icon: Stethoscope },
  "anti-doping": { label: "Anti-Doping", icon: ShieldCheck },
  nutrition: { label: "Nutrition", icon: Droplets },
  course: { label: "Course", icon: GitBranch },
  registration: { label: "Registration", icon: FileSpreadsheet },
  results: { label: "Results", icon: Trophy },
  "prize-money": { label: "Prize Money", icon: Trophy },
  reporting: { label: "Reporting", icon: BookOpen },
  governance: { label: "Governance", icon: ShieldCheck },
};

function statusTone(value?: string) {
  const v = String(value || "").toLowerCase();
  if (v.includes("critical") || v.includes("blocked") || v.includes("failed") || v.includes("red") || v.includes("escalated")) return "bg-state-dangerBg text-state-danger border-state-danger/25";
  if (v.includes("elevated") || v.includes("amber") || v.includes("waiting") || v.includes("await") || v.includes("assigned") || v.includes("recovery") || v.includes("review") || v.includes("validating") || v.includes("routing") || v.includes("suspended")) return "bg-state-warningBg text-state-warning border-state-warning/25";
  if (v.includes("live") || v.includes("active") || v.includes("executing") || v.includes("green") || v.includes("completed")) return "bg-state-stableBg text-state-stable border-state-stable/25";
  return "bg-state-infoBg text-state-info border-state-info/25";
}

const Pill = ({ children, tone }: { children: React.ReactNode; tone?: string }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(tone || String(children))}`}>{children}</span>
);

const docCorpus = [
  { id: "wbgt", name: "Weather Report Data Sheet 2020 + WBGT Index Form", kind: "uploaded" },
  { id: "prize", name: "Prize Money Calculation Formula 2022", kind: "uploaded" },
  { id: "reg", name: "Registration Form Macro NEW 2024", kind: "uploaded" },
  { id: "nutrition-to", name: "Technical Officials Nutrition Guidelines", kind: "cms" },
  { id: "course", name: "Run Course Measurement Manual", kind: "cms" },
  { id: "med-emerg", name: "Guidelines for Medical Emergencies", kind: "cms" },
  { id: "fluid", name: "Guidelines for Fluid Replacement", kind: "cms" },
  { id: "phe", name: "Periodic Health Evaluation (PHE) for Triathletes", kind: "cms" },
  { id: "cardiac", name: "Pre-participation Cardiac Screening in Athletes", kind: "cms" },
  { id: "doping", name: "Medical & Anti-Doping Management at WT Events", kind: "cms" },
  { id: "delegate", name: "ITU Medical Delegate Roles & Responsibilities", kind: "cms" },
];

const Index = () => {
  const [agents, setAgents] = useState(initialAgents);
  const [tasks, setTasks] = useState(initialTasks);
  const [eventState, setEventState] = useState<EventState>("live-normal");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [form, setForm] = useState({
    id: "T-280",
    title: "Re-evaluate flag if WBGT crosses 30.1°C threshold",
    taskClass: "environmental" as TaskClass,
    priority: "0.9",
    capabilities: "wbgt, flag-call",
  });
  const [failTaskId, setFailTaskId] = useState("T-201");
  const [message, setMessage] = useState("Tarkwa initialized. 11 source documents grounded; 8 agents online.");
  const [classFilter, setClassFilter] = useState<TaskClass | "all">("all");

  const awareness = useMemo(() => {
    const blocked = tasks.filter((t) => t.state === "failed" || t.state === "cascade-blocked").length;
    const open = tasks.filter((t) => t.state !== "completed").length;
    const inFlight = tasks.filter((t) => ["executing", "validating", "review"].includes(t.state)).length;
    const tarkwaMode =
      eventState === "live-critical" || blocked > 1
        ? "direct_guardian_intervention"
        : eventState === "live-elevated" || blocked
          ? "active_supervision"
          : "passive_observation";
    const byClass: Record<string, number> = {};
    tasks.forEach((t) => {
      byClass[t.taskClass] = (byClass[t.taskClass] || 0) + 1;
    });
    return {
      eventState,
      tarkwaMode,
      totals: {
        agents: agents.length,
        openTasks: open,
        inFlight,
        blocked,
        cascadeBlocked: tasks.filter((t) => t.state === "cascade-blocked").length,
      },
      classification: byClass,
      health: blocked ? "amber" : "green",
      groundedSources: docCorpus.length,
    };
  }, [agents.length, eventState, tasks]);

  const leaderboard = useMemo(() => [...agents].sort((a, b) => b.reputationScore - a.reputationScore), [agents]);
  const visibleTasks = useMemo(
    () => (classFilter === "all" ? tasks : tasks.filter((t) => t.taskClass === classFilter)),
    [tasks, classFilter],
  );

  const createTask = () => {
    const id = form.id.trim() || `T-${200 + tasks.length}`;
    const next: Task = {
      id,
      title: form.title.trim() || "Untitled workforce task",
      taskClass: form.taskClass,
      priority: Number(form.priority) || 0.7,
      requiredCapabilities: form.capabilities.split(",").map((s) => s.trim()).filter(Boolean),
      state: "queued",
      taskType: "tarkwa-assigned",
      source: "operator-injected",
    };
    setTasks((cur) => [next, ...cur]);
    setMessage(`Tarkwa queued ${id} (class: ${form.taskClass}) for routing.`);
  };

  const failTask = () => {
    setTasks((cur) =>
      cur.map((t) => {
        if (t.id === failTaskId) return { ...t, state: "failed" };
        if (t.dependencyTaskIds?.includes(failTaskId) || t.parentTaskId === failTaskId)
          return { ...t, state: "cascade-blocked", cascadeBlockedBy: failTaskId };
        return t;
      }),
    );
    setAgents((cur) =>
      cur.map((a) =>
        a.id === "medical-agent"
          ? { ...a, state: "blocked", health: "red", workload: 0.93 }
          : a.id === "tarkwa"
            ? { ...a, state: "escalated", health: "amber" }
            : a,
      ),
    );
    setMessage(`Tarkwa: failure cascade from ${failTaskId} → guardian intervention engaged.`);
  };

  const refreshRuntime = () => setMessage(`Awareness refreshed at ${new Date().toLocaleTimeString()} · mode ${awareness.tarkwaMode}.`);

  return (
    <main className="min-h-screen overflow-hidden bg-console-grid text-foreground">
      <section className="relative border-b border-console-line bg-console-sunken/70">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan-flow bg-hero-radar motion-reduce:animate-none" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 lg:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-console-line bg-command-surface shadow-glow">
                <Waves className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Jabi Lake AI-ESG Triathlon · Workforce Marketplace</p>
                <h1 className="text-2xl font-bold tracking-normal md:text-4xl">Tarkwa Workforce Ops Console</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone={eventState}>Event: {eventState}</Pill>
              <Pill tone={awareness.tarkwaMode}>Tarkwa: {awareness.tarkwaMode.split("_").join(" ")}</Pill>
              <Pill tone="info">Sources grounded: {awareness.groundedSources}</Pill>
            </div>
          </nav>

          <div className="grid gap-4 md:grid-cols-5">
            {(
              [
                ["Agents", awareness.totals.agents, BrainCircuit],
                ["Open", awareness.totals.openTasks, Activity],
                ["In-Flight", awareness.totals.inFlight, HeartPulse],
                ["Blocked", awareness.totals.blocked, AlertTriangle],
                ["Cascade", awareness.totals.cascadeBlocked, GitBranch],
              ] as Array<[string, number, LucideIcon]>
            ).map(([label, value, Icon]) => (
              <div
                key={String(label)}
                className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-3xl font-bold">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-5 lg:grid-cols-12 lg:px-8">
        {/* Tarkwa task creator */}
        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Play className="h-4 w-4 text-primary" /> Tarkwa · Assign Task
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              aria-label="Task id"
            />
            <select
              className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2"
              value={form.taskClass}
              onChange={(e) => setForm({ ...form, taskClass: e.target.value as TaskClass })}
              aria-label="Task class"
            >
              {Object.entries(taskClassMeta).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2 sm:col-span-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              aria-label="Task title"
            />
            <input
              className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              aria-label="Priority"
            />
            <input
              className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2"
              value={form.capabilities}
              onChange={(e) => setForm({ ...form, capabilities: e.target.value })}
              aria-label="Capabilities"
            />
          </div>
          <button
            onClick={createTask}
            className="mt-4 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Assign via Tarkwa
          </button>
        </div>

        {/* Failure sim */}
        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-4 w-4 text-state-warning" /> Failure Simulation
          </h2>
          <input
            className="w-full rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2"
            value={failTaskId}
            onChange={(e) => setFailTaskId(e.target.value)}
            aria-label="Task id to fail"
          />
          <button
            onClick={failTask}
            className="mt-4 rounded-md bg-destructive px-4 py-2 font-semibold text-destructive-foreground transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Trigger Failure Cascade
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Cascading failure re-routes dependents to <strong>cascade-blocked</strong> and escalates Tarkwa.
          </p>
        </div>

        {/* Quick actions */}
        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <RefreshCcw className="h-4 w-4 text-accent" /> Event Mode
          </h2>
          <div className="grid gap-3">
            <select
              value={eventState}
              onChange={(e) => setEventState(e.target.value as EventState)}
              className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2"
            >
              {eventStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={refreshRuntime}
              className="rounded-md bg-secondary px-4 py-2 font-semibold text-secondary-foreground transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Refresh Awareness
            </button>
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className="rounded-md border border-console-line bg-console-sunken px-4 py-2 font-semibold transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Auto Refresh: {autoRefresh ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Awareness */}
        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 text-lg font-semibold">Tarkwa Awareness</h2>
          <pre className="max-h-80 overflow-auto rounded-md border border-console-line bg-console-sunken p-3 text-xs leading-relaxed text-muted-foreground">
            {JSON.stringify(awareness, null, 2)}
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Leaderboard */}
        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-4 w-4 text-state-warning" /> Agent Reputation
          </h2>
          <div className="grid max-h-[28rem] gap-3 overflow-auto pr-1">
            {leaderboard.map((a, i) => (
              <article key={a.id} className="rounded-lg border border-console-line bg-console-sunken p-3 transition-colors hover:border-console-glow/60">
                <div className="flex items-start justify-between gap-2">
                  <strong>
                    #{i + 1} {a.name}
                  </strong>
                  <Pill tone={a.health}>{a.health}</Pill>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.role} · {a.cluster}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Rep {a.reputationScore.toFixed(3)} · {a.reputationTier} · Load {Math.round(a.workload * 100)}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Caps: {a.capabilities.join(", ")}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Document corpus */}
        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-4 w-4 text-accent" /> Grounding Corpus
          </h2>
          <div className="grid max-h-[28rem] gap-2 overflow-auto pr-1">
            {docCorpus.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-2 rounded-md border border-console-line bg-console-sunken p-2 text-xs">
                <span className="text-muted-foreground">{d.name}</span>
                <Pill tone={d.kind === "uploaded" ? "info" : "active"}>{d.kind}</Pill>
              </div>
            ))}
            <p className="mt-2 text-xs text-muted-foreground">
              Note: Google Drive source <code>11xmwXxG…</code> is restricted to the <code>triathlon.org</code> workspace and could not be ingested anonymously. Share publicly or upload to grant Tarkwa access.
            </p>
          </div>
        </div>

        {/* Tasks (with class filter) */}
        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-4 w-4 text-state-stable" /> Workforce Tasks · Tarkwa-classified
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setClassFilter("all")}
                className={`rounded-full border px-3 py-1 text-xs ${classFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-console-line bg-console-sunken text-muted-foreground hover:bg-muted"}`}
              >
                all
              </button>
              {Object.entries(taskClassMeta).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setClassFilter(k as TaskClass)}
                  className={`rounded-full border px-3 py-1 text-xs ${classFilter === k ? "border-primary bg-primary/10 text-primary" : "border-console-line bg-console-sunken text-muted-foreground hover:bg-muted"}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleTasks.map((t) => {
              const Icon = taskClassMeta[t.taskClass].icon;
              return (
                <article key={t.id} className="rounded-lg border border-console-line bg-console-sunken p-3 animate-fade-up transition-colors hover:border-console-glow/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" />
                      <strong className="text-sm">{t.id}</strong>
                    </div>
                    <Pill tone={t.state}>{t.state}</Pill>
                  </div>
                  <p className="mt-2 text-sm">{t.title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Class: <strong className="text-foreground">{taskClassMeta[t.taskClass].label}</strong> · Type: {t.taskType} · Priority {t.priority}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Agent: {t.assignedAgent || "unassigned"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Caps: {t.requiredCapabilities.join(", ")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Deps: {t.dependencyTaskIds?.join(", ") || "—"} · Children: {t.childTaskIds?.join(", ") || "—"}
                  </p>
                  {t.cascadeBlockedBy && (
                    <p className="mt-1 text-xs text-state-danger">Cascade-blocked by {t.cascadeBlockedBy}</p>
                  )}
                  <p className="mt-2 border-t border-console-line pt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Source · {t.source}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        {/* Execution state legend */}
        <section className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-12">
          <h2 className="mb-3 text-lg font-semibold">Redefined Task Execution States</h2>
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {[
              ["queued", "Accepted by Tarkwa, awaiting capability match"],
              ["routing", "Tarkwa scoring agent candidates"],
              ["assigned", "Bound to an agent, not yet started"],
              ["awaiting", "Blocked on external signal (sensor/official/athlete)"],
              ["executing", "Agent actively performing work"],
              ["validating", "Output under peer/guardian validation"],
              ["review", "Under ESG / Medical / Technical Delegate review"],
              ["completed", "Closed; reputation credited"],
              ["failed", "Terminal failure → triggers cascade"],
              ["cascade-blocked", "Blocked by upstream dependency failure"],
              ["suspended", "Manually paused by guardian"],
              ["escalated", "Direct guardian intervention engaged"],
            ].map(([state, desc]) => (
              <div key={state} className="flex items-start gap-2 rounded-md border border-console-line bg-console-sunken p-2">
                <Pill tone={state}>{state}</Pill>
                <span className="flex-1">{desc}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default Index;
