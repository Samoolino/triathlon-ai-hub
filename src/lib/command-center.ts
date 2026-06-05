// ─────────────────────────────────────────────────────────────────────────────
// COMMAND CENTER — Multi-Persona Orchestration Layer
// Event-agnostic upgrade derived from the Command Center system prompt.
// Provides: Personas, Sprint Timeline, Evidence Closeouts, Invite Dispatch,
// Auto Reports, Disclosure Quadrants, and the CI Execution Loop.
// All structures are parameterised so ANY initiated event can drive them.
// ─────────────────────────────────────────────────────────────────────────────
import type { EventRuntime } from "./event-engine";
import type { TaskClass } from "./master-playbook";

// ── Personas ────────────────────────────────────────────────────────────────
export type PersonaId = "bd-strategist" | "comms-liaison" | "ops-orchestrator" | "esg-controller";

export type Persona = {
  id: PersonaId;
  codename: string;
  mandate: string;
  scope: string;
  ownsClasses: TaskClass[];
  ownsRptIds: string[];
};

export const PERSONAS: Persona[] = [
  {
    id: "bd-strategist",
    codename: "BD & Innovation Strategist",
    mandate: "Maximise corporate value, develop high-yield instruments, govern the capital quadrant.",
    scope: "Corporate sponsor matrix, SAFE/Series funding, ROI evaluation, sponsor fulfilment.",
    ownsClasses: ["governance", "prize-money", "reporting"],
    ownsRptIds: ["RPT-005", "RPT-006", "RPT-007"],
  },
  {
    id: "comms-liaison",
    codename: "Active Comms & Stakeholder Liaison",
    mandate: "Drive participation and targeted stakeholder engagement across configured cohorts.",
    scope: "Invite dispatch, stage-gate tracking, agency response cadence, confirmed team matrices.",
    ownsClasses: ["communications", "services"],
    ownsRptIds: ["RPT-002", "RPT-003"],
  },
  {
    id: "ops-orchestrator",
    codename: "Ops & Command Center Orchestrator",
    mandate: "Absolute control over the sprint timeline, vendor and logistics integrity.",
    scope: "Sprint cadence, evidence closeout, vendor contracts, payment schedules, GRI-205 compliance.",
    ownsClasses: ["course", "venue", "registration", "results", "contingency"],
    ownsRptIds: ["RPT-001", "RPT-004"],
  },
  {
    id: "esg-controller",
    codename: "Operational Intelligence & ESG Controller",
    mandate: "Real-time analytics, API integrations, strict enforcement of the reporting base.",
    scope: "Framework map, auto reporting, holistic quantitative + qualitative impact reports.",
    ownsClasses: ["environmental", "medical", "anti-doping", "nutrition"],
    ownsRptIds: ["RPT-008"],
  },
];

// ── Disclosure Quadrants ────────────────────────────────────────────────────
export type DisclosureMode = "NDA_RESTRICTED" | "FULL_DISCLOSURE";

export const DISCLOSURE = {
  NDA_RESTRICTED: {
    label: "NDA · Restricted Command",
    desc: "Internal-only: SAFE mechanics, vendor markups, risk registers, backend pricing triggers.",
  },
  FULL_DISCLOSURE: {
    label: "Full Disclosure · Public",
    desc: "Verified external reporting: ESG transparency, approved releases, sponsor value outputs.",
  },
} as const;

// ── Sprint Timeline (S0..S8) ────────────────────────────────────────────────
export type SprintDef = {
  code: string;          // S0..S8
  label: string;
  offsetDays: number;    // relative to event startDate (negative = before)
  focus: string;
  gate: string;
};

