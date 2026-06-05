// Executive Command Center — animated, non-static mission surface
// Implements directive: Lead Guardian + sub-agent orbit, mission lifecycle,
// embedded wallet/x402 panel, comm streams, department workspaces.
import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BadgeDollarSign, Briefcase, Building2,
  CheckCircle2, Coins, FlaskConical, Inbox, Leaf, Megaphone, MessageSquare,
  Radio, Send, ShieldCheck, Sparkles, Wallet, Workflow,
} from "lucide-react";
import {
  EXECUTIVE_WORKFORCE, createWallet, deptMetrics, deriveComms, deriveStage,
  executeX402, missionAgentName, missionCodename, relatedAgents,
  type CommMsg, type DeptId, type ExecAgent, type MissionStage, type WalletState,
} from "@/lib/executive-workforce";
import type { EventRuntime } from "@/lib/event-engine";

const deptIcon: Record<DeptId, any> = {
  guardian: ShieldCheck, "business-dev": Briefcase, innovation: FlaskConical,
  "esg-compliance": Leaf, operations: Workflow, finance: Coins,
};

const stageTone: Record<MissionStage, string> = {
  passive: "bg-state-infoBg text-state-info border-state-info/30",
  initiation: "bg-state-warningBg text-state-warning border-state-warning/30",
  active: "bg-state-stableBg text-state-stable border-state-stable/30",
  closeout: "bg-state-stableBg text-state-stable border-state-stable/30",
};

