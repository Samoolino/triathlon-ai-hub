import { Link } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Index from "./Index";
import AgentChat from "@/components/AgentChat";
import NarrativeFeed from "@/components/NarrativeFeed";
import SocialStudio from "@/components/SocialStudio";
import GriComposer from "@/components/GriComposer";

export default function CommandLayout() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-console-line bg-console-sunken/95 px-4 py-2 backdrop-blur">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
          ← Agent Tarkwa
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{user?.email}</span>
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-1 rounded-sm border border-accent/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
              <Shield className="h-3 w-3" /> Admin
            </Link>
          )}
          <button onClick={signOut} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive">
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
      </header>

      <Index />

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-4 lg:grid-cols-2">
          <NarrativeFeed />
          <AgentChat />
        </div>
      </section>
    </div>
  );
}