export const SPRINTS: SprintDef[] = [
  { code: "S0", label: "Mobilisation",      offsetDays: -180, focus: "Charter, LOC, master playbook ingest", gate: "Charter Signed" },
  { code: "S1", label: "Capital Quadrant",  offsetDays: -150, focus: "Budget model, sponsor matrix, SAFE",   gate: "Funding Plan Locked" },
  { code: "S2", label: "Dispatch Ready",    offsetDays: -120, focus: "Invite drafts, approval, dispatch",    gate: "Gate 1 · Dispatch Ready" },
  { code: "S3", label: "Participation",     offsetDays:  -90, focus: "Cohort confirmations, team matrices",  gate: "Gate 2 · Participation Ready" },
  { code: "S4", label: "Venue & FOP",       offsetDays:  -60, focus: "Permits, course measurement, FOP",     gate: "Venue Permission Letters" },
  { code: "S5", label: "Vendor & Logistics",offsetDays:  -45, focus: "Procurement, contracts, payments",     gate: "Vendor Sign-off" },
  { code: "S6", label: "Pre-Live",          offsetDays:  -14, focus: "Briefings, WBGT loop, dry-runs",       gate: "Operational Readiness" },
  { code: "S7", label: "Race Execution",    offsetDays:    0, focus: "Live ops, medical, anti-doping",       gate: "Race Day Closeout" },
  { code: "S8", label: "Closeout & Report", offsetDays:   30, focus: "ESG transparency, sponsor fulfilment", gate: "30-Day Public Report" },
];

export type SprintStatus = {
  sprint: SprintDef;
  scheduledAt: string;
  windowState: "future" | "active" | "past";
  completionPct: number;
  evidencePct: number;
  status: "pending" | "in-progress" | "gated" | "complete";
};

// ── Evidence Closeouts (EV-001..EV-012) ─────────────────────────────────────
export type EvidenceItem = {
  code: string;            // EV-001
  label: string;
  feedingClasses: TaskClass[];
  griTag: string;
  sprint: string;          // S-code
};

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  { code: "EV-001", label: "Charter & LOC Org Chart",         feedingClasses: ["governance"],     griTag: "GRI 2-9",   sprint: "S0" },
  { code: "EV-002", label: "Budget Model & Funding Letter",   feedingClasses: ["governance"],     griTag: "GRI 201-1", sprint: "S1" },
  { code: "EV-003", label: "Sponsor Fulfilment Schedule",     feedingClasses: ["reporting"],      griTag: "GRI 201-1", sprint: "S1" },
  { code: "EV-004", label: "Approved Invite Dispatch Log",    feedingClasses: ["communications"], griTag: "GRI 2-29",  sprint: "S2" },
  { code: "EV-005", label: "Confirmed Cohort Matrix",         feedingClasses: ["services"],       griTag: "GRI 413-1", sprint: "S3" },
  { code: "EV-006", label: "Venue Permission Letters",        feedingClasses: ["venue"],          griTag: "GRI 413-1", sprint: "S4" },
  { code: "EV-007", label: "Water Quality / Course Reports",  feedingClasses: ["course","environmental"], griTag: "GRI 303-2", sprint: "S4" },
  { code: "EV-008", label: "Vendor Contracts & Payments",     feedingClasses: ["governance"],     griTag: "GRI 205-2", sprint: "S5" },
  { code: "EV-009", label: "WBGT & Heat Flag Logs",           feedingClasses: ["environmental"],  griTag: "GRI 305-7", sprint: "S6" },
  { code: "EV-010", label: "Medical & Anti-Doping Closeout",  feedingClasses: ["medical","anti-doping"], griTag: "GRI 403-9", sprint: "S7" },
  { code: "EV-011", label: "Results & Prize Disbursement",    feedingClasses: ["results","prize-money"], griTag: "GRI 201-1", sprint: "S7" },
  { code: "EV-012", label: "30-Day ESG Transparency Report",  feedingClasses: ["reporting"],      griTag: "GRI 2-3",   sprint: "S8" },
];

// ── Invite Dispatch (INV-001..INV-017) ──────────────────────────────────────
export type InviteRecord = {
  code: string;            // INV-001
  cohort: string;
  channel: "letter" | "email" | "secure-portal";
  gate: "drafted" | "approved" | "dispatched" | "confirmed";
  cluster: "high-readiness" | "wellness-rehab" | "civic" | "corporate" | "media";
};

