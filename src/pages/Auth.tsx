import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/command", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate("/command", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/command`, shouldCreateUser: true },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Sign-in link sent. Check your inbox.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg.includes("not authorised") ? "Email not on the access list. Ask admin to add you." : msg);
    } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/command` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background bg-console-grid p-6">
      <div className="w-full max-w-sm rounded-sm border border-console-line bg-command-surface p-6 shadow-console">
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Agent Tarkwa</p>
          <h1 className="mt-1 font-display text-2xl text-foreground">Allowlisted access</h1>
          <p className="mt-2 text-xs text-muted-foreground">Enter your authorised email. We'll send a one-time sign-in link — no password.</p>
        </div>

        {sent ? (
          <div className="rounded-sm border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">
            Link sent to <span className="font-mono">{email}</span>. Open it from this device to enter command.
            <button onClick={() => setSent(false)} className="mt-3 text-xs underline text-muted-foreground">Use a different email</button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <input
              type="email" required placeholder="you@authorised.org" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button disabled={busy} className="w-full rounded-sm bg-primary px-3 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
              {busy ? "…" : "Send sign-in link"}
            </button>
          </form>
        )}

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
