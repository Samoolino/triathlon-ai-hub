// Event Engine — instantiates the Master Playbook against an Event Spec
import {
  AGENT_WORKFORCE,
  type AgentSeed,
  type Discipline,
  type DistanceBand,
  type EventState,
  type TaskSeed,
  type TaskState,
  TASK_SEEDS,
} from "./master-playbook";

export type EventSpec = {
  id: string;
  name: string;
  city: string;
  country: string;
  startDate: string;          // ISO date
  disciplines: Discipline[];
  distance: DistanceBand;
  expectedAthletes: number;
  expectedWBGT?: number;       // °C, optional intake
  notes?: string;
  playbookFileName?: string;
  playbookExcerpt?: string;
  createdAt: string;
};

export type LiveAgent = AgentSeed & {
  state: "idle" | "assigned" | "active" | "waiting" | "blocked" | "escalated" | "completed" | "degraded";
  health: "green" | "amber" | "red";
  workload: number;
  completedTaskCount: number;
};

export type LiveTask = {
  id: string;                  // event-scoped, e.g. JABI-ENV-01
  seedCode: string;
  title: string;
  taskClass: TaskSeed["taskClass"];
  priority: number;
  requiredCapabilities: string[];
  assignedAgent?: string;
  state: TaskState;
  taskType: string;
  source: string;
  trigger?: string;
  dependencyTaskIds?: string[];
  cascadeBlockedBy?: string;
  completedAt?: string;
  output?: string;             // synthesized agent output
};

export type EventRuntime = {
  spec: EventSpec;
  state: EventState;
  agents: LiveAgent[];
  tasks: LiveTask[];
  log: { ts: string; msg: string }[];
};

const slug = (s: string) =>
  s.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 8) || "EVT";

function seedApplies(seed: TaskSeed, spec: EventSpec) {
  if (!seed.appliesTo) return true;
  const { disciplines, distances } = seed.appliesTo;
  if (disciplines && !disciplines.some((d) => spec.disciplines.includes(d))) return false;
  if (distances && !distances.includes(spec.distance)) return false;
  return true;
}

// Synthesized agent execution outputs — grounded in the source document
function synthesize(seed: TaskSeed, spec: EventSpec): string {
  const wbgt = spec.expectedWBGT ?? 24.5;
  switch (seed.code) {
    case "ENV-01":
      return `WBGT loop armed @ T-3h. Baseline=${wbgt}°C (Yellow band).`;
    case "ENV-02": {
      const flag =
        wbgt >= 32.2 ? "BLACK · cancel" : wbgt >= 30.1 ? "RED · modify" : wbgt >= 28.1 ? "ORANGE · caution" : wbgt >= 25.7 ? "YELLOW · alert" : "GREEN · normal";
      return `Heat-flag classified ${flag}. Broadcast to LOC + Medical Delegate.`;
    }
    case "MED-01":
      return `${spec.expectedAthletes} entrants — PHE & cardiac screening register cross-checked.`;
    case "MED-02":
      return `Aid stations + AED + ambulance evac route staged per Medical Plan.`;
    case "NUT-01":
      return `Hydration plan: ${Math.round(0.6 * (spec.distance === "long" ? 1500 : 700))} ml/h baseline; +25% if flag ≥ Orange.`;
    case "FOP-04":
      return `Run course re-measured; calibration delta within ±0.05% tolerance.`;
    case "RES-01":
      return `Prize money draft computed — pending official finish & WT delegate sign-off.`;
    case "REG-01":
      return `Registration macro ingested — ${spec.expectedAthletes} rows validated, 0 schema errors.`;
    case "DOP-01":
      return `Random + targeted selection complete; chain-of-custody opened.`;
    case "REP-01":
      return `Awareness snapshot published to command channel.`;
    default:
      return `${seed.taskType} executed per ${seed.source}.`;
  }
}

