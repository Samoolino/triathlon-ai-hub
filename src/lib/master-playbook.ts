// ─────────────────────────────────────────────────────────────────────────────
// MASTER FILE — Tarkwa Event Operations Playbook
// Functional encoding of the ITU/World Triathlon Event Organiser's Manual
// (Sport Department, 2019 ed.) cross-referenced with the supplied CMS guidelines:
//   · Technical Officials Nutrition Guidelines
//   · Run Course Measurement Manual
//   · Guidelines for Medical Emergencies
//   · Guidelines for Fluid Replacement
//   · Periodic Health Evaluation (PHE) for Triathletes
//   · Pre-participation Cardiac Screening in Athletes
//   · Medical & Anti-Doping Management at WT Events
//   · ITU Medical Delegate Roles & Responsibilities
//   · Weather Report Data Sheet 2020 / WBGT Index Form
//   · Prize Money Calculation Formula 2022
//   · Registration Form Macro NEW 2024
//
// The master file is FUNCTIONAL: each section yields task seeds the engine
// instantiates per event, scoped by discipline, distance, and risk band.
// ─────────────────────────────────────────────────────────────────────────────

export type TaskClass =
  | "environmental"
  | "medical"
  | "anti-doping"
  | "nutrition"
  | "course"
  | "registration"
  | "results"
  | "prize-money"
  | "reporting"
  | "governance"
  | "venue"
  | "services"
  | "communications"
  | "contingency";

export type TaskState =
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

export type Discipline =
  | "triathlon"
  | "duathlon"
  | "aquathlon"
  | "aquabike"
  | "cross-tri"
  | "winter-tri"
  | "paratri"
  | "mixed-relay";

export type DistanceBand = "sprint" | "standard" | "middle" | "long" | "super-sprint";

export type EventState =
  | "planning"
  | "pre-live"
  | "live-normal"
  | "live-elevated"
  | "live-critical"
  | "recovery"
  | "post-event";

