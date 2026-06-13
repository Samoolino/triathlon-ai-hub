import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";

type Role = "admin" | "editor" | "actor" | "viewer";
type Row = { user_id: string; role: Role; email?: string };

export default function Admin() {
  const { user, signOut } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");

  async function load() {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("id, email").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const emailMap = new Map((profs ?? []).map((p) => [p.id, p.email]));
    setRows((roles ?? []).map((r) => ({ ...r, role: r.role as Role, email: emailMap.get(r.user_id) ?? "" })));
  }
  useEffect(() => { load(); }, []);

  async function grant() {
    const { data: prof } = await supabase.from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
    if (!prof) { toast.error("No profile with that email — they must sign up first."); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: prof.id, role });
    if (error) toast.error(error.message); else { toast.success(`Granted ${role}`); setEmail(""); load(); }
  }

  async function revoke(user_id: string, r: Role) {
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

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Signed in as</p>
          <h1 className="font-display text-2xl">{user?.email}</h1>
        </header>

        <section className="rounded-sm border border-console-line bg-command-surface p-4">
          <h2 className="font-display text-lg">Grant role</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="flex-1 min-w-[220px] rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm" />
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-sm border border-console-line bg-console-sunken px-3 py-2 text-sm">
              <option value="viewer">viewer</option>
              <option value="actor">actor</option>
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
            <button onClick={grant} className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground">Grant</button>
          </div>
        </section>

        <section className="rounded-sm border border-console-line bg-command-surface p-4">
          <h2 className="font-display text-lg">Active assignments</h2>
          <ul className="mt-3 divide-y divide-console-line">
            {rows.map((r) => (
              <li key={`${r.user_id}-${r.role}`} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs">{r.email || r.user_id.slice(0, 8)}</span>
                <span className="rounded-sm bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">{r.role}</span>
                <button onClick={() => revoke(r.user_id, r.role)} className="font-mono text-[10px] uppercase tracking-wider text-destructive hover:underline">Revoke</button>
              </li>
            ))}
            {rows.length === 0 && <li className="py-2 text-xs text-muted-foreground">No assignments.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
