// Master corpus — canonical analytical sources. Every agent output cites these.
// Edit titles/sections as new versions are uploaded.

export type CorpusSource = {
  id: string;
  tag: string; // citation token, e.g. [TRI-X402]
  title: string;
  origin: "uploaded" | "public-web";
  url?: string;
  version: string;
  sections: string[];
  compliance: string[];
};

export const MASTER_CORPUS: CorpusSource[] = [
  {
    id: "tri-x402",
    tag: "TRI-X402",
    title: "TRI-X402 Event Operating System",
    origin: "uploaded",
    version: "2026.06",
    sections: [
      "Persona & sprint orchestration (S0–S8)",
      "Evidence ladder EV-001..EV-012",
      "x402 settlement loop & wallet caps",
      "Disclosure quadrants (NDA / Full)",
    ],
    compliance: ["x402", "GRI-aligned"],
  },
  {
    id: "tarkwa-ecosystem",
    tag: "Tarkwa-Eco",
    title: "Agent Tarkwa Command Center Ecosystem",
    origin: "uploaded",
    version: "2026.06",
    sections: [
      "Lead Guardian hierarchy",
      "Mission lifecycle (passive → initiation → active → closeout)",
      "Inter-agent comm stream",
      "Narrative continuity rules",
    ],
    compliance: ["Internal SOP"],
  },
  {
    id: "tarkwa-core",
    tag: "Tarkwa-Core",
    title: "Agent Tarkwa — Core Brief",
    origin: "uploaded",
    version: "2026.06",
    sections: [
      "Uniform Myth doctrine",
      "Jabi Lake invite triathlon seed scenario",
      "Generic event ingest contract",
    ],
    compliance: ["Brand & Voice"],
  },
  {
    id: "wt-manual",
    tag: "WT-Manual",
    title: "World Triathlon Event Organisers' Manual",
    origin: "public-web",
    url: "https://www.triathlon.org/about/downloads/category/event_organisers_manual",
    version: "Current edition",
    sections: [
      "Course design & safety",
      "Officials & technical rules",
      "Athlete services & medical",
      "Anti-doping & integrity",
    ],
    compliance: ["World Triathlon Competition Rules"],
  },
  {
    id: "gri-suite",
    tag: "GRI",
    title: "GRI Standards (201, 204, 303, 305, 306)",
    origin: "public-web",
    url: "https://www.globalreporting.org/standards/",
    version: "2021–2024 set",
    sections: [
      "GRI 201 — Economic Performance",
      "GRI 204 — Procurement Practices",
      "GRI 303 — Water & Effluents",
      "GRI 305 — Emissions",
      "GRI 306 — Waste",
    ],
    compliance: ["GRI"],
  },
];

export const CORPUS_TAGS = MASTER_CORPUS.map((s) => s.tag);

export function findSource(idOrTag: string) {
  const k = idOrTag.toLowerCase();
  return MASTER_CORPUS.find(
    (s) => s.id === k || s.tag.toLowerCase() === k,
  );
}
