// GRI / ESRS analytical framework — sourced from the uploaded
// "Abuja GRI Run-Analytical Utility" + "Event-to-GRI Product Matrix" briefs.
// Bound to the live event runtime so reports advance as the workforce executes.

import type { LiveTask, EventRuntime } from "./event-engine";

export type GriRoute = "EN" | "ES" | "ESRS" | "GOV";

export type GriModule = {
  id: string;
  code: string;
  name: string;
  route: GriRoute;
  map: string;
  disclosures: string[];   // disclosure code + label
  discCount: number;       // total disclosures in the standard
  // Which task classes (from master-playbook) feed evidence into this module.
  evidenceClasses: string[];
};

export const GRI_MODULES: GriModule[] = [
  { id: "gri2",   code: "GRI 2",   name: "General disclosures",        route: "GOV", map: "Org identity, governance, LOC structure",
    disclosures: ["2-1 Org details","2-2 Reporting entities","2-3 Period & contact","2-9 Governance structure","2-22 Strategy statement"],
    discCount: 29, evidenceClasses: ["Governance","Reporting"] },
  { id: "gri3",   code: "GRI 3",   name: "Material topics",            route: "GOV", map: "Materiality process, stakeholder input",
    disclosures: ["3-1 Materiality process","3-2 List of material topics","3-3 Management of topics"],
    discCount: 3, evidenceClasses: ["Reporting","Governance"] },
  { id: "gri201", code: "GRI 201", name: "Economic performance",       route: "GOV", map: "Event revenue, grant, sponsor value",
    disclosures: ["201-1 Direct economic value","201-3 Benefit plan obligations"],
    discCount: 4, evidenceClasses: ["Results","Commercial"] },
  { id: "gri203", code: "GRI 203", name: "Indirect economic impacts",  route: "ES",  map: "City GDP, tourism, infrastructure",
    disclosures: ["203-1 Infrastructure investments","203-2 Significant indirect impacts"],
    discCount: 2, evidenceClasses: ["Commercial","Reporting"] },
  { id: "gri204", code: "GRI 204", name: "Procurement practices",      route: "GOV", map: "Local supplier spend, agency procurement",
    disclosures: ["204-1 Local supplier proportion"],
    discCount: 1, evidenceClasses: ["Commercial","Governance"] },
  { id: "gri205", code: "GRI 205", name: "Anti-corruption",            route: "GOV", map: "Ethics, compliance, LOC code",
    disclosures: ["205-1 Operations assessed","205-2 Policy communication","205-3 Confirmed incidents"],
    discCount: 3, evidenceClasses: ["Governance"] },
  { id: "gri302", code: "GRI 302", name: "Energy",                     route: "EN",  map: "Generator use, lighting, emissions",
    disclosures: ["302-1 Energy consumption","302-4 Energy reduction"],
    discCount: 5, evidenceClasses: ["Environmental"] },
  { id: "gri303", code: "GRI 303", name: "Water & effluents",          route: "EN",  map: "Jabi Lake use, water stewardship",
    disclosures: ["303-1 Water interactions","303-2 Mgmt of water impacts","303-3 Water withdrawal"],
    discCount: 5, evidenceClasses: ["Environmental","Nutrition"] },
  { id: "gri304", code: "GRI 304", name: "Biodiversity",               route: "EN",  map: "Jabi Lake habitat, route ecology",
    disclosures: ["304-1 Sites near protected areas","304-2 Significant impacts"],
    discCount: 4, evidenceClasses: ["Environmental","FOP"] },
  { id: "gri305", code: "GRI 305", name: "Emissions",                  route: "EN",  map: "Event carbon footprint, Scope 1–3",
    disclosures: ["305-1 Direct (Scope 1)","305-2 Indirect (Scope 2)","305-3 Other (Scope 3)","305-7 NOx/SOx"],
    discCount: 7, evidenceClasses: ["Environmental"] },
  { id: "gri306", code: "GRI 306", name: "Waste",                      route: "EN",  map: "Zero-trace ops, park clean protocol",
    disclosures: ["306-1 Waste generation","306-2 Waste mgmt impacts","306-4 Waste diverted","306-5 Waste directed to disposal"],
    discCount: 5, evidenceClasses: ["Environmental"] },
  { id: "gri401", code: "GRI 401", name: "Employment",                 route: "ES",  map: "LOC staff, volunteers, agency hires",
    disclosures: ["401-1 New hires & turnover","401-2 Benefits to employees","401-3 Parental leave"],
    discCount: 3, evidenceClasses: ["Workforce","Governance"] },
  { id: "gri404", code: "GRI 404", name: "Training & education",       route: "ES",  map: "Officials, medics, volunteer skills",
    disclosures: ["404-1 Avg hours of training","404-2 Skills dev programs","404-3 Performance reviews"],
    discCount: 3, evidenceClasses: ["Workforce","Medical"] },
  { id: "gri405", code: "GRI 405", name: "Diversity & equal opportunity", route: "ES", map: "Gender, agency mix, para-inclusion",
    disclosures: ["405-1 Diversity in governance","405-2 Ratio of pay"],
    discCount: 2, evidenceClasses: ["Workforce"] },
  { id: "gri413", code: "GRI 413", name: "Local communities",          route: "ES",  map: "Uniformed community, civic engagement",
    disclosures: ["413-1 Operations with engagement","413-2 Operations with impacts"],
    discCount: 2, evidenceClasses: ["Commercial","Reporting"] },
  { id: "gri416", code: "GRI 416", name: "Customer health & safety",   route: "ES",  map: "Athlete & spectator safety systems",
    disclosures: ["416-1 Safety assessment incidents","416-2 Violations"],
    discCount: 2, evidenceClasses: ["Medical","FOP","Anti-Doping"] },
  { id: "esrs1",  code: "ESRS 1",  name: "General requirements",       route: "ESRS", map: "Due diligence, double materiality",
    disclosures: ["IRO identification","Double materiality assessment","Sustainability due diligence"],
    discCount: 8, evidenceClasses: ["Reporting","Governance"] },
  { id: "esrse1", code: "ESRS E1", name: "Climate change",             route: "ESRS", map: "Event GHG, carbon reduction targets",
    disclosures: ["E1-1 Transition plan","E1-4 Targets","E1-6 GHG emissions"],
    discCount: 9, evidenceClasses: ["Environmental"] },
  { id: "esrse3", code: "ESRS E3", name: "Water & marine",             route: "ESRS", map: "Jabi Lake, clean-water stewardship",
    disclosures: ["E3-1 Policy","E3-4 Water consumption"],
    discCount: 5, evidenceClasses: ["Environmental","Nutrition"] },
  { id: "esrss1", code: "ESRS S1", name: "Own workforce",              route: "ESRS", map: "LOC conditions, health, representation",
    disclosures: ["S1-1 Policy","S1-6 Worker characteristics","S1-14 Health & safety"],
    discCount: 17, evidenceClasses: ["Workforce","Medical"] },
  { id: "esrss3", code: "ESRS S3", name: "Affected communities",       route: "ESRS", map: "Jabi neighbourhood, uniformed corps",
    disclosures: ["S3-1 Policy","S3-4 Actions & resources"],
    discCount: 5, evidenceClasses: ["Commercial","Reporting"] },
  { id: "esrsg1", code: "ESRS G1", name: "Business conduct",           route: "ESRS", map: "Anti-corruption, governance quality",
    disclosures: ["G1-1 Policy","G1-3 Corruption incidents"],
    discCount: 6, evidenceClasses: ["Governance"] },
];