// Generic, configurable cohort seeds — events override via EventSpec.cohorts
export const DEFAULT_INVITE_COHORTS: { cohort: string; cluster: InviteRecord["cluster"] }[] = [
  { cohort: "Federal Sport Ministry",          cluster: "civic" },
  { cohort: "City Sport Commission",           cluster: "civic" },
  { cohort: "Olympic Committee Liaison",       cluster: "civic" },
  { cohort: "National Triathlon Federation",   cluster: "civic" },
  { cohort: "Defence Command A",               cluster: "high-readiness" },
  { cohort: "Defence Command B",               cluster: "high-readiness" },
  { cohort: "Defence Command C",               cluster: "high-readiness" },
  { cohort: "Civil Protection Agency",         cluster: "high-readiness" },
  { cohort: "Public Safety Service",           cluster: "wellness-rehab" },
  { cohort: "Counter-Narcotics Agency",        cluster: "wellness-rehab" },
  { cohort: "Correctional Service",            cluster: "wellness-rehab" },
  { cohort: "Health Service Wellness",         cluster: "wellness-rehab" },
  { cohort: "Platinum Corporate Sponsor",      cluster: "corporate" },
  { cohort: "ESG Partner Consortium",          cluster: "corporate" },
  { cohort: "Innovation/Tech Sponsor",         cluster: "corporate" },
  { cohort: "National Broadcast Network",      cluster: "media" },
  { cohort: "International Press Pool",        cluster: "media" },
];

export function generateInvites(spec: { cohorts?: string[] }): InviteRecord[] {
  const base = spec.cohorts && spec.cohorts.length
    ? spec.cohorts.map((c) => ({ cohort: c, cluster: "civic" as const }))
    : DEFAULT_INVITE_COHORTS;
  return base.slice(0, 17).map((c, i) => ({
    code: `INV-${String(i + 1).padStart(3, "0")}`,
    cohort: c.cohort,
    channel: c.cluster === "high-readiness" ? "letter" : c.cluster === "corporate" ? "secure-portal" : "email",
    gate: "drafted",
    cluster: c.cluster,
  }));
}

// ── Auto Reports (RPT-001..RPT-008) ─────────────────────────────────────────
export type ReportDef = {
  code: string;            // RPT-001
  title: string;
  owner: PersonaId;
  disclosure: DisclosureMode;
  feeds: TaskClass[];
};

export const REPORTS: ReportDef[] = [
  { code: "RPT-001", title: "Sprint Status & Variance",        owner: "ops-orchestrator", disclosure: "NDA_RESTRICTED", feeds: ["governance"] },
  { code: "RPT-002", title: "Invite Dispatch Log",             owner: "comms-liaison",    disclosure: "NDA_RESTRICTED", feeds: ["communications"] },
  { code: "RPT-003", title: "Cohort Participation Matrix",     owner: "comms-liaison",    disclosure: "FULL_DISCLOSURE", feeds: ["services"] },
  { code: "RPT-004", title: "Vendor & Payments Ledger",        owner: "ops-orchestrator", disclosure: "NDA_RESTRICTED", feeds: ["governance"] },
  { code: "RPT-005", title: "Funding Gap & Capital Stack",     owner: "bd-strategist",    disclosure: "NDA_RESTRICTED", feeds: ["governance"] },
  { code: "RPT-006", title: "Sponsor Value Output",            owner: "bd-strategist",    disclosure: "FULL_DISCLOSURE", feeds: ["reporting"] },
  { code: "RPT-007", title: "Sponsor Fulfilment Report",       owner: "bd-strategist",    disclosure: "FULL_DISCLOSURE", feeds: ["reporting"] },
  { code: "RPT-008", title: "ESG Transparency (30-Day)",       owner: "esg-controller",   disclosure: "FULL_DISCLOSURE", feeds: ["environmental","medical","anti-doping","nutrition"] },
];

// ── CI Loop derivations ─────────────────────────────────────────────────────
export type CommandSnapshot = {
  sprints: SprintStatus[];
  evidence: { item: EvidenceItem; closurePct: number; status: "pending" | "active" | "verified" }[];
  invites: InviteRecord[];
  reports: { def: ReportDef; coveragePct: number; ready: boolean }[];
  funding: { targetNGN: number; securedNGN: number; gapNGN: number; gapPct: number };
  overallSprintCompletion: number;
  personaLoad: { persona: Persona; assigned: number; completed: number; loadPct: number }[];
};

const dayMs = 86_400_000;

