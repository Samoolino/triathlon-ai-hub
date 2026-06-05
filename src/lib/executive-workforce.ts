// Executive Workforce — implements the Agentic Workforce Platform Directive
// Lead Guardian + specialized sub-agents, mission lifecycle, embedded wallet
// + x402 payment simulation, comm streams. Sits on top of event-engine without
// replacing it — Tarkwa = Lead Guardian; sub-agents map to existing personas.

import type { EventRuntime, LiveAgent } from "./event-engine";

export type MissionStage = "passive" | "initiation" | "active" | "closeout";

export type DeptId =
  | "guardian"
  | "business-dev"
  | "innovation"
  | "esg-compliance"
  | "operations"
  | "finance";

export type ExecAgent = {
  id: DeptId;
  codename: string;          // department codename
  role: string;
  readiness: number;         // 0..1, drives passive-state badge
  mandate: string;
  ownsTaskClasses: string[]; // for live mapping
  ownsGriModules?: string[];
  orbitDeg: number;          // visual position around guardian
};

export const EXECUTIVE_WORKFORCE: ExecAgent[] = [
  {
    id: "guardian",
    codename: "Lead Guardian",
    role: "Chief Coordinator · Mission Controller · QA",
    readiness: 1,
    mandate: "Analyse mandate, activate sub-agents, allocate tasks, supervise QA and governance.",
    ownsTaskClasses: ["governance", "reporting"],
    orbitDeg: 0,
  },
  {
    id: "business-dev",
    codename: "BD Accomplice",
    role: "Business Development Partner",
    readiness: 0.92,
    mandate: "Lead research, viability validation, sponsorship engagement, revenue accel.",
    ownsTaskClasses: ["prize-money", "governance"],
    ownsGriModules: ["GRI-201", "GRI-204"],
    orbitDeg: 36,
  },
  {
    id: "innovation",
    codename: "Innovation Strategist",
    role: "Tokenization & Monetization",
    readiness: 0.88,
    mandate: "Design x402 micro-billing, tokenization, autonomous workforce monetization.",
    ownsTaskClasses: ["communications", "reporting"],
    orbitDeg: 108,
  },
  {
    id: "esg-compliance",
    codename: "ESG Controller",
    role: "Sustainability & Compliance Officer",
    readiness: 0.94,
    mandate: "GRI disclosure pipeline, anti-doping integrity, environmental stewardship.",
    ownsTaskClasses: ["environmental", "anti-doping"],
    ownsGriModules: ["GRI-303", "GRI-305", "GRI-306"],
    orbitDeg: 180,
  },
  {
    id: "operations",
    codename: "Ops Orchestrator",
    role: "Field Operations & Athlete Safety",
    readiness: 0.9,
    mandate: "FOP execution, medical, nutrition, hot-weather protocols, registration.",
    ownsTaskClasses: ["fop", "medical", "nutrition", "registration", "services"],
    orbitDeg: 252,
  },
  {
    id: "finance",
    codename: "Finance Custodian",
    role: "Wallet · Treasury · x402 Settlement",
    readiness: 0.96,
    mandate: "Custody embedded wallet, govern x402 payments, daily budget enforcement.",
    ownsTaskClasses: ["prize-money"],
    orbitDeg: 324,
  },
];

// ── Mission naming convention ────────────────────────────────────────────────
const ALPHA = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet"];
export function missionCodename(eventId: string): string {
  const idx = Math.abs(hash(eventId)) % ALPHA.length;
  return `Mission ${ALPHA[idx]}`;
}
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

export function missionAgentName(eventId: string, a: ExecAgent): string {
  return `${missionCodename(eventId)} – ${a.codename}`;
}

// ── Mission lifecycle derivation ─────────────────────────────────────────────
export function deriveStage(rt: EventRuntime | null): MissionStage {
  if (!rt) return "passive";
  const total = rt.tasks.length;
  if (!total) return "initiation";
  const done = rt.tasks.filter((t) => t.state === "completed").length;
  const pct = done / total;
  if (pct === 0) return "initiation";
  if (pct >= 1) return "closeout";
  return "active";
}

// ── Embedded wallet + x402 (SIMULATED, no real chain calls) ──────────────────
export type WalletTx = {
  id: string;
  ts: string;
  endpoint: string;
  asset: string;          // e.g. USDC
  amount: number;         // USDC
  status: "settled" | "pending" | "rejected" | "approval-required";
  agent: DeptId;
  note?: string;
};

export type WalletState = {
  address: string;        // 0x… (mock)
  network: "base-mainnet";
  balanceUSDC: number;
  dailyCapUSDC: number;
  spentTodayUSDC: number;
  highValueThreshold: number;   // 0.50 default
  consecutive402: number;
  history: WalletTx[];
};

export function createWallet(seed: string): WalletState {
  return {
    address: `0x${Math.abs(hash(seed)).toString(16).padStart(8, "0")}…cdp`,
    network: "base-mainnet",
    balanceUSDC: 25,
    dailyCapUSDC: 5,
    spentTodayUSDC: 0,
    highValueThreshold: 0.5,
    consecutive402: 0,
    history: [],
  };
}

export type PaymentRequest = {
  endpoint: string;
  priceUSDC: number;
  asset: string;
  agent: DeptId;
  note?: string;
};