export const GRI_ROUTES: { id: GriRoute | "all"; label: string }[] = [
  { id: "all",  label: "All routes" },
  { id: "EN",   label: "Route 1 · EN (Environment)" },
  { id: "ES",   label: "Route 1 · ES (Social)" },
  { id: "ESRS", label: "ESRS alignment" },
  { id: "GOV",  label: "Governance & General" },
];

// ─── Event → GRI product matrix (uploaded brief #2) ─────────────────────────
export type ProductRow = {
  component: string;
  gri: string;
  esrs: string;
  output: string;
  product: string;
};
export type ProductSection = { title: string; rows: ProductRow[] };

export const PRODUCT_MATRIX: ProductSection[] = [
  { title: "Venue & Environment — Jabi Lake Park", rows: [
    { component: "Jabi Lake water use & protection", gri: "GRI 303 Water", esrs: "ESRS E3",
      output: "Water stewardship report, quality monitoring log, ESG park plan",
      product: "Lakefront certification product; eco-event brand; municipal partnership" },
    { component: "Course route mapping & land use", gri: "GRI 304 Biodiversity", esrs: "ESRS E4",
      output: "Habitat protection disclosure, route evidence archive",
      product: "Geo-data product; host-city infrastructure consultancy offering" },
    { component: "Waste, energy & zero-trace ops", gri: "GRI 302 / 306", esrs: "ESRS E1 / E5",
      output: "Carbon footprint estimate, waste diversion rate disclosure",
      product: "Green-event certification; sponsor ESG credit product; future bid evidence" },
  ]},
  { title: "Uniformed Community Invitational", rows: [
    { component: "Agency participation & team onboarding", gri: "GRI 413 Communities", esrs: "ESRS S3",
      output: "Stakeholder engagement report; agency invitation evidence file",
      product: "Institutional partnership product; govt. relations retainer; security-sport bridge" },
    { component: "Volunteer & LOC workforce", gri: "GRI 401 / 404", esrs: "ESRS S1",
      output: "Employment & training disclosure; volunteer hours log",
      product: "Workforce dev. programme; skills certification product; HR consulting" },
    { component: "Inclusion & adaptive participation", gri: "GRI 405 / 406", esrs: "ESRS S1 / S4",
      output: "Diversity disclosure; para-athlete participation data",
      product: "Inclusive-sport product line; social impact investment deck; DEI reporting service" },
  ]},
  { title: "Race Operations & Safety Systems", rows: [
    { component: "Medical, safety & emergency systems", gri: "GRI 416 Safety", esrs: "ESRS S1 / G1",
      output: "Health & safety disclosure; incident log; EMS review",
      product: "Medical protocol product; safety audit service; federation compliance tool" },
    { component: "Timing, results & technical ops", gri: "GRI 2-29 Stakeholders", esrs: "ESRS G1",
      output: "Technical credibility evidence; results archive; officiation log",
      product: "Race-tech licensing; data analytics product; federation recognition portfolio" },
  ]},
  { title: "Governance & LOC Structure", rows: [
    { component: "LOC governance, leadership, accountability", gri: "GRI 2 General", esrs: "ESRS G1",
      output: "Governance structure disclosure; board/LOC charter document",
      product: "Event governance consultancy; host-city bid product; federation documentation" },
    { component: "Anti-corruption, ethics & compliance", gri: "GRI 205 / 206", esrs: "ESRS G1",
      output: "Compliance policy disclosure; ethics code; procurement transparency",
      product: "Compliance audit product; sponsor due-diligence service; govt. tender readiness" },
  ]},
  { title: "Commercial, Partners & Pitstop Lagos", rows: [
    { component: "Pitstop / cycling community bridge", gri: "GRI 203 / 413", esrs: "ESRS S2 / S3",
      output: "Indirect economic impact; community investment disclosure",
      product: "Sport-lifestyle brand partnership; Lagos cycling economy product; community report" },
    { component: "Sponsor & partner activation", gri: "GRI 201 / 204", esrs: "ESRS G1",
      output: "Economic value disclosure; local procurement ratio",
      product: "Sponsor ESG impact package; media/rights product; continental partner platform" },
  ]},
  { title: "Host-City Bid & 10-Year Pathway (2026–2036)", rows: [
    { component: "City readiness & bid evidence", gri: "GRI 203 / 2", esrs: "ESRS G1 / E1",
      output: "Bid evidence file; delivery history; infrastructure disclosure",
      product: "Host-city bid product; continental calendar slot; federation recognition application" },
    { component: "Tourism & economic impact", gri: "GRI 201 / 203", esrs: "ESRS S3 / S4",
      output: "Economic contribution report; visitor impact data; GDP attribution",
      product: "Tourism investment deck; city marketing product; African sport destination brand" },
  ]},
];

