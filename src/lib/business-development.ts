// Business Development & Corporate Sponsorship engine
// Couples workforce execution + GRI evidence to commercial pipeline,
// viability scoring, and per-event cost/revenue ledger.

import type { EventRuntime } from "./event-engine";
import type { TaskClass } from "./master-playbook";
import { deriveEvidence } from "./gri-framework";

export type LeadStatus = "prospect" | "qualified" | "engaged" | "proposal" | "won" | "lost";

export type BdActivityId =
  | "lakefront-stewardship"
  | "heat-safety"
  | "nutrition-partners"
  | "medical-supply"
  | "broadcast-rights"
  | "apparel-gear"
  | "anti-doping-tech"
  | "host-city-bid";

export type BdActivity = {
  id: BdActivityId;
  label: string;
  thesis: string;                       // why this is a viable product
  feedingClasses: TaskClass[];          // ops readiness signal
  griModuleIds: string[];               // evidence coverage signal
  costDrivers: TaskClass[];             // task classes that consume budget
  revenueTiers: { name: string; value: number }[];
  productLink: string;                  // matches PRODUCT_MATRIX wording
};

export type BdLead = {
  id: string;
  activity: BdActivityId;
  company: string;
  sector: string;
  status: LeadStatus;
  esgFitScore: number;                  // 0-100
  estimatedValue: number;               // USD
  owner: string;                        // agent id
  notes: string;
  brief?: string;                       // synthesized by BD-Scout
};

// ─── Seed activities — pulled from existing TaskClass + GRI catalogue ──────
export const BD_ACTIVITIES: BdActivity[] = [
  {
    id: "lakefront-stewardship",
    label: "Lakefront Stewardship Certification",
    thesis: "Sell Jabi Lake water-protection methodology + audit as licensable certification.",
    feedingClasses: ["environmental", "venue"],
    griModuleIds: ["gri303", "gri304", "esrse3"],
    costDrivers: ["environmental", "venue"],
    revenueTiers: [
      { name: "Municipal license", value: 45000 },
      { name: "Sponsor co-brand", value: 80000 },
      { name: "Title eco-partner", value: 180000 },
    ],
    productLink: "Lakefront certification product; eco-event brand",
  },
  {
    id: "heat-safety",
    label: "Heat-Safety Technology Pack",
    thesis: "Bundle WBGT sentinel + flag-call protocol into a federation-grade safety service.",
    feedingClasses: ["environmental", "medical", "contingency"],
    griModuleIds: ["gri416", "esrse1"],
    costDrivers: ["environmental", "medical"],
    revenueTiers: [
      { name: "Sensor + dashboard", value: 25000 },
      { name: "Federation SaaS", value: 65000 },
      { name: "Continental rollout", value: 220000 },
    ],
    productLink: "Safety audit service; federation compliance tool",
  },
  {
    id: "nutrition-partners",
    label: "Hydration & Nutrition Partner Program",
    thesis: "Aid-station + fluid-replacement plan opens activation slots for nutrition brands.",
    feedingClasses: ["nutrition", "services"],
    griModuleIds: ["gri303", "gri404"],
    costDrivers: ["nutrition", "services"],
    revenueTiers: [
      { name: "Aid-station presence", value: 15000 },
      { name: "Official hydration", value: 55000 },
      { name: "Multi-event series", value: 140000 },
    ],
    productLink: "Sponsor activation; nutrition partner platform",
  },
  {
    id: "medical-supply",
    label: "Medical & Emergency Supply Partner",
    thesis: "AED, triage, evac assets create a procurement + co-brand channel.",
    feedingClasses: ["medical"],
    griModuleIds: ["gri416", "esrss1"],
    costDrivers: ["medical"],
    revenueTiers: [
      { name: "In-kind supply", value: 12000 },
      { name: "Co-brand partner", value: 40000 },
      { name: "Regional medical sponsor", value: 120000 },
    ],
    productLink: "Medical protocol product; federation tool",
  },
  {
    id: "broadcast-rights",
    label: "Broadcast & Data Rights",
    thesis: "Timing, results, course feed = licensable broadcast + analytics pack.",
    feedingClasses: ["results", "communications", "course"],
    griModuleIds: ["gri201", "gri203"],
    costDrivers: ["results", "communications"],
    revenueTiers: [
      { name: "Local broadcast", value: 30000 },
      { name: "Continental feed", value: 110000 },
      { name: "Global rights", value: 350000 },
    ],
    productLink: "Race-tech licensing; data analytics product",
  },
  {
    id: "apparel-gear",
    label: "Apparel & Gear Partnership",
    thesis: "Athlete + volunteer kit + Pitstop lifestyle bridge unlocks apparel sponsorship.",
    feedingClasses: ["services", "registration"],
    griModuleIds: ["gri204", "gri413"],
    costDrivers: ["services"],
    revenueTiers: [
      { name: "Kit supplier", value: 20000 },
      { name: "Official outfitter", value: 70000 },
      { name: "Lifestyle brand co-launch", value: 160000 },
    ],
    productLink: "Sport-lifestyle brand partnership",
  },
  {
    id: "anti-doping-tech",
    label: "Anti-Doping Chain-of-Custody Tooling",
    thesis: "Compliance posture is sellable to other federations and labs.",
    feedingClasses: ["anti-doping", "governance"],
    griModuleIds: ["gri205", "esrsg1"],
    costDrivers: ["anti-doping", "governance"],
    revenueTiers: [
      { name: "Lab partner", value: 18000 },
      { name: "Federation license", value: 60000 },
      { name: "WADA-aligned platform", value: 200000 },
    ],
    productLink: "Compliance audit product",
  },
  {
    id: "host-city-bid",
    label: "Host-City Bid Evidence Pack",
    thesis: "Aggregated governance + impact disclosures = saleable bid product.",
    feedingClasses: ["governance", "reporting"],
    griModuleIds: ["gri2", "gri203", "esrsg1"],
    costDrivers: ["governance", "reporting"],
    revenueTiers: [
      { name: "City advisory", value: 35000 },
      { name: "Bid dossier", value: 95000 },
      { name: "10-year pathway retainer", value: 280000 },
    ],
    productLink: "Host-city bid product",
  },
];

