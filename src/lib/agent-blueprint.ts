// Maps blueprint concepts to existing modules so the Explorer page can render them.
export type BlueprintTab = {
  id: string;
  label: string;
  intro: string;
  items: { name: string; maps_to: string; notes: string }[];
};

export const BLUEPRINT_TABS: BlueprintTab[] = [
  {
    id: "architecture",
    label: "Architecture",
    intro: "Hierarchical Lead Guardian over five sub-agents, coordinated through an event runtime and a master playbook.",
    items: [
      { name: "Lead Guardian (Tarkwa)", maps_to: "src/lib/executive-workforce.ts", notes: "Orchestrates sub-agents and mission lifecycle." },
      { name: "Event Runtime", maps_to: "src/lib/event-engine.ts", notes: "Generic event spec + step runner powering any initiated event." },
      { name: "Master Playbook", maps_to: "src/lib/master-playbook.ts", notes: "Task seeds, document corpus, disciplines, distance bands." },
    ],
  },
  {
    id: "control-flow",
    label: "Control flow",
    intro: "Sprints S0–S8 with stage gates, evidence ladder, and persona-owned task classes.",
    items: [
      { name: "Sprints S0–S8", maps_to: "src/lib/command-center.ts", notes: "Mobilisation → Closeout with offset-day deadlines." },
      { name: "Evidence EV-001..EV-012", maps_to: "src/lib/command-center.ts", notes: "Mapped to task classes + GRI tags." },
      { name: "Mission states", maps_to: "src/lib/executive-workforce.ts", notes: "passive → initiation → active → closeout." },
    ],
  },
  {
    id: "code-patterns",
    label: "Code patterns",
    intro: "Pure-function engines + React surfaces. Streaming AI via edge functions. RLS-gated persistence.",
    items: [
      { name: "Edge function: agent-invoke", maps_to: "supabase/functions/agent-invoke", notes: "Dual provider (Lovable AI Gateway + OpenAI fallback), streaming SSE." },
      { name: "Edge function: narrative-synth", maps_to: "supabase/functions/narrative-synth", notes: "Synthesizes Tarkwa commentary, writes to narrative_entries." },
      { name: "Master corpus", maps_to: "src/lib/master-corpus.ts", notes: "Typed canonical references injected into every prompt." },
    ],
  },
  {
    id: "agent-patterns",
    label: "Agent patterns",
    intro: "Persona-scoped system prompts. Tool-augmented when needed. Citation-required outputs.",
    items: [
      { name: "BD Accomplice", maps_to: "src/components/BusinessDevelopment.tsx", notes: "Lead curation, viability validation, cost/revenue linkage." },
      { name: "ESG Controller", maps_to: "src/components/GriAnalytics.tsx", notes: "GRI 201/204/303/305/306 disclosure feeds." },
      { name: "Ops Orchestrator", maps_to: "src/components/CommandCenter.tsx", notes: "Invite dispatch, sprint completion, auto-reporting." },
    ],
  },
  {
    id: "decisions",
    label: "Decisions",
    intro: "Disclosure quadrants, x402 settlement, fallback policy.",
    items: [
      { name: "Disclosure quadrants", maps_to: "src/lib/command-center.ts", notes: "NDA_RESTRICTED vs FULL_DISCLOSURE." },
      { name: "x402 settlement", maps_to: "src/lib/executive-workforce.ts", notes: "Daily caps, >0.50 USDC requires approval." },
      { name: "Provider fallback", maps_to: "supabase/functions/agent-invoke", notes: "Auto-switch Lovable → OpenAI on 402/429." },
    ],
  },
];