function deriveSprintStatus(rt: EventRuntime): SprintStatus[] {
  const start = new Date(rt.spec.startDate).getTime();
  const now = Date.now();
  // Distribute tasks across sprints by class affinity for completion signal.
  const classToSprint: Record<TaskClass, string> = {
    governance: "S1", "prize-money": "S7", reporting: "S8",
    communications: "S2", services: "S3",
    course: "S4", venue: "S4", registration: "S3", results: "S7", contingency: "S6",
    environmental: "S6", medical: "S7", "anti-doping": "S7", nutrition: "S6",
  };
  return SPRINTS.map((s) => {
    const scheduled = start + s.offsetDays * dayMs;
    const tasksInSprint = rt.tasks.filter((t) => classToSprint[t.taskClass] === s.code);
    const done = tasksInSprint.filter((t) => t.state === "completed").length;
    const completionPct = tasksInSprint.length ? Math.round((done / tasksInSprint.length) * 100) : 0;
    const evidenceInSprint = EVIDENCE_ITEMS.filter((e) => e.sprint === s.code);
    const evidenceFulfilled = evidenceInSprint.filter((e) => {
      const feed = rt.tasks.filter((t) => e.feedingClasses.includes(t.taskClass));
      return feed.length > 0 && feed.every((t) => t.state === "completed");
    }).length;
    const evidencePct = evidenceInSprint.length ? Math.round((evidenceFulfilled / evidenceInSprint.length) * 100) : 100;
    const windowState: SprintStatus["windowState"] = scheduled > now ? "future" : Math.abs(now - scheduled) < 7 * dayMs ? "active" : "past";
    const status: SprintStatus["status"] = completionPct === 100 && evidencePct === 100 ? "complete" :
      completionPct > 0 ? "in-progress" : evidencePct < 100 && windowState === "past" ? "gated" : "pending";
    return {
      sprint: s,
      scheduledAt: new Date(scheduled).toISOString().slice(0, 10),
      windowState,
      completionPct,
      evidencePct,
      status,
    };
  });
}

export function buildCommandSnapshot(
  rt: EventRuntime,
  opts: { targetNGN?: number; securedNGN?: number; cohorts?: string[] } = {},
): CommandSnapshot {
  const sprints = deriveSprintStatus(rt);
  const evidence = EVIDENCE_ITEMS.map((item) => {
    const feed = rt.tasks.filter((t) => item.feedingClasses.includes(t.taskClass));
    const done = feed.filter((t) => t.state === "completed").length;
    const closurePct = feed.length ? Math.round((done / feed.length) * 100) : 0;
    const status: "pending" | "active" | "verified" =
      closurePct === 100 ? "verified" : closurePct > 0 ? "active" : "pending";
    return { item, closurePct, status };
  });
  const invites = generateInvites({ cohorts: opts.cohorts });
  const reports = REPORTS.map((def) => {
    const feed = rt.tasks.filter((t) => def.feeds.includes(t.taskClass));
    const done = feed.filter((t) => t.state === "completed").length;
    const coveragePct = feed.length ? Math.round((done / feed.length) * 100) : 0;
    return { def, coveragePct, ready: coveragePct >= 60 };
  });
  const targetNGN = opts.targetNGN ?? 239_000_000;
  const securedNGN = opts.securedNGN ?? Math.round(targetNGN * (sprints[1]?.completionPct ?? 0) / 100);
  const gapNGN = Math.max(targetNGN - securedNGN, 0);
  const gapPct = Math.round((gapNGN / targetNGN) * 100);
  const overallSprintCompletion = Math.round(
    sprints.reduce((acc, s) => acc + s.completionPct, 0) / sprints.length,
  );
  const personaLoad = PERSONAS.map((p) => {
    const assigned = rt.tasks.filter((t) => p.ownsClasses.includes(t.taskClass));
    const completed = assigned.filter((t) => t.state === "completed").length;
    const loadPct = assigned.length ? Math.round((completed / assigned.length) * 100) : 0;
    return { persona: p, assigned: assigned.length, completed, loadPct };
  });
  return { sprints, evidence, invites, reports, funding: { targetNGN, securedNGN, gapNGN, gapPct }, overallSprintCompletion, personaLoad };
}

export function formatNGN(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n}`;
}