const Chip = ({ children, t = "info" }: { children: React.ReactNode; t?: string }) => {
  const m: Record<string, string> = {
    info: "bg-state-infoBg text-state-info border-state-info/30",
    green: "bg-state-stableBg text-state-stable border-state-stable/30",
    amber: "bg-state-warningBg text-state-warning border-state-warning/30",
    red: "bg-state-dangerBg text-state-danger border-state-danger/30",
  };
  return <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${m[t] || m.info}`}>{children}</span>;
};

export default function ExecutiveCommand({ rt }: { rt: EventRuntime | null }) {
  const eventId = rt?.spec.id || "PASSIVE";
  const code = missionCodename(eventId);
  const stage: MissionStage = deriveStage(rt);
  const metrics = useMemo(() => deptMetrics(rt), [rt]);
  const comms = useMemo(() => deriveComms(rt, eventId), [rt, eventId]);

  const [wallet, setWallet] = useState<WalletState>(() => createWallet(eventId));
  const [selectedDept, setSelectedDept] = useState<DeptId>("guardian");

  const triggerPay = (price: number, endpoint: string, agent: DeptId, approved = false) => {
    const { wallet: next } = executeX402(wallet, { endpoint, asset: "USDC", priceUSDC: price, agent, note: "x402 settlement" }, approved);
    setWallet(next);
  };

  return (
    <div className="space-y-5">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-console-line pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Executive Workforce Command Center</p>
          <h2 className="flex items-center gap-2 font-stencil text-lg">
            <Sparkles className="h-4 w-4 text-accent" /> {code}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${stageTone[stage]}`}>
            Lifecycle · {stage}
          </span>
          <Chip t="green">{EXECUTIVE_WORKFORCE.length} agents on roster</Chip>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Orbit visual */}
        <section className="lg:col-span-7 rounded-sm border border-console-line bg-console-sunken p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Workforce Orbit · live</p>
            <Chip t={stage === "active" ? "green" : "info"}>{stage === "passive" ? "passive readiness" : "active collaboration"}</Chip>
          </div>
          <Orbit metrics={metrics} stage={stage} onSelect={setSelectedDept} selected={selectedDept} />
        </section>

        {/* Wallet */}
        <section className="lg:col-span-5 rounded-sm border border-console-line bg-console-sunken p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Wallet className="mr-1 inline h-3 w-3" /> Embedded Wallet · Base + x402</p>
            <Chip t={wallet.spentTodayUSDC > wallet.dailyCapUSDC * 0.8 ? "amber" : "green"}>USDC</Chip>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">{wallet.address} · {wallet.network}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <KPI label="Balance" value={`${wallet.balanceUSDC.toFixed(2)}`} />
            <KPI label="Today" value={`${wallet.spentTodayUSDC.toFixed(2)}`} />
            <KPI label="Cap" value={`${wallet.dailyCapUSDC.toFixed(2)}`} />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-background">
            <div className="h-full bg-accent transition-all" style={{ width: `${Math.min(100, (wallet.spentTodayUSDC / wallet.dailyCapUSDC) * 100)}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <X402Btn label="Pull emissions feed · 0.10" onClick={() => triggerPay(0.10, "/x402/gri-305", "esg-compliance")} />
            <X402Btn label="Supply audit · 0.35" onClick={() => triggerPay(0.35, "/x402/supply-audit", "esg-compliance")} />
            <X402Btn label="Labor metrics · 0.65" onClick={() => triggerPay(0.65, "/x402/labor", "business-dev")} />
            <X402Btn label="Approve last · 0.65" onClick={() => triggerPay(0.65, "/x402/labor", "business-dev", true)} />
          </div>
          <div className="mt-3 max-h-32 overflow-auto rounded-sm border border-console-line bg-background/40 p-2">
            {wallet.history.length === 0 && <p className="font-mono text-[10px] text-muted-foreground">No transactions yet.</p>}
            {wallet.history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-console-line/60 py-1 font-mono text-[10px] last:border-0">
                <span className="text-muted-foreground">{tx.ts.slice(11, 19)} · {tx.endpoint}</span>
                <span className="flex items-center gap-2">
                  <span>{tx.amount.toFixed(2)} {tx.asset}</span>
                  <Chip t={tx.status === "settled" ? "green" : tx.status === "rejected" ? "red" : "amber"}>{tx.status}</Chip>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Department directory */}
        <section className="lg:col-span-12 rounded-sm border border-console-line bg-console-sunken p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Building2 className="mr-1 inline h-3 w-3" /> Department Directory</p>
            <Chip>{rt ? "mission engaged" : "passive workforce"}</Chip>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {EXECUTIVE_WORKFORCE.map((a) => {
              const m = metrics.find((x) => x.dept === a.id)!;
              const Icon = deptIcon[a.id];
              const active = selectedDept === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedDept(a.id)}
                  className={`group relative overflow-hidden rounded-sm border p-3 text-left transition ${active ? "border-accent bg-accent/10" : "border-console-line bg-background/40 hover:border-accent/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`grid h-7 w-7 place-items-center rounded-sm border ${active ? "border-accent text-accent" : "border-console-line text-muted-foreground"}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-stencil text-xs">{a.codename}</p>
                      <p className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{missionAgentName(eventId, a)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                    <Chip t={m.health}>{m.completionPct}%</Chip>
                    <span className="text-muted-foreground">{m.completed}/{m.ownedTasks}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dept workspace */}
        <section className="lg:col-span-12">
          <DeptWorkspace
            dept={EXECUTIVE_WORKFORCE.find((a) => a.id === selectedDept)!}
            metrics={metrics.find((m) => m.dept === selectedDept)!}
            rt={rt}
            comms={comms.filter((c) => c.from === selectedDept || c.to === selectedDept || c.to === "broadcast")}
            eventId={eventId}
            onX402={(p) => triggerPay(p, `/x402/${selectedDept}`, selectedDept)}
          />
        </section>

        {/* Comm stream */}
        <section className="lg:col-span-12 rounded-sm border border-console-line bg-console-sunken p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Radio className="mr-1 inline h-3 w-3" /> Cross-Agent Communication Stream</p>
            <Chip t="green">live</Chip>
          </div>
          <CommStream comms={comms} />
        </section>
      </div>
    </div>
  );
}

// ─── Orbit visual ──────────────────────────────────────────────────────────
function Orbit({ metrics, stage, onSelect, selected }: {
  metrics: ReturnType<typeof deptMetrics>;
  stage: MissionStage;
  onSelect: (d: DeptId) => void;
  selected: DeptId;
}) {
  const subs = EXECUTIVE_WORKFORCE.filter((a) => a.id !== "guardian");
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* sweep ring */}
      <div className="absolute inset-0 rounded-full border border-console-line/60" />
      <div className="absolute inset-6 rounded-full border border-console-line/40" />
      <div className="absolute inset-12 rounded-full border border-console-line/30" />
      <div className="absolute inset-0 animate-sweep rounded-full motion-reduce:animate-none" style={{
        background: "conic-gradient(from 0deg, transparent 80%, hsl(var(--console-glow) / 0.35) 95%, transparent 100%)",
      }} />
      {/* guardian */}
      <button onClick={() => onSelect("guardian")} className={`absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${selected === "guardian" ? "border-accent" : "border-accent/60"} bg-command-surface p-3 shadow-glow transition`}>
        <div className="grid h-10 w-10 place-items-center">
          <ShieldCheck className="h-5 w-5 text-accent" />
        </div>
        <p className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-stencil text-[10px] text-accent">Lead Guardian</p>
      </button>
      {/* sub-agents on orbit */}
      {subs.map((a) => {
        const m = metrics.find((x) => x.dept === a.id)!;
        const Icon = deptIcon[a.id];
        const rad = (a.orbitDeg * Math.PI) / 180;
        const r = 42; // percent radius
        const x = 50 + r * Math.cos(rad);
        const y = 50 + r * Math.sin(rad);
        const pulse = stage === "active" && m.inFlight > 0;
        return (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-background p-2 transition ${selected === a.id ? "border-accent scale-110" : "border-console-line hover:border-accent/60"} ${pulse ? "animate-pulse-glow" : ""}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            title={a.codename}
          >
            <Icon className={`h-4 w-4 ${m.health === "red" ? "text-state-danger" : m.health === "amber" ? "text-state-warning" : "text-state-stable"}`} />
            <p className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase text-muted-foreground">{a.codename.split(" ")[0]}</p>
          </button>
        );
      })}
      {/* connector lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {subs.map((a) => {
          const rad = (a.orbitDeg * Math.PI) / 180;
          const x = 50 + 42 * Math.cos(rad);
          const y = 50 + 42 * Math.sin(rad);
          const m = metrics.find((x) => x.dept === a.id)!;
          return (
            <line key={a.id} x1={50} y1={50} x2={x} y2={y}
              stroke={`hsl(var(--console-line) / ${m.inFlight > 0 ? 0.8 : 0.4})`} strokeWidth={0.3}
              strokeDasharray={m.inFlight > 0 ? "1.5 1" : "0.5 1"} />
          );
        })}
      </svg>
    </div>
  );
}

// ─── Department Workspace (Dashboard · Actions · Reports · Comms) ─────────
function DeptWorkspace({ dept, metrics, rt, comms, eventId, onX402 }: {
  dept: ExecAgent; metrics: ReturnType<typeof deptMetrics>[number];
  rt: EventRuntime | null; comms: CommMsg[]; eventId: string;
  onX402: (price: number) => void;
}) {
  const [tab, setTab] = useState<"dashboard" | "actions" | "reports" | "comms">("dashboard");
  const Icon = deptIcon[dept.id];
  const owned = (rt?.tasks || []).filter((t) => dept.ownsTaskClasses.includes(t.taskClass));
  const live = relatedAgents(rt, dept.id);

  const tabs: Array<[typeof tab, string, any]> = [
    ["dashboard", "Dashboard", Activity],
    ["actions", "Actions Center", Send],
    ["reports", "Reports Center", Inbox],
    ["comms", "Comms Center", MessageSquare],
  ];

  return (
    <div className="rounded-sm border border-console-line bg-console-sunken p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-sm border border-accent/50 bg-background text-accent">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-stencil text-base">{missionAgentName(eventId, dept)}</h3>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{dept.role}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {tabs.map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${tab === k ? "border-accent bg-accent/15 text-accent" : "border-console-line bg-background/40 text-muted-foreground hover:text-foreground"}`}>
              <I className="h-3 w-3" /> {l}
            </button>
          ))}
        </div>
      </div>

      {tab === "dashboard" && (
        <div className="grid gap-3 md:grid-cols-4">
          <KPI label="Owned tasks" value={String(metrics.ownedTasks)} />
          <KPI label="Completed" value={String(metrics.completed)} />
          <KPI label="In-flight" value={String(metrics.inFlight)} />
          <KPI label="Blocked" value={String(metrics.blocked)} />
          <div className="md:col-span-4 rounded-sm border border-console-line bg-background/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Mandate</p>
            <p className="mt-1 text-sm">{dept.mandate}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Live workforce on theatre · {live.length}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {live.slice(0, 8).map((ag) => (
                <span key={ag.id} className="rounded-sm border border-console-line bg-console-sunken px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{ag.name}</span>
              ))}
              {live.length === 0 && <span className="font-mono text-[10px] text-muted-foreground">no field agents bound</span>}
            </div>
          </div>
        </div>
      )}

      {tab === "actions" && (
        <div className="grid gap-2">
          <ActionRow icon={Megaphone} label={`Activate ${dept.codename} cohort`} hint="Lead Guardian directive" />
          <ActionRow icon={BadgeDollarSign} label="Settle x402 data feed · 0.10 USDC" hint="auto-settle within daily cap" onClick={() => onX402(0.10)} />
          <ActionRow icon={BadgeDollarSign} label="Settle x402 high-value · 0.65 USDC" hint="will request human approval" onClick={() => onX402(0.65)} />
          <ActionRow icon={CheckCircle2} label="Run QA pass on owned tasks" hint={`${metrics.ownedTasks} bound`} />
          {dept.ownsGriModules?.length ? (
            <ActionRow icon={Leaf} label={`Refresh GRI modules: ${dept.ownsGriModules.join(", ")}`} hint="real-time emissions / labor pull" />
          ) : null}
        </div>
      )}

      {tab === "reports" && (
        <div className="grid gap-2">
          {owned.filter((t) => t.state === "completed").slice(-5).reverse().map((t) => (
            <div key={t.id} className="rounded-sm border border-console-line bg-background/40 p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-accent">{t.id}</span>
                <Chip t="green">filed</Chip>
              </div>
              <p className="mt-1 text-xs">{t.title}</p>
              {t.output && <p className="mt-1 font-mono text-[10px] text-state-stable">▸ {t.output}</p>}
            </div>
          ))}
          {owned.filter((t) => t.state === "completed").length === 0 && (
            <p className="font-mono text-[10px] text-muted-foreground">No filed reports. Advance the engine to produce dept outputs.</p>
          )}
        </div>
      )}

      {tab === "comms" && <CommStream comms={comms} />}
    </div>
  );
}

function ActionRow({ icon: Icon, label, hint, onClick }: { icon: any; label: string; hint: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between rounded-sm border border-console-line bg-background/40 px-3 py-2 text-left transition hover:border-accent/60">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-sm">{label}</span>
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{hint} →</span>
    </button>
  );
}

function CommStream({ comms }: { comms: CommMsg[] }) {
  if (!comms.length) return <p className="font-mono text-[10px] text-muted-foreground">No traffic yet. Activate a mission to populate the channel.</p>;
  return (
    <div className="max-h-72 space-y-1 overflow-auto">
      {comms.map((c) => (
        <div key={c.id} className="flex items-start gap-2 rounded-sm border border-console-line bg-background/30 p-2 animate-fade-up">
          <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">{c.ts.slice(11, 19)}</span>
          <Chip t={c.kind === "alert" ? "red" : c.kind === "directive" ? "amber" : c.kind === "settle" ? "info" : "green"}>{c.kind}</Chip>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.from} → {c.to}</span>
          <p className="flex-1 text-xs">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-console-line bg-background/40 p-2 text-center">
      <div className="font-stencil text-lg">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function X402Btn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-sm border border-console-line bg-background/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:border-accent/60 hover:text-accent">
      <AlertTriangle className="mr-1 inline h-3 w-3" /> {label}
    </button>
  );
}
