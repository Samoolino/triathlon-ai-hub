import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

const PLATFORMS = ["x", "instagram", "linkedin", "facebook", "tiktok", "youtube"] as const;
type Platform = typeof PLATFORMS[number];

type Account = { id: string; event_code: string | null; platform: Platform; handle: string | null; status: string };
type Post = { id: string; event_code: string; kind: string; caption: string | null; generated_media_url: string | null; status: string; scheduled_at: string | null };

export default function SocialStudio() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"studio" | "accounts" | "schedule">("studio");

  // studio
  const [eventCode, setEventCode] = useState("JABI-LAKE-INVITE");
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState<"image" | "video" | "text">("image");
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  async function load() {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from("social_accounts").select("*").order("created_at", { ascending: false }),
      supabase.from("social_posts").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setAccounts((a ?? []) as Account[]);
    setPosts((p ?? []) as Post[]);
  }
  useEffect(() => { load(); }, []);

  async function generate() {
    if (!prompt.trim()) return;
    setBusy(true); setPreviewUrl(null); setCaption("");
    try {
      // 1. Caption via agent-invoke
      const capResp = await supabase.functions.invoke("agent-invoke", {
        body: {
          persona: "comms-liaison", stream: false,
          messages: [{ role: "user", content: `Write a punchy social caption + 5 relevant hashtags for event ${eventCode}. Brief: ${prompt}. Keep under 280 chars.` }],
        },
      });
      const capText = capResp.data?.choices?.[0]?.message?.content ?? "";
      setCaption(capText);

      // 2. Media
      if (kind !== "text") {
        const mResp = await supabase.functions.invoke("media-generate", {
          body: { kind, prompt, event_code: eventCode, aspect_ratio: "1:1" },
        });
        if (mResp.error) throw mResp.error;
        setPreviewUrl(mResp.data?.url ?? null);
        if (kind === "video" && mResp.data?.status === "queued") {
          toast.message("Video queued — Veo access pending. Operator will be notified.");
        }
      }
      toast.success("Content generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally { setBusy(false); }
  }

  async function schedule(at?: string) {
    if (!caption && !previewUrl) { toast.error("Generate content first"); return; }
    const { error } = await supabase.from("social_posts").insert({
      event_code: eventCode, kind, prompt, caption, generated_media_url: previewUrl,
      scheduled_at: at ?? null, status: at ? "scheduled" : "draft",
    });
    if (error) toast.error(error.message);
    else { toast.success("Saved to schedule board"); load(); }
  }

  async function requestAccount(platform: Platform) {
    const { error } = await supabase.from("social_accounts").insert({
      event_code: eventCode, platform, status: "requested",
    });
    if (error) toast.error(error.message);
    else {
      await supabase.from("agent_requests").insert({
        kind: "account-create",
        payload: { platform, event_code: eventCode, instruction: `Create or designate a ${platform} sub-account for event ${eventCode}, then link OAuth.` },
      });
      toast.success(`Requested ${platform} sub-account for ${eventCode}`);
      load();
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Social Force</p>
        <h2 className="font-display text-2xl">Content Studio & Account Operations</h2>
      </header>

      <nav className="mb-4 flex gap-2 border-b border-console-line">
        {(["studio", "accounts", "schedule"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 font-mono text-[11px] uppercase tracking-wider ${tab === t ? "border-b-2 border-accent text-accent" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </nav>

      {tab === "studio" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-sm border border-console-line bg-command-surface p-4 space-y-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Event code</span>
              <input value={eventCode} onChange={(e) => setEventCode(e.target.value)} className="mt-1 w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Kind</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="mt-1 w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm">
                <option value="image">image</option><option value="video">video (queued)</option><option value="text">text only</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Brief / prompt</span>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="mt-1 w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm" />
            </label>
            <button onClick={generate} disabled={busy} className="w-full rounded-sm bg-primary px-3 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-50">
              {busy ? "Generating…" : "Generate"}
            </button>
            {(caption || previewUrl) && (
              <button onClick={() => schedule()} className="w-full rounded-sm border border-accent/40 px-3 py-2 text-sm uppercase tracking-wider text-accent">
                Save to schedule board
              </button>
            )}
          </div>

          <div className="rounded-sm border border-console-line bg-command-surface p-4 min-h-[300px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Preview</p>
            {previewUrl && <img src={previewUrl} alt="generated" className="mt-3 max-h-72 rounded-sm border border-console-line" />}
            {caption && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{caption}</p>}
            {!caption && !previewUrl && <p className="mt-6 text-xs text-muted-foreground">Output will appear here.</p>}
          </div>
        </div>
      )}

      {tab === "accounts" && (
        <div className="space-y-4">
          <div className="rounded-sm border border-console-line bg-command-surface p-4">
            <p className="mb-3 text-xs text-muted-foreground">Request a per-event sub-account on any platform. The operator (admin) will create the account, then link OAuth via the connector flow.</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => requestAccount(p)} className="rounded-sm border border-console-line bg-console-sunken px-3 py-3 text-sm uppercase tracking-wider hover:border-accent">
                  Request {p}
                </button>
              ))}
            </div>
          </div>
          <ul className="rounded-sm border border-console-line bg-command-surface divide-y divide-console-line">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-mono text-xs uppercase">{a.platform}</span>
                <span className="text-xs text-muted-foreground">{a.event_code ?? "workspace"}</span>
                <span className="rounded-sm bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">{a.status}</span>
              </li>
            ))}
            {accounts.length === 0 && <li className="px-4 py-3 text-xs text-muted-foreground">No accounts yet.</li>}
          </ul>
        </div>
      )}

      {tab === "schedule" && (
        <ul className="rounded-sm border border-console-line bg-command-surface divide-y divide-console-line">
          {posts.map((p) => (
            <li key={p.id} className="grid grid-cols-[80px_1fr_120px_100px] items-center gap-3 px-4 py-3 text-sm">
              <span className="font-mono text-[10px] uppercase text-muted-foreground">{p.kind}</span>
              <span className="truncate">{p.caption ?? p.event_code}</span>
              <span className="text-xs text-muted-foreground">{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : "—"}</span>
              <span className="rounded-sm bg-accent/15 px-2 py-0.5 text-center font-mono text-[10px] uppercase tracking-wider text-accent">{p.status}</span>
            </li>
          ))}
          {posts.length === 0 && <li className="px-4 py-3 text-xs text-muted-foreground">No posts yet.</li>}
        </ul>
      )}
    </section>
  );
}
