// Tarkwa narrative synthesis — generates running commentary from recent events
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { signals = [], eventCode = "JABI-LAKE-INVITE" } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const prompt = [
      `Event: ${eventCode}.`,
      `Recent signals (JSON): ${JSON.stringify(signals).slice(0, 4000)}`,
      "",
      "Produce a 2–4 sentence tactical update from Agent Tarkwa's voice. Cite sources in [BRACKETS].",
      "Return JSON: { headline, body, citations: string[] }",
    ].join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are Tarkwa, lead guardian. Write terse, evidence-cited mission updates." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: txt }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { headline?: string; body?: string; citations?: string[] } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { headline: "Tarkwa update", body: raw }; }

    const { data: inserted, error } = await supabase
      .from("narrative_entries")
      .insert({
        event_code: eventCode,
        source: "tarkwa-synth",
        kind: "mission-update",
        headline: parsed.headline ?? "Mission pulse",
        body: parsed.body ?? "",
        citations: parsed.citations ?? [],
        meta: { signals_count: signals.length },
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ entry: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
