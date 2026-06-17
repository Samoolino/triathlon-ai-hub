import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

type Role = "admin" | "editor" | "actor" | "viewer";
type AllowRow = { email: string; role: Role; note: string | null; created_at: string };
type RoleRow = { user_id: string; role: Role; email?: string };

export default function Admin() {
  const { user, signOut } = useAuth();
  const [allowed, setAllowed] = useState<AllowRow[]>([]);
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [note, setNote] = useState("");

  async function load() {
    const [{ data: a }, { data: roles }] = await Promise.all([
      supabase.from("allowed_emails").select("email, role, note, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setAllowed((a ?? []) as AllowRow[]);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("id, email").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const emailMap = new Map((profs ?? []).map((p) => [p.id, p.email]));
    setRows((roles ?? []).map((r) => ({ ...r, role: r.role as Role, email: emailMap.get(r.user_id) ?? "" })));
  }
  useEffect(() => { load(); }, []);

  async function addAllowed() {
    if (!email.trim()) return;
    const { error } = await supabase.from("allowed_emails").insert({
      email: email.trim().toLowerCase(), role, note: note || null, invited_by: user?.id,
    });
    if (error) toast.error(error.message);
    else { toast.success(`Authorised ${email}`); setEmail(""); setNote(""); load(); }
  }

  async function removeAllowed(em: string) {
    const { error } = await supabase.from("allowed_emails").delete().eq("email", em);
    if (error) toast.error(error.message); else load();
  }

  async function revokeRole(user_id: string, r: Role) {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", r);
    if (error) toast.error(error.message); else load();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-console-line bg-console-sunken px-6 py-3">
        <Link to="/command" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Command
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">Admin Workspace</span>
        <button onClick={signOut} className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive">Sign out</button>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Signed in as</p>
          <h1 className="font-display text-2xl">{user?.email}</h1>
        </header>

        <section className="rounded-sm border border-console-line bg-command-surface p-4">
          <h2 className="font-display text-lg">Access list</h2>
          <p className="mt-1 text-xs text-muted-foreground">Only emails on this list can sign in. The default role applies the first time they authenticate.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_140px_1fr_auto]">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@org.com" className="rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm" />
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm">
              <option value="viewer">viewer</option><option value="actor">actor</option><option value="editor">editor</option><option value="admin">admin</option>
            </select>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note (optional)" className="rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm" />
            <button onClick={addAllowed} className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground">Authorise</button>
          </div>
          <ul className="mt-4 divide-y divide-console-line">
            {allowed.map((r) => (
              <li key={r.email} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs">{r.email}</span>
                <span className="rounded-sm bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">{r.role}</span>
                <span className="flex-1 px-3 text-xs text-muted-foreground truncate">{r.note}</span>
                <button onClick={() => removeAllowed(r.email)} className="font-mono text-[10px] uppercase tracking-wider text-destructive hover:underline">Revoke</button>
              </li>
            ))}
            {allowed.length === 0 && <li className="py-2 text-xs text-muted-foreground">No authorised emails.</li>}
          </ul>
        </section>

        <section className="rounded-sm border border-console-line bg-command-surface p-4">
          <h2 className="font-display text-lg">Active role assignments</h2>
          <ul className="mt-3 divide-y divide-console-line">
            {rows.map((r) => (
              <li key={`${r.user_id}-${r.role}`} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs">{r.email || r.user_id.slice(0, 8)}</span>
                <span className="rounded-sm bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">{r.role}</span>
                <button onClick={() => revokeRole(r.user_id, r.role)} className="font-mono text-[10px] uppercase tracking-wider text-destructive hover:underline">Revoke</button>
              </li>
            ))}
            {rows.length === 0 && <li className="py-2 text-xs text-muted-foreground">No assignments yet.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
