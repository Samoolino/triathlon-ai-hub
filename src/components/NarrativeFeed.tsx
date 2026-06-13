import { useEffect, useState } from "react";
import { Radio, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Entry = {
  id: string;
  event_code: string | null;
  source: string;
  kind: string;
  headline: string;
  body: string | null;
  citations: string[];
  created_at: string;
};

export default function NarrativeFeed({ eventCode = "JABI-LAKE-INVITE" }: { eventCode?: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("narrative_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setEntries((data ?? []) as Entry[]);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("narrative")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "narrative_entries" }, (p) => {
        setEntries((e) => [p.new as Entry, ...e].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function synth() {
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/narrative-synth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          eventCode,
          signals: [
            { kind: "sprint", code: "S3", status: "active" },
            { kind: "evidence", id: "EV-004", status: "verified" },
            { kind: "bd-lead", company: "Sample Corp", stage: "validation" },
          ],
        }),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-sm border border-console-line bg-command-surface p-4 shadow-console">
      <header className="mb-3 flex items-center gap-2">
        <Radio className="h-4 w-4 text-state-stable animate-pulse-glow" />
        <h3 className="font-display text-lg">Narrative feed</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{eventCode}</span>
        <button onClick={synth} disabled={busy} className="ml-auto inline-flex items-center gap-1 rounded-sm border border-console-line bg-console-sunken px-2 py-1 text-[11px] uppercase tracking-wider hover:bg-muted disabled:opacity-50">
          <RefreshCcw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`} /> Synthesize
        </button>
      </header>
      <div className="space-y-2 max-h-[420px] overflow-auto">
        {entries.length === 0 && (
          <p className="rounded-sm border border-dashed border-console-line p-3 text-xs text-muted-foreground">
            No entries yet. Hit Synthesize to have Tarkwa write a mission pulse.
          </p>
        )}
        {entries.map((e) => (
          <article key={e.id} className="rounded-sm border border-console-line bg-console-sunken/60 p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent">{e.source}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{e.kind}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</span>
            </div>
            <h4 className="mt-1 text-sm font-semibold text-foreground">{e.headline}</h4>
            {e.body && <p className="mt-1 text-xs leading-relaxed text-foreground/85">{e.body}</p>}
            {e.citations?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {e.citations.map((c, i) => (
                  <span key={i} className="rounded-sm border border-console-line bg-console px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{c}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