// ─── Seed leads (per event, in-memory) ────────────────────────────────────
let LEAD_COUNTER = 1000;
const nextLeadId = () => `BD-${(++LEAD_COUNTER).toString(36).toUpperCase()}`;

export function seedLeadsForEvent(eventId: string): BdLead[] {
  const mk = (
    activity: BdActivityId,
    company: string,
    sector: string,
    status: LeadStatus,
    esg: number,
    value: number,
    notes: string,
  ): BdLead => ({
    id: nextLeadId(),
    activity,
    company,
    sector,
    status,
    esgFitScore: esg,
    estimatedValue: value,
    owner: "bd-scout",
    notes,
  });
  return [
    mk("lakefront-stewardship", "AquaTrust Africa", "Water utility", "qualified", 88, 80000, "Active water-stewardship CSR; signed UNGC."),
    mk("lakefront-stewardship", "FCT Parks Authority", "Public sector", "engaged", 76, 45000, "Existing Jabi Lake MoU."),
    mk("heat-safety", "Sahel WeatherTech", "Climate SaaS", "proposal", 82, 65000, "Pilot ready for sensor + dashboard tier."),
    mk("nutrition-partners", "Niger Hydrate Co.", "Beverage", "engaged", 70, 55000, "Wants official hydration tier for regional series."),
    mk("nutrition-partners", "PlantFuel Lagos", "Sports nutrition", "prospect", 65, 15000, "Inbound interest after Pitstop ride."),
    mk("medical-supply", "MedReach NG", "Medical devices", "qualified", 78, 40000, "AED in-kind + co-brand on aid stations."),
    mk("broadcast-rights", "Continental Sports Network", "Broadcast", "proposal", 84, 110000, "Multi-event continental package."),
    mk("apparel-gear", "Lagos Kit Lab", "Apparel", "engaged", 72, 70000, "Co-design athlete kit + lifestyle drop."),
    mk("anti-doping-tech", "PureSport Labs", "Anti-doping lab", "prospect", 80, 60000, "Federation-license track."),
    mk("host-city-bid", "Abuja City Marketing", "Government", "won", 90, 95000, "Bid dossier engagement awarded for 2027 cycle."),
  ].map((l) => ({ ...l, id: `${eventId}-${l.id}` }));
}

// ─── BD-Scout synthesis ────────────────────────────────────────────────────
export function synthesizeBrief(lead: BdLead, activity: BdActivity, rt: EventRuntime): string {
  const ev = deriveEvidence(rt);
  const cov = activity.griModuleIds.map((id) => ev.find((e) => e.module.id === id)?.evidencePct ?? 0);
  const evAvg = cov.length ? Math.round(cov.reduce((a, b) => a + b, 0) / cov.length) : 0;
  const opsTasks = rt.tasks.filter((t) => activity.feedingClasses.includes(t.taskClass));
  const opsDone = opsTasks.filter((t) => t.state === "completed").length;
  const opsPct = opsTasks.length ? Math.round((opsDone / opsTasks.length) * 100) : 0;
  const tier = activity.revenueTiers.find((t) => t.value >= lead.estimatedValue) ?? activity.revenueTiers[0];
  return [
    `BD-Scout brief · ${lead.company} (${lead.sector})`,
    `Activity fit: ${activity.label} — ESG fit ${lead.esgFitScore}/100.`,
    `Ops readiness ${opsPct}% (${opsDone}/${opsTasks.length} feeding tasks complete).`,
    `Evidence coverage ${evAvg}% across ${activity.griModuleIds.join(", ")}.`,
    `Recommended tier: ${tier.name} @ $${tier.value.toLocaleString()}.`,
    `Next action: ${nextAction(lead.status)}.`,
  ].join(" ▸ ");
}

