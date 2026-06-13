// Agent Tarkwa — dual-provider AI router (Lovable Gateway primary, OpenAI fallback)
// Streams chat completions. Persona + master-corpus citations injected server-side.
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const PERSONAS: Record<string, { codename: string; mandate: string }> = {
  "tarkwa-lead": {
    codename: "Tarkwa — Lead Guardian",
    mandate:
      "Coordinate sub-agents. Synthesize cross-domain status. Defend the Uniform Myth narrative. Cite master corpus.",
  },
  "bd-strategist": {
    codename: "BD & Innovation Strategist",
    mandate:
      "Curate corporate leads, validate product viability, connect cost/revenue to delivery plans. Reference TRI-X402 BD playbook.",
  },
  "comms-liaison": {
    codename: "Active Comms & Stakeholder Liaison",
    mandate:
      "Dispatch invitations, manage civic + corporate clusters, track stage-gates (Drafted → Dispatched → Confirmed).",
  },
  "ops-orchestrator": {
    codename: "Ops Orchestrator",
    mandate:
      "Run sprints S0–S8 against the World Triathlon Event Organisers' Manual. Track evidence EV-001..EV-012.",
  },
  "esg-controller": {
    codename: "ESG Controller",
    mandate:
      "Enforce GRI 201/204/303/305/306 disclosures on every output. Flag uncited claims.",
  },
  "finance-custodian": {
    codename: "Finance Custodian",
    mandate:
      "Govern x402 settlements (daily caps, >0.50 USDC approval). Reconcile funding gaps.",
  },
};

const CORPUS_CITATIONS = [
  "TRI-X402 Event Operating System (uploaded)",
  "Agent Tarkwa Command Center Ecosystem (uploaded)",
  "Agent Tarkwa Core Brief (uploaded)",
  "World Triathlon Event Organisers' Manual (triathlon.org)",
  "GRI Standards 201, 204, 303, 305, 306",
];

function systemPrompt(personaId: string, extra?: string) {
  const p = PERSONAS[personaId] ?? PERSONAS["tarkwa-lead"];
  return [
    `You are ${p.codename}, a sub-agent of the Agent Tarkwa Command Center.`,
    `Mandate: ${p.mandate}`,
    "",
    "AUTHORITATIVE SOURCES (cite by short tag in brackets, e.g. [TRI-X402], [WT-Manual], [GRI-305]):",
    CORPUS_CITATIONS.map((c, i) => `  ${i + 1}. ${c}`).join("\n"),
    "",
    "RULES:",
    "- Every factual claim must include a citation tag. Mark ungrounded claims as [uncited].",
    "- Be concise and tactical. Use bullet points and tables.",
    "- Reference sprint codes (S0–S8), evidence IDs (EV-001..EV-012), and persona codenames where relevant.",
    "- Default event context: invite triathlon (Jabi Lake). The framework is generic — apply same logic to any initiated event.",
    extra ?? "",
  ].join("\n");
}

async function callProvider(
  provider: "lovable" | "openai",
  body: Record<string, unknown>,
  stream: boolean,
): Promise<Response> {
  if (provider === "lovable") {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    return fetch(LOVABLE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ ...body, stream }),
    });
  }
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  // Translate model name for direct OpenAI calls
  const model = String(body.model ?? "").startsWith("openai/")
    ? String(body.model).replace("openai/", "")
    : "gpt-4o-mini";
  return fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ ...body, model, stream }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const {
      messages = [],
      persona = "tarkwa-lead",
      provider = "lovable",
      model,
      stream = true,
      extraSystem,
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalModel =
      model ??
      (provider === "openai" ? "openai/gpt-4o-mini" : "google/gemini-3-flash-preview");

    const body = {
      model: finalModel,
      messages: [
        { role: "system", content: systemPrompt(persona, extraSystem) },
        ...messages,
      ],
      temperature: 0.4,
    };

    // Primary attempt
    let resp = await callProvider(provider as "lovable" | "openai", body, stream);

    // Auto-fallback Lovable -> OpenAI on 402/429
    if (provider === "lovable" && (resp.status === 402 || resp.status === 429)) {
      if (Deno.env.get("OPENAI_API_KEY")) {
        resp = await callProvider("openai", { ...body, model: "openai/gpt-4o-mini" }, stream);
      }
    }

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: txt, status: resp.status }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!stream) {
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream SSE straight through
    return new Response(resp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