export function createEventRuntime(spec: EventSpec): EventRuntime {
  const prefix = slug(spec.name);
  const codeToId = new Map<string, string>();

  const tasks: LiveTask[] = TASK_SEEDS.filter((s) => seedApplies(s, spec)).map((seed) => {
    const id = `${prefix}-${seed.code}`;
    codeToId.set(seed.code, id);
    return {
      id,
      seedCode: seed.code,
      title: seed.title,
      taskClass: seed.taskClass,
      priority: seed.priority,
      requiredCapabilities: seed.requiredCapabilities,
      assignedAgent: seed.defaultAgent,
      state: "queued",
      taskType: seed.taskType,
      source: seed.source,
      trigger: seed.trigger,
    };
  });

  // Resolve seed-code dependencies into runtime task ids
  TASK_SEEDS.filter((s) => seedApplies(s, spec)).forEach((seed) => {
    if (!seed.dependsOn) return;
    const target = tasks.find((t) => t.seedCode === seed.code);
    if (!target) return;
    target.dependencyTaskIds = seed.dependsOn
      .map((c) => codeToId.get(c))
      .filter((x): x is string => Boolean(x));
  });

  const agents: LiveAgent[] = AGENT_WORKFORCE.map((a) => ({
    ...a,
    state: a.id === "tarkwa" ? "active" : "idle",
    health: "green",
    workload: a.id === "tarkwa" ? 0.4 : 0.15,
    completedTaskCount: 0,
  }));

  return {
    spec,
    state: "planning",
    agents,
    tasks,
    log: [{ ts: new Date().toISOString(), msg: `Tarkwa initialized event ${spec.name} · ${tasks.length} tasks seeded from master file.` }],
  };
}

// Move all queued/awaiting tasks one step forward (synthesized execution)
export function runEngineStep(rt: EventRuntime): EventRuntime {
  const completedIds = new Set(rt.tasks.filter((t) => t.state === "completed").map((t) => t.id));
  let advanced = 0;
  const next = rt.tasks.map((t) => {
    if (t.state === "completed" || t.state === "failed" || t.state === "cascade-blocked") return t;
    const depsReady = !t.dependencyTaskIds?.length || t.dependencyTaskIds.every((d) => completedIds.has(d));
    if (!depsReady) return { ...t, state: "awaiting" as TaskState };
    advanced++;
    const seed = TASK_SEEDS.find((s) => s.code === t.seedCode)!;
    return {
      ...t,
      state: "completed" as TaskState,
      completedAt: new Date().toISOString(),
      output: synthesize(seed, rt.spec),
    };
  });
  return {
    ...rt,
    tasks: next,
    log: [
      ...rt.log,
      { ts: new Date().toISOString(), msg: `Engine step · ${advanced} task(s) executed by workforce.` },
    ],
  };
}

export function failTaskCascade(rt: EventRuntime, taskId: string): EventRuntime {
  const next = rt.tasks.map((t) => {
    if (t.id === taskId) return { ...t, state: "failed" as TaskState };
    if (t.dependencyTaskIds?.includes(taskId))
      return { ...t, state: "cascade-blocked" as TaskState, cascadeBlockedBy: taskId };
    return t;
  });
  return {
    ...rt,
    tasks: next,
    state: "live-elevated",
    log: [...rt.log, { ts: new Date().toISOString(), msg: `Failure cascade from ${taskId} · guardian intervention engaged.` }],
  };
}

export function awareness(rt: EventRuntime) {
  const blocked = rt.tasks.filter((t) => t.state === "failed" || t.state === "cascade-blocked").length;
  const open = rt.tasks.filter((t) => t.state !== "completed").length;
  const inFlight = rt.tasks.filter((t) => ["executing", "validating", "review", "awaiting"].includes(t.state)).length;
  const completed = rt.tasks.filter((t) => t.state === "completed").length;
  const tarkwaMode =
    rt.state === "live-critical" || blocked > 1
      ? "direct_guardian_intervention"
      : rt.state === "live-elevated" || blocked
        ? "active_supervision"
        : "passive_observation";
  const byClass: Record<string, number> = {};
  rt.tasks.forEach((t) => (byClass[t.taskClass] = (byClass[t.taskClass] || 0) + 1));
  return {
    eventState: rt.state,
    tarkwaMode,
    totals: { agents: rt.agents.length, tasks: rt.tasks.length, openTasks: open, inFlight, completed, blocked },
    classification: byClass,
    completion: rt.tasks.length ? Math.round((completed / rt.tasks.length) * 100) : 0,
    health: blocked ? "amber" : "green",
  };
}
