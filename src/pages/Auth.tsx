import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/components/ui/sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/command", { replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/command` },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate("/command", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/command`,
      });
      if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
      if (!r.redirected && !r.error) navigate("/command", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background bg-console-grid p-6">
      <div className="w-full max-w-sm rounded-sm border border-console-line bg-command-surface p-6 shadow-console">
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Agent Tarkwa</p>
          <h1 className="mt-1 font-display text-2xl text-foreground">Command access</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            disabled={busy}
            className="w-full rounded-sm bg-primary px-3 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={google}
          disabled={busy}
          className="mt-3 w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm uppercase tracking-wider text-foreground hover:bg-muted disabled:opacity-50"
        >
          Continue with Google
        </button>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="underline">
            {mode === "signin" ? "Need an account?" : "Have an account?"}
          </button>
          <Link to="/" className="underline">Back to landing</Link>
        </div>
      </div>
    </div>
  );
}
