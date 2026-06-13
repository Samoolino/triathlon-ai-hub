import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { MASTER_CORPUS } from "@/lib/master-corpus";

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-console-line bg-console-sunken/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Agent Tarkwa</span>
        </div>
        <nav className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider">
          <Link to="/blueprint" className="text-muted-foreground hover:text-foreground">Blueprint</Link>
          <Link to="/command" className="text-muted-foreground hover:text-foreground">Command</Link>
          <Link to="/auth" className="rounded-sm bg-primary px-3 py-1.5 text-primary-foreground">Enter</Link>
        </nav>
      </header>

      <section
        ref={heroRef}
        className="relative isolate overflow-hidden border-b border-console-line"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx,50%) var(--my,40%), hsl(var(--accent) / 0.18), transparent 60%), linear-gradient(180deg, hsl(var(--console-sunken)), hsl(var(--background)))",
        }}
      >
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent">Enukukwak / Uniform Myth</p>
          <h1 className="mt-4 font-display text-5xl leading-tight sm:text-7xl">
            Agent Tarkwa
            <span className="block text-foreground/70 text-3xl sm:text-4xl mt-2">Jabi Lake's Guardian.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            An agentic workforce that mobilizes, executes, and narrates any initiated event — anchored to the
            World Triathlon manual, the TRI-X402 operating system, and GRI sustainability standards.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/command" className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground">
              Open command center <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/blueprint" className="inline-flex items-center gap-2 rounded-sm border border-console-line bg-console-sunken px-4 py-2.5 text-sm uppercase tracking-wider hover:bg-muted">
              <Sparkles className="h-4 w-4" /> Read the blueprint
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-hero-radar animate-scan-flow" />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl">Trained on the master corpus</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every agent reply cites these sources. Uncited claims are flagged.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MASTER_CORPUS.map((s) => (
            <article key={s.id} className="rounded-sm border border-console-line bg-command-surface p-4 transition hover:border-accent/40">
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">[{s.tag}]</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.origin}</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{s.title}</h3>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {s.sections.slice(0, 3).map((sec) => <li key={sec}>· {sec}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-console-line px-6 py-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        © Agent Tarkwa Command Center
      </footer>
    </main>
  );
}
