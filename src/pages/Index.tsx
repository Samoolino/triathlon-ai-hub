import { Activity, AlertTriangle, BrainCircuit, GitBranch, Play, RefreshCcw, ShieldCheck, Trophy, Waves, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

type AgentState = "idle" | "assigned" | "active" | "waiting" | "blocked" | "escalated" | "completed" | "degraded";
type TaskState = "created" | "assigned" | "active" | "completed" | "failed" | "cascade-blocked";
type EventState = "planning" | "pre-live" | "live-normal" | "live-elevated" | "live-critical" | "recovery" | "post-event";

type Agent = {
  id: string;
  name: string;
  role: string;
  cluster: string;
  capabilities: string[];
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
};

const initialAgents: Agent[] = [
  { id: "tarkwa", name: "Tarkwa", role: "Guardian AI-Agent", cluster: "Command", capabilities: ["orchestration", "risk", "routing"], state: "active", health: "green", workload: 0.62, reputationScore: 0.982, reputationTier: "guardian", completedTaskCount: 48 },
  { id: "esg-agent", name: "ESG Sentinel", role: "Compliance Agent", cluster: "Governance", capabilities: ["ESG", "audit", "safety"], state: "active", health: "green", workload: 0.48, reputationScore: 0.914, reputationTier: "trusted", completedTaskCount: 31 },
  { id: "ops-agent", name: "Lake Ops", role: "Execution Agent", cluster: "Operations", capabilities: ["logistics", "access", "coordination"], state: "waiting", health: "amber", workload: 0.77, reputationScore: 0.873, reputationTier: "field-ready", completedTaskCount: 26 },
  { id: "sensor-agent", name: "Venue Sensor Interpreter", role: "Sensor Agent", cluster: "Intelligence", capabilities: ["air", "moisture", "venue-data"], state: "active", health: "green", workload: 0.54, reputationScore: 0.891, reputationTier: "trusted", completedTaskCount: 22 },
  { id: "report-agent", name: "Live Reporting Desk", role: "Reporting Agent", cluster: "Intelligence", capabilities: ["briefing", "public-report", "summaries"], state: "idle", health: "green", workload: 0.22, reputationScore: 0.846, reputationTier: "verified", completedTaskCount: 19 },
];

const initialTasks: Task[] = [
  { id: "T-100", title: "Classify live Jabi Lake venue risk", priority: 0.92, requiredCapabilities: ["risk", "venue-data"], assignedAgent: "tarkwa", state: "active", taskType: "sensing", childTaskIds: ["T-101", "T-102"], validationTaskId: "T-104" },
  { id: "T-101", title: "Validate air and moisture sensor signals", priority: 0.81, requiredCapabilities: ["air", "moisture"], assignedAgent: "sensor-agent", state: "assigned", parentTaskId: "T-100", dependencyTaskIds: ["T-100"], taskType: "validation" },
  { id: "T-102", title: "Coordinate lake access and transition flow", priority: 0.76, requiredCapabilities: ["logistics", "access"], assignedAgent: "ops-agent", state: "active", parentTaskId: "T-100", dependencyTaskIds: ["T-100"], childTaskIds: ["T-103"], taskType: "coordination" },
  { id: "T-103", title: "Prepare ESG incident note for command review", priority: 0.68, requiredCapabilities: ["ESG", "audit"], assignedAgent: "esg-agent", state: "created", parentTaskId: "T-102", dependencyTaskIds: ["T-102"], taskType: "reporting" },
  { id: "T-104", title: "Publish guardian awareness snapshot", priority: 0.57, requiredCapabilities: ["briefing", "summaries"], assignedAgent: "report-agent", state: "created", dependencyTaskIds: ["T-101", "T-103"], taskType: "reporting" },
];

const eventStates: EventState[] = ["planning", "pre-live", "live-normal", "live-elevated", "live-critical", "recovery", "post-event"];

function statusTone(value?: string) {
  const v = String(value || "").toLowerCase();
  if (v.includes("critical") || v.includes("blocked") || v.includes("failed") || v.includes("red") || v.includes("escalated")) return "bg-state-dangerBg text-state-danger border-state-danger/25";
  if (v.includes("elevated") || v.includes("amber") || v.includes("waiting") || v.includes("assigned") || v.includes("recovery")) return "bg-state-warningBg text-state-warning border-state-warning/25";
  if (v.includes("live") || v.includes("active") || v.includes("green") || v.includes("completed")) return "bg-state-stableBg text-state-stable border-state-stable/25";
  return "bg-state-infoBg text-state-info border-state-info/25";
}

const Pill = ({ children, tone }: { children: React.ReactNode; tone?: string }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(tone || String(children))}`}>{children}</span>
);

const Index = () => {
  const [agents, setAgents] = useState(initialAgents);
  const [tasks, setTasks] = useState(initialTasks);
  const [eventState, setEventState] = useState<EventState>("live-normal");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [form, setForm] = useState({ id: "T-105", title: "Route swim-start safety confirmation", priority: "0.8", capabilities: "safety, coordination" });
  const [failTaskId, setFailTaskId] = useState("T-102");
  const [message, setMessage] = useState("Console synced with in-memory Lovable runtime.");

  const awareness = useMemo(() => {
    const blockedTasks = tasks.filter((task) => task.state === "failed" || task.state === "cascade-blocked").length;
    const openTasks = tasks.filter((task) => task.state !== "completed").length;
    const tarkwaMode = eventState === "live-critical" || blockedTasks > 1 ? "direct_guardian_intervention" : eventState === "live-elevated" || blockedTasks ? "active_supervision" : "passive_observation";
    return {
      eventState,
      tarkwaMode,
      totals: { agents: agents.length, openTasks, blockedTasks, cascadeBlockedTasks: tasks.filter((task) => task.state === "cascade-blocked").length },
      health: blockedTasks ? "amber" : "green",
      venueSignals: { air: "stable", lakeMoisture: "elevated-watch", access: "controlled", safety: blockedTasks ? "review" : "clear" },
    };
  }, [agents.length, eventState, tasks]);

  const leaderboard = useMemo(() => [...agents].sort((a, b) => b.reputationScore - a.reputationScore), [agents]);

  const createTask = () => {
    const id = form.id.trim() || `T-${100 + tasks.length}`;
    const nextTask: Task = {
      id,
      title: form.title.trim() || "Untitled workforce task",
      priority: Number(form.priority) || 0.8,
      requiredCapabilities: form.capabilities.split(",").map((item) => item.trim()).filter(Boolean),
      state: "created",
      taskType: "marketplace-work-order",
    };
    setTasks((current) => [nextTask, ...current]);
    setMessage(`Created task ${id} and queued it for Tarkwa routing.`);
  };

  const failTask = () => {
    setTasks((current) => current.map((task) => {
      if (task.id === failTaskId) return { ...task, state: "failed" };
      if (task.dependencyTaskIds?.includes(failTaskId) || task.parentTaskId === failTaskId) return { ...task, state: "cascade-blocked", cascadeBlockedBy: failTaskId };
      return task;
    }));
    setAgents((current) => current.map((agent) => agent.id === "ops-agent" ? { ...agent, state: "blocked", health: "red", workload: 0.91 } : agent.id === "tarkwa" ? { ...agent, state: "escalated", health: "amber" } : agent));
    setMessage(`Triggered failure cascade from ${failTaskId}. Dependent work is blocked for guardian review.`);
  };

  const refreshRuntime = () => {
    setMessage(`Refreshed awareness at ${new Date().toLocaleTimeString()}. Tarkwa mode: ${awareness.tarkwaMode}.`);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-console-grid text-foreground">
      <section className="relative border-b border-console-line bg-console-sunken/70">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan-flow bg-hero-radar motion-reduce:animate-none" />
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 lg:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-console-line bg-command-surface shadow-glow"><Waves className="h-5 w-5 text-accent" /></div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Jabi Lake AI-ESG Triathlon</p>
                <h1 className="text-2xl font-bold tracking-normal md:text-4xl">Tarkwa Workforce Ops Console</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone={eventState}>Event: {eventState}</Pill>
              <Pill tone={awareness.tarkwaMode}>Tarkwa: {awareness.tarkwaMode.split("_").join(" ")}</Pill>
            </div>
          </nav>

          <div className="grid gap-4 md:grid-cols-4">
            {([
              ["Agents", awareness.totals.agents, BrainCircuit],
              ["Open Tasks", awareness.totals.openTasks, Activity],
              ["Blocked Tasks", awareness.totals.blockedTasks, AlertTriangle],
              ["Cascade Blocked", awareness.totals.cascadeBlockedTasks, GitBranch],
            ] as Array<[string, number, LucideIcon]>).map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console transition-transform hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs font-semibold uppercase tracking-wide">{label}</span><Icon className="h-4 w-4" /></div>
                <div className="mt-3 text-3xl font-bold">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-5 lg:grid-cols-12 lg:px-8">
        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Play className="h-4 w-4 text-primary" /> Create Task</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} aria-label="Task id" />
            <input className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Task title" />
            <input className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} aria-label="Task priority" />
            <input className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2" value={form.capabilities} onChange={(e) => setForm({ ...form, capabilities: e.target.value })} aria-label="Required capabilities" />
          </div>
          <button onClick={createTask} className="mt-4 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">Create Task</button>
        </div>

        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="h-4 w-4 text-state-warning" /> Failure Simulation</h2>
          <input className="w-full rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2" value={failTaskId} onChange={(e) => setFailTaskId(e.target.value)} aria-label="Task id to fail" />
          <button onClick={failTask} className="mt-4 rounded-md bg-destructive px-4 py-2 font-semibold text-destructive-foreground transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">Trigger Failure Cascade</button>
        </div>

        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><RefreshCcw className="h-4 w-4 text-accent" /> Quick Actions</h2>
          <div className="grid gap-3">
            <select value={eventState} onChange={(event) => setEventState(event.target.value as EventState)} className="rounded-md border border-input bg-console-sunken px-3 py-2 outline-none ring-ring focus:ring-2">{eventStates.map((state) => <option key={state}>{state}</option>)}</select>
            <button onClick={refreshRuntime} className="rounded-md bg-secondary px-4 py-2 font-semibold text-secondary-foreground transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring">Refresh Awareness</button>
            <button onClick={() => setAutoRefresh((value) => !value)} className="rounded-md border border-console-line bg-console-sunken px-4 py-2 font-semibold transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">Auto Refresh: {autoRefresh ? "ON" : "OFF"}</button>
          </div>
        </div>

        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 text-lg font-semibold">Tarkwa Awareness</h2>
          <pre className="max-h-80 overflow-auto rounded-md border border-console-line bg-console-sunken p-3 text-xs leading-relaxed text-muted-foreground">{JSON.stringify(awareness, null, 2)}</pre>
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Trophy className="h-4 w-4 text-state-warning" /> Agent Score Leaderboard</h2>
          <div className="grid gap-3">{leaderboard.map((agent, index) => (
            <article key={agent.id} className="rounded-lg border border-console-line bg-console-sunken p-3 transition-colors hover:border-console-glow/60">
              <div className="flex items-start justify-between gap-2"><strong>#{index + 1} {agent.name}</strong><Pill tone={agent.health}>{agent.health}</Pill></div>
              <p className="mt-1 text-sm text-muted-foreground">{agent.role} · {agent.cluster}</p>
              <p className="mt-2 text-xs text-muted-foreground">Reputation: {agent.reputationScore.toFixed(3)} · Tier: {agent.reputationTier} · Workload: {Math.round(agent.workload * 100)}%</p>
            </article>
          ))}</div>
        </div>

        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-4 w-4 text-state-stable" /> Tasks</h2>
          <div className="grid max-h-[28rem] gap-3 overflow-auto pr-1">{tasks.map((task) => (
            <article key={task.id} className="rounded-lg border border-console-line bg-console-sunken p-3 transition-colors hover:border-console-glow/60">
              <div className="flex items-start justify-between gap-2"><strong>{task.title}</strong><Pill tone={task.state}>{task.state}</Pill></div>
              <p className="mt-1 text-xs text-muted-foreground">ID: {task.id} · Priority: {task.priority} · Agent: {task.assignedAgent || "unassigned"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Parent: {task.parentTaskId || "-"} · Validation: {task.validationTaskId || "-"}</p>
            </article>
          ))}</div>
        </div>

        <div className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><GitBranch className="h-4 w-4 text-primary" /> Dependency Graph</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{tasks.map((task) => (
            <article key={task.id} className="rounded-lg border border-console-line bg-console-sunken p-4 animate-fade-up">
              <div className="flex items-start justify-between gap-2"><strong>{task.id}</strong><Pill tone={task.state}>{task.state}</Pill></div>
              <p className="mt-2 text-sm text-muted-foreground">Type: {task.taskType}</p>
              <p className="mt-2 text-xs text-muted-foreground">Children: {task.childTaskIds?.join(", ") || "-"}</p>
              <p className="text-xs text-muted-foreground">Dependencies: {task.dependencyTaskIds?.join(", ") || "-"}</p>
              <p className="text-xs text-muted-foreground">Cascade Blocked By: {task.cascadeBlockedBy || "-"}</p>
            </article>
          ))}</div>
        </div>

        <section className="rounded-lg border border-console-line bg-command-surface p-4 shadow-console lg:col-span-12">
          <h2 className="mb-3 text-lg font-semibold">Repo architecture summary</h2>
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <p><strong className="text-foreground">Routes:</strong> original API exposes /agents, /tasks, /tarkwa/awareness, /routing/dependency-graph, /routing/mark-failed, and /state/event-transition.</p>
            <p><strong className="text-foreground">Components:</strong> one static ops dashboard renders KPI cards, task creation, failure simulation, awareness JSON, leaderboard, task list, and graph nodes.</p>
            <p><strong className="text-foreground">Data flow:</strong> agents, tasks, and eventState are runtime state; mutations create tasks, transition event mode, or mark a task failed and cascade-block dependent tasks.</p>
          </div>
        </section>
      </section>
    </main>
  );
};

export default Index;