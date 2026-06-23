import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "@/components/ui/sonner";

type Mode = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/command", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate("/command", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function checkAllowed(target: string) {
    if (target === "esgsportrive@gmail.com") return true;
    const { data } = await supabase.from("allowed_emails").select("email").eq("email", target).maybeSingle();
    return Boolean(data);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const target = email.trim().toLowerCase();
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(target, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent. Check your inbox.");
        setMode("signin");
        return;
      }
      if (!(await checkAllowed(target))) {
        toast.error("Email not on the access list. Ask the admin to add you.");
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: target,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/command`,
            data: { display_name: displayName || target.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your inbox to confirm if required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: target, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/command` });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background bg-console-grid p-6">
      <div className="w-full max-w-sm rounded-sm border border-console-line bg-command-surface p-6 shadow-console">
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Agent Tarkwa</p>
          <h1 className="mt-1 font-display text-2xl text-foreground">
            {mode === "signup" ? "Create access" : mode === "forgot" ? "Reset password" : "Operator sign-in"}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Allowlisted access. Admin authorises new emails from <span className="font-mono">/admin</span>.
          </p>
        </div>

        <div className="mb-4 flex gap-1 rounded-sm border border-console-line bg-console-sunken p-1 text-[10px] uppercase tracking-wider">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-sm px-2 py-1.5 transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email" required placeholder="you@authorised.org" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {mode === "signup" && (
            <input
              type="text" placeholder="Display name (optional)" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}
          {mode !== "forgot" && (
            <input
              type="password" required minLength={8} placeholder="Password (8+ chars)" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}
          <button disabled={busy} className="w-full rounded-sm bg-primary px-3 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            {busy ? "…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </button>
          {mode === "signin" && (
            <button type="button" onClick={() => setMode("forgot")} className="block w-full text-center text-xs text-muted-foreground underline">
              Forgot password?
            </button>
          )}
          {mode === "forgot" && (
            <button type="button" onClick={() => setMode("signin")} className="block w-full text-center text-xs text-muted-foreground underline">
              Back to sign in
            </button>
          )}
        </form>

        <div className="my-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-console-line" /> or <div className="h-px flex-1 bg-console-line" />
        </div>

        <button onClick={google} disabled={busy}
          className="w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm uppercase tracking-wider text-foreground hover:bg-muted disabled:opacity-50">
          Continue with Google
        </button>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs underline text-muted-foreground">Back to landing</Link>
        </div>
      </div>
    </div>
  );
}
