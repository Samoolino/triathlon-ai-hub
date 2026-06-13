import { useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MASTER_CORPUS } from "@/lib/master-corpus";

type Msg = { role: "user" | "assistant"; content: string };

const PERSONAS = [
  { id: "tarkwa-lead", label: "Tarkwa — Lead" },
  { id: "bd-strategist", label: "BD Strategist" },
  { id: "comms-liaison", label: "Comms Liaison" },
  { id: "ops-orchestrator", label: "Ops Orchestrator" },
  { id: "esg-controller", label: "ESG Controller" },
  { id: "finance-custodian", label: "Finance Custodian" },
];

export default function AgentChat({ defaultPersona = "tarkwa-lead" }: { defaultPersona?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [persona, setPersona] = useState(defaultPersona);
  const [provider, setProvider] = useState<"lovable" | "openai">("lovable");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-invoke`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, persona, provider, stream: true }),
      });

      if (!resp.ok || !resp.body) {
        const txt = await resp.text();
        setMessages([...next, { role: "assistant", content: `⚠ ${resp.status}: ${txt.slice(0, 200)}` }]);
        return;
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMessages([...next, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]" || !data) continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }
          } catch { /* ignore parse errors on partial chunks */ }
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-sm border border-console-line bg-command-surface shadow-console">
      <div className="flex items-center gap-2 border-b border-console-line bg-console-sunken px-3 py-2">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Agent console</span>
        <div className="ml-auto flex items-center gap-2">
          <select value={persona} onChange={(e) => setPersona(e.target.value)} className="rounded-sm border border-console-line bg-console px-2 py-1 text-[11px] font-mono">
            {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select value={provider} onChange={(e) => setProvider(e.target.value as "lovable" | "openai")} className="rounded-sm border border-console-line bg-console px-2 py-1 text-[11px] font-mono">
            <option value="lovable">Lovable AI</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 text-sm space-y-3">
        {messages.length === 0 && (
          <div className="rounded-sm border border-dashed border-console-line p-3 text-xs text-muted-foreground">
            Ask Tarkwa. Every reply cites: {MASTER_CORPUS.map((s) => `[${s.tag}]`).join(" ")}.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-foreground" : "text-foreground/90"}>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.role === "user" ? "You" : "Tarkwa"}
            </div>
            <div className="whitespace-pre-wrap rounded-sm border border-console-line bg-console-sunken/60 p-2 leading-relaxed">{m.content || "…"}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-console-line p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Brief Tarkwa…"
          disabled={busy}
          className="flex-1 rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button onClick={send} disabled={busy || !input.trim()} className="rounded-sm bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
