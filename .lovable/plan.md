## Business Development & Corporate Sponsorship Module

A new functional pillar inside the Tarkwa Ops Console that turns workforce execution + GRI disclosures into a commercial pipeline: lead research, viability validation, sponsorship engagement, and revenue/cost linkage back to the reporting suite.

### What it does (capabilities)

1. **Lead Definition & Curation**
   - Define target business activities (e.g. Lakefront Water Stewardship, Heat-Safety Tech, Nutrition Partners, Medical Supply, Broadcast Rights, Apparel) drawn from the existing `TaskClass` taxonomy.
   - Curate corporate leads per activity with status: `prospect → qualified → engaged → proposal → won → lost`.

2. **Research Agent (BD-Scout)**
   - New agent in `AGENT_WORKFORCE` that runs research tasks per lead: industry fit, ESG alignment (cross-checked against active GRI modules), spend signals, prior triathlon/sport sponsorships.
   - Produces a synthesized "Lead Brief" output (same pattern as `synthesize()` in `event-engine.ts`).

3. **Product Viability Validation**
   - Each business activity has Viability Criteria: market demand, regulatory fit (pulled from master-playbook sources), operational readiness (% completed tasks in feeding classes), GRI evidence coverage.
   - Auto-scored 0–100; flagged `viable | conditional | not-ready`.

4. **Engagement Accelerator**
   - Per lead: next-best-action queue (intro deck, ESG datapack, sponsorship tier proposal), owner = Tarkwa or delegated agent.
   - Generates pre-filled outreach packets that bundle GRI evidence + event KPIs.

5. **Reporting Suite ↔ Cost/Revenue Linkage**
   - Each BD activity declares `costDrivers[]` (task classes consuming budget) and `revenueDrivers[]` (sponsorship tiers, product sales, certification fees).
   - Live P&L per event: cost = Σ task effort × class rate; revenue = Σ won leads × tier value.
   - Plugs into existing `GriProductMatrix` so each GRI product gains a commercial column (target revenue, pipeline, attainment %).

6. **Product Development Clarity**
   - "Attainable State" view: for each product in the matrix, shows required tasks remaining, evidence gap, lead pipeline coverage, ETA to viable launch.

### Where it lives (architecture)

```text
src/lib/
  business-development.ts      NEW — types, seed activities, leads, scoring
  event-engine.ts              EXTENDED — BD tasks + P&L derivation hooks
  master-playbook.ts           EXTENDED — BD-Scout agent + BD task seeds
  gri-framework.ts             EXTENDED — link modules ↔ revenueDrivers

src/components/
  BusinessDevelopment.tsx      NEW — Leads pipeline + activity board
  ViabilityPanel.tsx           NEW — scored activity cards + gaps
  RevenueLedger.tsx            NEW — cost/revenue per event, attainment %

src/pages/Index.tsx            EXTENDED — new "BD & Sponsorship" tab in Ops workspace
```

### Data model (technical)

```ts
type BdActivityId = "lakefront-stewardship" | "heat-safety" | "nutrition" |
                    "medical-supply" | "broadcast" | "apparel" | "anti-doping-tech";

type BdLead = {
  id: string; activity: BdActivityId; company: string; sector: string;
  status: "prospect"|"qualified"|"engaged"|"proposal"|"won"|"lost";
  esgFitScore: number; estimatedValue: number; owner: string;
  notes: string; brief?: string; // synthesized by BD-Scout
};

type BdActivity = {
  id: BdActivityId; label: string;
  feedingClasses: TaskClass[];        // ops readiness signal
  griModules: string[];               // ESG evidence signal
  costDrivers: TaskClass[];
  revenueTiers: { name: string; value: number }[];
  viabilityScore?: number;            // derived
};
```

Derivation (mirrors `deriveEvidence` pattern):
- `viabilityScore = 0.4*opsReadiness + 0.3*evidenceCoverage + 0.3*pipelineDepth`
- `attainmentPct = wonRevenue / Σ targetRevenue`

### UI flow (tactical military theme preserved)

1. Ops workspace gains a **"BD & SPONSORSHIP"** tab.
2. Three panels:
   - **Activity Board** — viability-scored cards per business activity, with gap callouts.
   - **Lead Pipeline** — kanban by status, BD-Scout brief on click, "Generate Outreach Packet" action.
   - **Revenue Ledger** — cost vs revenue per event, attainment bar, drill-down to driving tasks/leads.
3. GRI Product Matrix gets a "Commercial" column showing target/pipeline/won per product.

### Open assumptions (will use unless you say otherwise)

- BD-Scout uses synthesized outputs (no live external research API). If you want real web research, we'd add a Firecrawl/web-search backend later — out of scope for this plan.
- Cost rates per task class are seeded as defaults and editable in UI.
- No persistence yet (in-memory per session, consistent with current engine). Cloud persistence can be a follow-up.

Tell me to proceed and I'll implement, or flag which assumption to change.