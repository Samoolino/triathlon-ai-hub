// Agent Tarkwa — tri-provider AI router (Lovable Gateway → OpenAI → Gemini fallback)
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const PERSONAS: Record<string, { codename: string; mandate: string }> = {
  "tarkwa-lead": { codename: "Tarkwa — Lead Guardian", mandate: "Coordinate sub-agents. Synthesize cross-domain status. Defend the Uniform Myth narrative. Cite master corpus." },
  "bd-strategist": { codename: "BD & Innovation Strategist", mandate: "Curate corporate leads, validate product viability, connect cost/revenue to delivery plans. Reference TRI-X402 BD playbook." },
  "comms-liaison": { codename: "Active Comms & Stakeholder Liaison", mandate: "Dispatch invitations, manage civic + corporate clusters, track stage-gates (Drafted → Dispatched → Confirmed). Generate social copy with hashtags." },
  "ops-orchestrator": { codename: "Ops Orchestrator", mandate: "Run sprints S0–S8 against the World Triathlon Event Organisers' Manual. Track evidence EV-001..EV-012." },
  "esg-controller": { codename: "ESG Controller", mandate: "Enforce GRI 201/204/303/305/306 disclosures on every output. Flag uncited claims." },
  "finance-custodian": { codename: "Finance Custodian", mandate: "Govern x402 settlements (daily caps, >0.50 USDC approval). Reconcile funding gaps." },
};

const CORPUS = [
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
    "AUTHORITATIVE SOURCES (cite by tag like [TRI-X402], [WT-Manual], [GRI-305]):",
    CORPUS.map((c, i) => `  ${i + 1}. ${c}`).join("\n"),
    "",
    "RULES:",
    "- Every factual claim must include a citation tag. Mark ungrounded claims as [uncited].",
    "- Be concise and tactical. Bullet points / tables welcome.",
    "- Reference sprint codes (S0–S8), evidence IDs (EV-001..EV-012), persona codenames.",
    "- Default event context: invite triathlon (Jabi Lake). Framework is generic — apply to any initiated event.",
    extra ?? "",
  ].join("\n");
}

async function callOpenAICompat(url: string, key: string, body: Record<string, unknown>, stream: boolean) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ ...body, stream }),
  });
}

async function callGemini(messages: Array<{ role: string; content: string }>, model: string) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const resp = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
      contents,
      generationConfig: { temperature: 0.4 },
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${txt}`);
  }
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return text;
}

function geminiToSSE(text: string) {
  const encoder = new TextEncoder();
  const chunks = [
    `data: ${JSON.stringify({ choices: [{ delta: { role: "assistant", content: text } }] })}\n\n`,
    `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`,
    `data: [DONE]\n\n`,
  ];
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages = [], persona = "tarkwa-lead", model, stream = true, extraSystem } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const fullMessages = [{ role: "system", content: systemPrompt(persona, extraSystem) }, ...messages];
    const body = { model: model ?? "google/gemini-3-flash-preview", messages: fullMessages, temperature: 0.4 };

    // 1. Lovable Gateway
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    let resp: Response | null = null;
    if (lovableKey) {
      resp = await callOpenAICompat(LOVABLE_URL, lovableKey, body, stream);
      if (resp.ok) {
        return new Response(stream ? resp.body : JSON.stringify(await resp.json()), {
          headers: { ...corsHeaders, "Content-Type": stream ? "text/event-stream" : "application/json", "Cache-Control": "no-cache" },
        });
      }
      console.warn("[agent-invoke] Lovable failed", resp.status);
    }

    // 2. OpenAI fallback
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (openaiKey) {
      const r = await callOpenAICompat(OPENAI_URL, openaiKey, { ...body, model: "gpt-4o-mini" }, stream);
      if (r.ok) {
        return new Response(stream ? r.body : JSON.stringify(await r.json()), {
          headers: { ...corsHeaders, "Content-Type": stream ? "text/event-stream" : "application/json", "Cache-Control": "no-cache" },
        });
      }
      console.warn("[agent-invoke] OpenAI failed", r.status);
    }

    // 3. Gemini direct fallback (non-streaming, wrapped as SSE if needed)
    const text = await callGemini(fullMessages, "gemini-2.5-flash");
    if (stream) {
      return new Response(geminiToSSE(text), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }
    return new Response(JSON.stringify({ choices: [{ message: { role: "assistant", content: text } }] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
