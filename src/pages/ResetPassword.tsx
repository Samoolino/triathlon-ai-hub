import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      navigate("/command", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background bg-console-grid p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-sm border border-console-line bg-command-surface p-6 shadow-console">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Agent Tarkwa</p>
        <h1 className="font-display text-2xl text-foreground">Set new password</h1>
        <input type="password" required minLength={8} placeholder="New password (8+ chars)" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm text-foreground" />
        <button disabled={busy} className="w-full rounded-sm bg-primary px-3 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-50">
          {busy ? "…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