export function nextAction(status: LeadStatus): string {
  switch (status) {
    case "prospect": return "Send intro deck + ESG datapack";
    case "qualified": return "Schedule discovery call with sponsor lead";
    case "engaged": return "Issue tiered proposal + GRI evidence appendix";
    case "proposal": return "Negotiate activation rights + close";
    case "won": return "Activate partner onboarding workflow";
    case "lost": return "Archive; revisit in next event cycle";
  }
}

// ─── Viability scoring ─────────────────────────────────────────────────────
export type ActivityScore = {
  activity: BdActivity;
  opsReadinessPct: number;
  evidencePct: number;
  pipelineDepth: number;       // 0-100
  viabilityScore: number;      // 0-100
  flag: "viable" | "conditional" | "not-ready";
  pipelineValue: number;
  wonValue: number;
};

export function scoreActivities(rt: EventRuntime, leads: BdLead[]): ActivityScore[] {
  const ev = deriveEvidence(rt);
  return BD_ACTIVITIES.map((a) => {
    const opsTasks = rt.tasks.filter((t) => a.feedingClasses.includes(t.taskClass));
    const opsDone = opsTasks.filter((t) => t.state === "completed").length;
    const opsReadinessPct = opsTasks.length ? Math.round((opsDone / opsTasks.length) * 100) : 0;
    const cov = a.griModuleIds.map((id) => ev.find((e) => e.module.id === id)?.evidencePct ?? 0);
    const evidencePct = cov.length ? Math.round(cov.reduce((x, y) => x + y, 0) / cov.length) : 0;
    const activityLeads = leads.filter((l) => l.activity === a.id);
    const live = activityLeads.filter((l) => l.status !== "lost").length;
    const pipelineDepth = Math.min(100, live * 25);
    const viabilityScore = Math.round(0.4 * opsReadinessPct + 0.3 * evidencePct + 0.3 * pipelineDepth);
    const pipelineValue = activityLeads
      .filter((l) => l.status !== "lost" && l.status !== "won")
      .reduce((sum, l) => sum + l.estimatedValue, 0);
    const wonValue = activityLeads.filter((l) => l.status === "won").reduce((s, l) => s + l.estimatedValue, 0);
    const flag: ActivityScore["flag"] =
      viabilityScore >= 65 ? "viable" : viabilityScore >= 35 ? "conditional" : "not-ready";
    return { activity: a, opsReadinessPct, evidencePct, pipelineDepth, viabilityScore, flag, pipelineValue, wonValue };
  });
}

// ─── Cost / Revenue ledger ─────────────────────────────────────────────────
// Default cost weight per task class (USD per executed task) — editable in UI later.
export const CLASS_COST_RATE: Record<string, number> = {
  environmental: 1200,
  medical: 2400,
  "anti-doping": 1800,
  nutrition: 900,
  course: 1500,
  registration: 600,
  results: 800,
  "prize-money": 5000,
  reporting: 500,
  governance: 700,
  venue: 1100,
  services: 850,
  communications: 700,
  contingency: 1000,
};

export type LedgerLine = {
  taskClass: string;
  executedTasks: number;
  cost: number;
};

export type Ledger = {
  lines: LedgerLine[];
  totalCost: number;
  pipelineRevenue: number;
  wonRevenue: number;
  targetRevenue: number;
  attainmentPct: number;
  net: number;
};

export function buildLedger(rt: EventRuntime, leads: BdLead[]): Ledger {
  const byClass: Record<string, number> = {};
  rt.tasks.forEach((t) => {
    if (t.state === "completed") byClass[t.taskClass] = (byClass[t.taskClass] || 0) + 1;
  });
  const lines: LedgerLine[] = Object.entries(byClass).map(([taskClass, executedTasks]) => ({
    taskClass,
    executedTasks,
    cost: executedTasks * (CLASS_COST_RATE[taskClass] ?? 500),
  }));
  const totalCost = lines.reduce((s, l) => s + l.cost, 0);
  const wonRevenue = leads.filter((l) => l.status === "won").reduce((s, l) => s + l.estimatedValue, 0);
  const pipelineRevenue = leads
    .filter((l) => l.status !== "lost" && l.status !== "won")
    .reduce((s, l) => s + l.estimatedValue, 0);
  const targetRevenue = BD_ACTIVITIES.reduce(
    (s, a) => s + a.revenueTiers[a.revenueTiers.length - 1].value,
    0,
  );
  const attainmentPct = targetRevenue ? Math.round((wonRevenue / targetRevenue) * 100) : 0;
  return { lines, totalCost, pipelineRevenue, wonRevenue, targetRevenue, attainmentPct, net: wonRevenue - totalCost };
}

export const LEAD_STATUSES: LeadStatus[] = ["prospect", "qualified", "engaged", "proposal", "won", "lost"];

export function advanceLeadStatus(status: LeadStatus): LeadStatus {
  const order: LeadStatus[] = ["prospect", "qualified", "engaged", "proposal", "won"];
  const i = order.indexOf(status);
  return i < 0 || i === order.length - 1 ? status : order[i + 1];
}
