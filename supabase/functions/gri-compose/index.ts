// GRI disclosure composer — pulls events_log + corpus, asks model for per-code structured JSON.
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const GRI_CODES = [
  { code: "GRI-201-1", topic: "Direct economic value generated and distributed" },
  { code: "GRI-204-1", topic: "Proportion of spending on local suppliers" },
  { code: "GRI-303-3", topic: "Water withdrawal" },
  { code: "GRI-303-5", topic: "Water consumption" },
  { code: "GRI-305-1", topic: "Direct (Scope 1) GHG emissions" },
  { code: "GRI-305-2", topic: "Energy indirect (Scope 2) GHG emissions" },
  { code: "GRI-305-3", topic: "Other indirect (Scope 3) GHG emissions" },
  { code: "GRI-306-3", topic: "Waste generated" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { event_code = "JABI-LAKE-INVITE" } = await req.json().catch(() => ({}));
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: events } = await supabase.from("events_log").select("*").eq("event_code", event_code).order("created_at", { ascending: false }).limit(50);

    const prompt = [
      `Compose GRI disclosures for event: ${event_code}.`,
      `Recent events_log (JSON): ${JSON.stringify(events ?? []).slice(0, 4000)}`,
      "",
      "For EACH of the following GRI codes, emit one disclosure object:",
      GRI_CODES.map((c) => `- ${c.code}: ${c.topic}`).join("\n"),
      "",
      "Return JSON: { disclosures: [{ gri_code, status: 'draft'|'in-progress'|'terminal', disclosure_type: 'full'|'nda', value: { metric: any, unit?: string, method?: string }, narrative: string (1-2 sentences), citations: string[] }] }",
      "Use status='terminal' when event closeout signals are present, 'in-progress' during activation, else 'draft'. Mark disclosure_type='nda' for sponsor-restricted figures.",
    ].join("\n");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are ESG Controller. Output strict JSON, cite sources in brackets like [WT-Manual] or [GRI-305]." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!r.ok) throw new Error(`Model ${r.status}: ${await r.text()}`);
    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { disclosures?: Array<Record<string, unknown>> } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const disclosures = parsed.disclosures ?? [];

    const upserts = disclosures.map((d) => ({
      event_code,
      gri_code: String(d.gri_code ?? ""),
      status: (d.status as string) ?? "draft",
      disclosure_type: (d.disclosure_type as string) ?? "full",
      value: (d.value as object) ?? {},
      narrative: (d.narrative as string) ?? "",
      citations: Array.isArray(d.citations) ? d.citations as string[] : [],
    })).filter((d) => d.gri_code);

    if (upserts.length) {
      const { error } = await supabase.from("gri_disclosures").upsert(upserts, { onConflict: "event_code,gri_code" });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ event_code, count: upserts.length, disclosures: upserts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
