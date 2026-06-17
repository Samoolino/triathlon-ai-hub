import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

type Disclosure = {
  id: string; event_code: string; gri_code: string; status: string;
  disclosure_type: string; value: Record<string, unknown>; narrative: string | null;
  citations: string[]; updated_at: string;
};

export default function GriComposer() {
  const [eventCode, setEventCode] = useState("JABI-LAKE-INVITE");
  const [rows, setRows] = useState<Disclosure[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("gri_disclosures").select("*").eq("event_code", eventCode).order("gri_code");
    setRows((data ?? []) as Disclosure[]);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [eventCode]);

  async function compose() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("gri-compose", { body: { event_code: eventCode } });
      if (error) throw error;
      toast.success(`Composed ${data?.count ?? 0} disclosures`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Compose failed");
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-sm border border-console-line bg-command-surface p-4">
      <div className="mb-3 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">ESG Controller</p>
          <h3 className="font-display text-lg">GRI Disclosure Composer</h3>
        </div>
        <div className="flex items-end gap-2">
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Event</span>
            <input value={eventCode} onChange={(e) => setEventCode(e.target.value)} className="mt-1 rounded-sm border border-console-line bg-console-sunken px-3 py-1.5 text-sm" />
          </label>
          <button onClick={compose} disabled={busy} className="rounded-sm bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-50">
            {busy ? "Composing…" : "Compose disclosures"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-console-line">
              <th className="py-2 pr-3 font-mono uppercase tracking-wider">Code</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wider">Status</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wider">Type</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wider">Narrative</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wider">Citations</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-console-line/50 align-top">
                <td className="py-2 pr-3 font-mono">{d.gri_code}</td>
                <td className="py-2 pr-3"><span className={`rounded-sm px-2 py-0.5 font-mono text-[9px] uppercase ${d.status === "terminal" ? "bg-emerald-500/15 text-emerald-400" : d.status === "in-progress" ? "bg-amber-500/15 text-amber-400" : "bg-muted/30 text-muted-foreground"}`}>{d.status}</span></td>
                <td className="py-2 pr-3"><span className={`font-mono text-[9px] uppercase ${d.disclosure_type === "nda" ? "text-destructive" : "text-accent"}`}>{d.disclosure_type}</span></td>
                <td className="py-2 pr-3 text-foreground">{d.narrative}</td>
                <td className="py-2 pr-3 text-muted-foreground">{d.citations.join(", ")}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No disclosures yet. Click "Compose" to generate.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