// ─── Live binding to event runtime ──────────────────────────────────────────
export type ModuleEvidence = {
  module: GriModule;
  fedTasks: LiveTask[];
  completedTasks: LiveTask[];
  evidencePct: number;       // 0–100, how much of this module is backed by completed work
  status: "Planned" | "Active" | "Review" | "Verified";
};

export function deriveEvidence(rt: EventRuntime): ModuleEvidence[] {
  return GRI_MODULES.map((m) => {
    const fed = rt.tasks.filter((t) => m.evidenceClasses.includes(t.taskClass));
    const done = fed.filter((t) => t.state === "completed");
    const pct = fed.length ? Math.round((done.length / fed.length) * 100) : 0;
    const status: ModuleEvidence["status"] =
      pct === 0 ? "Planned" : pct < 60 ? "Active" : pct < 100 ? "Review" : "Verified";
    return { module: m, fedTasks: fed, completedTasks: done, evidencePct: pct, status };
  });
}

export function buildReport(rt: EventRuntime, selectedIds: Set<string>) {
  const evidence = deriveEvidence(rt).filter((e) => selectedIds.has(e.module.id));
  const totalDisc  = evidence.reduce((a, e) => a + e.module.discCount, 0);
  const maxDisc    = GRI_MODULES.reduce((a, m) => a + m.discCount, 0);
  const completion = maxDisc ? Math.round((totalDisc / maxDisc) * 100) : 0;
  const evidenceAvg = evidence.length
    ? Math.round(evidence.reduce((a, e) => a + e.evidencePct, 0) / evidence.length)
    : 0;
  return { evidence, totalDisc, maxDisc, completion, evidenceAvg };
}
