// Media generation — image (Gemini Imagen) + video (queued job).
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { kind = "image", prompt, aspect_ratio = "16:9", event_code } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization") ?? "";
    const userResp = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const userId = userResp.data.user?.id ?? null;

    // Insert job row
    const { data: job, error: jobErr } = await supabase.from("media_jobs").insert({
      kind, prompt, aspect_ratio, status: "running", created_by: userId,
    }).select().single();
    if (jobErr) throw jobErr;

    if (kind === "video") {
      // Veo gated — keep queued, surface human-loop request
      await supabase.from("agent_requests").insert({
        kind: "approval",
        payload: { reason: "Video generation queued (Veo access pending)", job_id: job.id, prompt, event_code },
      });
      await supabase.from("media_jobs").update({ status: "queued", error: "Veo access pending" }).eq("id", job.id);
      return new Response(JSON.stringify({ status: "queued", job }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Image generation via Lovable Gateway (uses google/gemini-2.5-flash-image)
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    let imageB64: string | null = null;

    if (lovableKey) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (url?.startsWith("data:")) imageB64 = url.split(",")[1];
      }
    }

    // Fallback: Gemini direct (Imagen)
    if (!imageB64) {
      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiKey) throw new Error("No image provider available");
      const r = await fetch(`${GEMINI_BASE}/imagen-3.0-generate-002:predict?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: aspect_ratio },
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        await supabase.from("media_jobs").update({ status: "failed", error: txt.slice(0, 500) }).eq("id", job.id);
        throw new Error(`Imagen ${r.status}: ${txt}`);
      }
      const data = await r.json();
      imageB64 = data?.predictions?.[0]?.bytesBase64Encoded ?? null;
    }

    if (!imageB64) throw new Error("Image provider returned no bytes");

    // Upload to storage
    const bytes = Uint8Array.from(atob(imageB64), (c) => c.charCodeAt(0));
    const path = `${event_code ?? "general"}/${job.id}.png`;
    const { error: upErr } = await supabase.storage.from("social-media").upload(path, bytes, {
      contentType: "image/png", upsert: true,
    });
    if (upErr) throw upErr;

    const { data: signed } = await supabase.storage.from("social-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? null;

    await supabase.from("media_jobs").update({ status: "done", result_url: url }).eq("id", job.id);
    return new Response(JSON.stringify({ status: "done", job_id: job.id, url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