export type TaskSeed = {
  code: string;            // template code, e.g. ENV-01
  title: string;
  taskClass: TaskClass;
  priority: number;
  requiredCapabilities: string[];
  defaultAgent?: string;
  taskType: string;
  source: string;          // grounding doc reference
  trigger?: string;
  dependsOn?: string[];    // refers to other seed codes
  appliesTo?: {
    disciplines?: Discipline[];
    distances?: DistanceBand[];
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MASTER SECTIONS — mirrors the 2019 EOM table of contents
// ─────────────────────────────────────────────────────────────────────────────
export const MASTER_SECTIONS = [
  { id: "admin", code: "S2", label: "Administration & Finance", manualRef: "EOM §2" },
  { id: "services", code: "S3", label: "Services (Athlete · TO · VIP · Media)", manualRef: "EOM §3" },
  { id: "fop", code: "S4", label: "Field of Play Operations", manualRef: "EOM §4" },
  { id: "venue", code: "S5", label: "Venue Operations", manualRef: "EOM §5" },
  { id: "support", code: "S6", label: "Event Support (Timing · Medical · Doping · Weather · Comms)", manualRef: "EOM §6" },
  { id: "contingency", code: "S6.8", label: "Contingency & Crisis", manualRef: "EOM §6.7–6.8" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// TASK SEEDS — distilled from the master file. Each seed is a functional
// instruction Tarkwa instantiates against an event configuration.
// ─────────────────────────────────────────────────────────────────────────────
export const TASK_SEEDS: TaskSeed[] = [
  // ─── ADMIN / FINANCE
  {
    code: "ADM-01",
    title: "Confirm LOC organisational chart, sizing & official language",
    taskClass: "governance",
    priority: 0.6,
    requiredCapabilities: ["governance", "loc-structure"],
    taskType: "compliance-check",
    source: "EOM §2.1–2.3",
  },
  {
    code: "ADM-02",
    title: "File event agreement, insurance certificates & permits",
    taskClass: "governance",
    priority: 0.7,
    requiredCapabilities: ["governance", "permits"],
    taskType: "filing",
    source: "EOM §2.4–2.8",
  },
  {
    code: "ADM-03",
    title: "Lock prize money breakdown & post per WT 2022 formula",
    taskClass: "prize-money",
    priority: 0.55,
    requiredCapabilities: ["prize-money-formula"],
    defaultAgent: "results-agent",
    taskType: "calculation",
    source: "worldtriathlon_prize-money-calculation-formula_2022 + EOM §2.9",
  },
  {
    code: "ADM-04",
    title: "Publish event schedule & start-wave plan",
    taskClass: "governance",
    priority: 0.7,
    requiredCapabilities: ["scheduling"],
    taskType: "publish",
    source: "EOM §2.10–2.11",
  },

  // ─── SERVICES — athlete, TO, media
  {
    code: "SVC-01",
    title: "Activate athlete services (registration, race packages, briefings)",
    taskClass: "services",
    priority: 0.7,
    requiredCapabilities: ["athlete-services", "registration"],
    defaultAgent: "registration-agent",
    taskType: "service-activation",
    source: "EOM §3.2",
  },
  {
    code: "SVC-02",
    title: "Brief Technical Officials on nutrition handling at aid stations",
    taskClass: "nutrition",
    priority: 0.6,
    requiredCapabilities: ["TO-nutrition"],
    defaultAgent: "nutrition-agent",
    taskType: "briefing",
    source: "technical-officials-nutrition-guidelines + EOM §3.4",
  },
  {
    code: "SVC-03",
    title: "Stand up volunteer recruitment, training & race-day rotation",
    taskClass: "services",
    priority: 0.55,
    requiredCapabilities: ["volunteer-mgmt"],
    taskType: "service-activation",
    source: "EOM §3.1",
  },

  // ─── FIELD OF PLAY
  {
    code: "FOP-01",
    title: "Lay out start area (pontoon/platform, swim start system)",
    taskClass: "course",
    priority: 0.85,
    requiredCapabilities: ["course-layout"],
    defaultAgent: "course-agent",
    taskType: "layout",
    source: "EOM §4.2",
    appliesTo: { disciplines: ["triathlon", "aquathlon", "aquabike", "paratri", "mixed-relay"] },
  },
  {
    code: "FOP-02",
    title: "Mark swim course (buoys, sighting lines, paratri swim-exit assist)",
    taskClass: "course",
    priority: 0.85,
    requiredCapabilities: ["course-layout"],
    defaultAgent: "course-agent",
    taskType: "layout",
    source: "EOM §4.3",
    appliesTo: { disciplines: ["triathlon", "aquathlon", "aquabike", "paratri", "mixed-relay"] },
  },
  {
    code: "FOP-03",
    title: "Build & validate transition area per discipline rules",
    taskClass: "course",
    priority: 0.86,
    requiredCapabilities: ["course-layout", "transition-flow"],
    defaultAgent: "course-agent",
    taskType: "layout",
    source: "EOM §4.4",
  },
  {
    code: "FOP-04",
    title: "Re-measure run course per WT manual (calibrated wheel, certified path)",
    taskClass: "course",
    priority: 0.86,
    requiredCapabilities: ["course-measurement", "calibration"],
    defaultAgent: "course-agent",
    taskType: "measurement",
    source: "run-course-measurement-manual + EOM §4.11",
  },
  {
    code: "FOP-05",
    title: "Stage bike course personnel, signage & FOP risk assessment",
    taskClass: "course",
    priority: 0.84,
    requiredCapabilities: ["course-layout", "risk-assessment"],
    defaultAgent: "course-agent",
    taskType: "deployment",
    source: "EOM §4.5",
  },
  {
    code: "FOP-06",
    title: "Stand up bike & run aid stations + penalty boxes + wheel station",
    taskClass: "course",
    priority: 0.78,
    requiredCapabilities: ["course-layout"],
    taskType: "deployment",
    source: "EOM §4.6–4.13",
  },
  {
    code: "FOP-07",
    title: "Configure finish, recovery and (if applicable) mixed-relay zone",
    taskClass: "course",
    priority: 0.8,
    requiredCapabilities: ["course-layout"],
    taskType: "deployment",
    source: "EOM §4.14–4.16",
  },

  // ─── VENUE
  {
    code: "VNU-01",
    title: "Allocate venue facilities (athletes' lounge, medical, doping, media, VIP)",
    taskClass: "venue",
    priority: 0.7,
    requiredCapabilities: ["venue-ops"],
    taskType: "allocation",
    source: "EOM §5.2",
  },
  {
    code: "VNU-02",
    title: "Publish venue map, site plan, evacuation plan & cabling plan",
    taskClass: "venue",
    priority: 0.7,
    requiredCapabilities: ["venue-ops"],
    taskType: "publish",
    source: "EOM §5.7",
  },

  // ─── SUPPORT — timing, medical, doping, weather, comms
  {
    code: "SUP-01",
    title: "Provision timing system, transponders, photo finish & manual back-up",
    taskClass: "results",
    priority: 0.78,
    requiredCapabilities: ["timing"],
    taskType: "provisioning",
    source: "EOM §6.2",
  },
  {
    code: "MED-01",
    title: "Verify PHE & pre-participation cardiac screening completion",
    taskClass: "medical",
    priority: 0.88,
    requiredCapabilities: ["PHE", "cardiac-screening"],
    defaultAgent: "medical-agent",
    taskType: "compliance-check",
    source: "periodic-health-evaluation-phe + pre-participation-cardiac-screening",
  },
  {
    code: "MED-02",
    title: "Stage medical emergency response (aid stations, AED, evac route)",
    taskClass: "medical",
    priority: 0.94,
    requiredCapabilities: ["medical-emergency", "triage"],
    defaultAgent: "medical-agent",
    taskType: "deployment",
    source: "guidelines-for-medical-emergencies",
    dependsOn: ["MED-01"],
  },
  {
    code: "MED-03",
    title: "Medical Delegate co-sign of heat flag & continue/cancel call",
    taskClass: "medical",
    priority: 0.96,
    requiredCapabilities: ["delegate-duties", "medical-emergency"],
    defaultAgent: "medical-agent",
    taskType: "review",
    source: "itu-medical-delegate-roles-responsabilities",
    dependsOn: ["ENV-02"],
  },
  {
    code: "DOP-01",
    title: "Select athletes for in-competition testing & open chain-of-custody",
    taskClass: "anti-doping",
    priority: 0.84,
    requiredCapabilities: ["anti-doping", "chain-of-custody"],
    defaultAgent: "doping-agent",
    taskType: "selection",
    source: "medical-and-anti-doping-management",
  },
  {
    code: "ENV-01",
    title: "Begin WBGT monitoring 3h pre-start (every 30 min, finish line, 1.5 m, direct sun)",
    taskClass: "environmental",
    priority: 0.95,
    requiredCapabilities: ["wbgt", "air-temp", "humidity"],
    defaultAgent: "wbgt-agent",
    taskType: "sensing-loop",
    source: "Weather_Report_Data_Sheet_2020 + WBGT_index_form",
    trigger: "T-3h before start",
  },
  {
    code: "ENV-02",
    title: "Classify heat-risk flag (Black/Red/Orange/Yellow/Green) and broadcast",
    taskClass: "environmental",
    priority: 0.93,
    requiredCapabilities: ["flag-call", "risk-scoring"],
    defaultAgent: "wbgt-agent",
    taskType: "classification",
    source: "Weather_Report_Data_Sheet_2020 (risk table)",
    dependsOn: ["ENV-01"],
  },
  {
    code: "ENV-03",
    title: "Capture water temperature & wetsuit decision input",
    taskClass: "environmental",
    priority: 0.82,
    requiredCapabilities: ["water-temp"],
    defaultAgent: "wbgt-agent",
    taskType: "sensing",
    source: "Weather_Report_Data_Sheet_2020",
    appliesTo: { disciplines: ["triathlon", "aquathlon", "aquabike", "paratri", "mixed-relay"] },
  },
  {
    code: "ENV-04",
    title: "Activate wind action plan & air-pollution thresholds",
    taskClass: "environmental",
    priority: 0.7,
    requiredCapabilities: ["wind", "air-quality"],
    defaultAgent: "wbgt-agent",
    taskType: "monitoring",
    source: "EOM §6.5",
  },
  {
    code: "NUT-01",
    title: "Compute athlete fluid replacement plan vs WBGT band",
    taskClass: "nutrition",
    priority: 0.78,
    requiredCapabilities: ["fluid-replacement", "hydration-plan"],
    defaultAgent: "nutrition-agent",
    taskType: "computation",
    source: "guidelines-for-fluid-replacement",
    dependsOn: ["ENV-02"],
  },
  {
    code: "REG-01",
    title: "Ingest Registration Form Macro 2024 submissions & validate fields",
    taskClass: "registration",
    priority: 0.7,
    requiredCapabilities: ["registration", "form-macro", "data-validation"],
    defaultAgent: "registration-agent",
    taskType: "ingest",
    source: "Registration_Form_Macro_NEW_2024",
  },
  {
    code: "COM-01",
    title: "Activate race communication plan (VCC, radio talk-groups, protocol)",
    taskClass: "communications",
    priority: 0.78,
    requiredCapabilities: ["radio", "vcc"],
    taskType: "activation",
    source: "EOM §6.6",
  },
  {
    code: "REP-01",
    title: "Publish Tarkwa guardian awareness snapshot to command channel",
    taskClass: "reporting",
    priority: 0.6,
    requiredCapabilities: ["briefing", "summaries"],
    defaultAgent: "report-agent",
    taskType: "reporting",
    source: "all",
    dependsOn: ["ENV-02", "MED-02", "NUT-01"],
  },
  {
    code: "RES-01",
    title: "Compute prize money split (Top 5/10/15) from official results",
    taskClass: "prize-money",
    priority: 0.55,
    requiredCapabilities: ["prize-money-formula", "results"],
    defaultAgent: "results-agent",
    taskType: "calculation",
    source: "worldtriathlon_prize-money-calculation-formula_2022",
    trigger: "post-finish",
    dependsOn: ["FOP-04", "SUP-01"],
  },

  // ─── CONTINGENCY
  {
    code: "CON-01",
    title: "Maintain contingency plan, delay/postpone/cancel decision tree",
    taskClass: "contingency",
    priority: 0.82,
    requiredCapabilities: ["contingency", "crisis"],
    taskType: "planning",
    source: "EOM §6.7–6.8",
  },
  {
    code: "CON-02",
    title: "Run crisis communication plan (spokesperson, channels, log)",
    taskClass: "contingency",
    priority: 0.78,
    requiredCapabilities: ["crisis", "comms"],
    taskType: "planning",
    source: "EOM §6.7",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AGENT WORKFORCE — capability-grounded, sourced to the documents
// ─────────────────────────────────────────────────────────────────────────────
export type AgentSeed = {
  id: string;
  name: string;
  role: string;
  cluster: string;
  capabilities: string[];
  sources: string[];
  reputationScore: number;
  reputationTier: string;
};

export const AGENT_WORKFORCE: AgentSeed[] = [
  { id: "tarkwa", name: "Tarkwa", role: "Guardian / Assigner AI", cluster: "Command", capabilities: ["orchestration", "risk-scoring", "routing", "escalation"], sources: ["all"], reputationScore: 0.987, reputationTier: "guardian" },
  { id: "wbgt-agent", name: "WBGT Sentinel", role: "Environmental Monitoring", cluster: "Intelligence", capabilities: ["wbgt", "air-temp", "humidity", "water-temp", "wind", "flag-call", "air-quality"], sources: ["Weather_Report_Data_Sheet_2020", "WBGT_index_form"], reputationScore: 0.931, reputationTier: "trusted" },
  { id: "medical-agent", name: "Medical Delegate", role: "Medical Operations", cluster: "Health", capabilities: ["medical-emergency", "triage", "PHE", "cardiac-screening", "delegate-duties"], sources: ["guidelines-for-medical-emergencies", "periodic-health-evaluation-phe", "pre-participation-cardiac-screening", "itu-medical-delegate-roles-responsabilities"], reputationScore: 0.952, reputationTier: "guardian" },
  { id: "nutrition-agent", name: "Fluid & Nutrition Officer", role: "Athlete Performance", cluster: "Health", capabilities: ["fluid-replacement", "nutrition", "TO-nutrition", "hydration-plan"], sources: ["guidelines-for-fluid-replacement", "technical-officials-nutrition-guidelines"], reputationScore: 0.889, reputationTier: "trusted" },
  { id: "doping-agent", name: "Anti-Doping Steward", role: "Compliance", cluster: "Governance", capabilities: ["anti-doping", "chain-of-custody", "athlete-selection", "audit"], sources: ["medical-and-anti-doping-management"], reputationScore: 0.917, reputationTier: "trusted" },
  { id: "course-agent", name: "Course Surveyor", role: "Technical", cluster: "Operations", capabilities: ["course-measurement", "calibration", "course-layout", "transition-flow", "risk-assessment"], sources: ["run-course-measurement-manual", "EOM §4"], reputationScore: 0.873, reputationTier: "field-ready" },
  { id: "registration-agent", name: "Registration Bot", role: "Operations", cluster: "Operations", capabilities: ["registration", "form-macro", "data-validation", "athlete-services"], sources: ["Registration_Form_Macro_NEW_2024"], reputationScore: 0.842, reputationTier: "verified" },
  { id: "results-agent", name: "Results & Prize Calculator", role: "Reporting", cluster: "Intelligence", capabilities: ["results", "prize-money-formula", "ranking", "publication", "timing"], sources: ["worldtriathlon_prize-money-calculation-formula_2022", "EOM §6.2"], reputationScore: 0.866, reputationTier: "verified" },
  { id: "report-agent", name: "Live Reporting Desk", role: "Reporting", cluster: "Intelligence", capabilities: ["briefing", "public-report", "summaries", "comms", "radio", "vcc"], sources: ["all"], reputationScore: 0.846, reputationTier: "verified" },
];

export const DOC_CORPUS = [
  { id: "eom", name: "ITU Event Organiser's Manual (2019)", kind: "master" },
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
