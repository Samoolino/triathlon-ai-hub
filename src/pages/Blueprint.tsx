import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BLUEPRINT_TABS } from "@/lib/agent-blueprint";

export default function Blueprint() {
  const [active, setActive] = useState(BLUEPRINT_TABS[0].id);
  const tab = BLUEPRINT_TABS.find((t) => t.id === active)!;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-console-line bg-console-sunken px-6 py-3">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Home
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">Blueprint Explorer</span>
        <Link to="/command" className="rounded-sm bg-primary px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-primary-foreground">
          Open command
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl">AI Agent System Blueprint</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A traversable map between the architecture document and the modules in this workspace.
        </p>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-console-line">
          {BLUEPRINT_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`-mb-px border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-wider ${
                active === t.id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <section className="mt-6">
          <p className="text-sm text-muted-foreground">{tab.intro}</p>
          <div className="mt-4 space-y-3">
            {tab.items.map((it) => (
              <article key={it.name} className="rounded-sm border border-console-line bg-command-surface p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">{it.name}</h3>
                  <code className="font-mono text-[11px] text-accent">{it.maps_to}</code>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{it.notes}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