// Mirrors the directive lifecycle:
// 1 send → 2 detect 402 → 3 read spec → 4 analyse → 5 pay → 6 retry
export function executeX402(
  w: WalletState,
  req: PaymentRequest,
  humanApproved = false,
): { wallet: WalletState; outcome: WalletTx } {
  const ts = new Date().toISOString();
  const id = `TX-${ts.slice(11, 19).replace(/:/g, "")}`;
  const base = { id, ts, endpoint: req.endpoint, asset: req.asset, amount: req.priceUSDC, agent: req.agent };
  if (w.consecutive402 >= 2) {
    const tx: WalletTx = { ...base, status: "rejected", note: "abort: 2 consecutive 402s" };
    return { wallet: { ...w, history: [tx, ...w.history], consecutive402: 0 }, outcome: tx };
  }
  if (w.spentTodayUSDC + req.priceUSDC > w.dailyCapUSDC) {
    const tx: WalletTx = { ...base, status: "rejected", note: "daily cap exceeded" };
    return { wallet: { ...w, history: [tx, ...w.history] }, outcome: tx };
  }
  if (req.priceUSDC > w.highValueThreshold && !humanApproved) {
    const tx: WalletTx = { ...base, status: "approval-required", note: `>${w.highValueThreshold} USDC` };
    return { wallet: { ...w, history: [tx, ...w.history] }, outcome: tx };
  }
  const tx: WalletTx = { ...base, status: "settled", note: req.note };
  return {
    wallet: {
      ...w,
      balanceUSDC: w.balanceUSDC - req.priceUSDC,
      spentTodayUSDC: w.spentTodayUSDC + req.priceUSDC,
      consecutive402: 0,
      history: [tx, ...w.history],
    },
    outcome: tx,
  };
}

// ── Comm stream — synthesizes inter-agent messages from runtime activity ─────
export type CommMsg = { id: string; ts: string; from: DeptId; to: DeptId | "broadcast"; text: string; kind: "directive" | "report" | "alert" | "settle" };

export function deriveComms(rt: EventRuntime | null, eventId: string): CommMsg[] {
  if (!rt) return [];
  const code = missionCodename(eventId);
  const msgs: CommMsg[] = [];
  // From recent completed tasks → dept reports up to guardian
  rt.tasks
    .filter((t) => t.state === "completed")
    .slice(-6)
    .reverse()
    .forEach((t, i) => {
      const dept = mapClassToDept(t.taskClass);
      msgs.push({
        id: `M-${i}`,
        ts: t.completedAt || new Date().toISOString(),
        from: dept,
        to: "guardian",
        text: `${code} · ${t.id} closed → ${t.output?.slice(0, 80) || t.title}`,
        kind: "report",
      });
    });
  // Blocked → alert
  rt.tasks
    .filter((t) => t.state === "cascade-blocked" || t.state === "failed")
    .slice(-3)
    .forEach((t, i) => {
      msgs.unshift({
        id: `A-${i}`,
        ts: new Date().toISOString(),
        from: mapClassToDept(t.taskClass),
        to: "guardian",
        text: `ALERT · ${t.id} ${t.state}${t.cascadeBlockedBy ? ` (by ${t.cascadeBlockedBy})` : ""}`,
        kind: "alert",
      });
    });
  // Guardian directive broadcast
  msgs.unshift({
    id: "G-0",
    ts: new Date().toISOString(),
    from: "guardian",
    to: "broadcast",
    text: `${code} · maintain passive observation; escalate above amber.`,
    kind: "directive",
  });
  return msgs;
}

export function mapClassToDept(cls: string): DeptId {
  for (const a of EXECUTIVE_WORKFORCE) {
    if (a.ownsTaskClasses.includes(cls)) return a.id;
  }
  return "operations";
}

// ── Department workspace metrics ─────────────────────────────────────────────
export type DeptMetrics = {
  dept: DeptId;
  ownedTasks: number;
  completed: number;
  inFlight: number;
  blocked: number;
  completionPct: number;
  health: "green" | "amber" | "red";
};

export function deptMetrics(rt: EventRuntime | null): DeptMetrics[] {
  return EXECUTIVE_WORKFORCE.map((a) => {
    const owned = (rt?.tasks || []).filter((t) => a.ownsTaskClasses.includes(t.taskClass));
    const completed = owned.filter((t) => t.state === "completed").length;
    const inFlight = owned.filter((t) => ["executing", "validating", "review", "awaiting"].includes(t.state)).length;
    const blocked = owned.filter((t) => t.state === "failed" || t.state === "cascade-blocked").length;
    const pct = owned.length ? Math.round((completed / owned.length) * 100) : 0;
    const health: DeptMetrics["health"] = blocked > 1 ? "red" : blocked || pct < 25 ? "amber" : "green";
    return { dept: a.id, ownedTasks: owned.length, completed, inFlight, blocked, completionPct: pct, health };
  });
}

export function relatedAgents(rt: EventRuntime | null, dept: DeptId): LiveAgent[] {
  if (!rt) return [];
  const exec = EXECUTIVE_WORKFORCE.find((a) => a.id === dept);
  if (!exec) return [];
  // Map by cluster keyword in live agent role/cluster fields
  return rt.agents.filter((ag) =>
    exec.ownsTaskClasses.some((c) =>
      ag.role.toLowerCase().includes(c) || ag.cluster.toLowerCase().includes(c),
    ),
  );
}
