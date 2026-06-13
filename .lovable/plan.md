## Agent Tarkwa — AI Wiring + Command Center Upgrade

### 0. Security first (before any code)
- **Treat the OpenAI key you pasted as compromised.** Revoke it at https://platform.openai.com/api-keys.
- I will request a fresh `OPENAI_API_KEY` via Lovable's secure secret form (never via chat). It is stored server-side and only readable from edge functions — never bundled into client code.
- `LOVABLE_API_KEY` is auto-provisioned for Lovable AI Gateway (no action from you).

### 1. AI backbone — dual-provider router
- Enable **Lovable Cloud** (auth, DB, storage, edge functions).
- Edge function `supabase/functions/agent-invoke/index.ts`:
  - Default route: Lovable AI Gateway → `google/gemini-3-flash-preview` (chat/analysis), `google/gemini-2.5-pro` (deep reasoning), `openai/gpt-image-2` (images).
  - Fallback route: direct OpenAI when caller passes `provider: "openai"` or when gateway returns 402/429.
  - Streaming via AI SDK (`streamText` + `toUIMessageStreamResponse`), tool-calling enabled, `stopWhen: stepCountIs(50)`.
  - CORS + JWT validation via `getClaims()`.
- Edge function `supabase/functions/narrative-synth/index.ts`: pulls latest mission/task/GRI/x402 events, generates Tarkwa's running commentary, writes to `narrative_entries`.
- Frontend hook `src/hooks/useAgentChat.ts` wraps `useChat` against `/functions/v1/agent-invoke`.

### 2. Master-file ingestion (compliance training)
- New `src/lib/master-corpus.ts` exports typed canonical references:
  - `TRI_X402` — TRI-X402 Event Operating System
  - `TARKWA_ECOSYSTEM` — Agent Tarkwa Command Center Ecosystem
  - `TARKWA_CORE` — Agent Tarkwa.pdf
  - `WT_MANUAL` — World Triathlon Event Organisers' Manual (fetched from triathlon.org, cached)
  - `GRI_STANDARDS` — existing GRI 201/204/303/305/306 set (re-exported)
- Each source: `{ id, title, version, sections[], citations[], lastIndexed }`.
- Edge function `supabase/functions/corpus-ingest/index.ts` parses uploaded docs, chunks, generates embeddings via `google/gemini-embedding-001`, stores in `public.corpus_chunks` (pgvector).
- Every agent system prompt is prefixed with: *"Cite only from MASTER_CORPUS. If a claim is not grounded, mark it `[uncited]`."* + retrieved top-k chunks.

### 3. Routing & pages (non-static UX)
- React Router upgrade with these routes (existing engines preserved, just re-homed):
  - `/` Public landing — cinematic hero, spotlight mask on `mousemove`, 20-card 3D stack (GSAP+ScrollTrigger), Mission Pulse strip from `EventRuntime`, CTA → `/command`.
  - `/blueprint` Restyled blueprint explorer (5 tabs mapped to existing modules).
  - `/command/*` Authenticated console — current `Index.tsx` content split into sub-routes: overview, missions, gri, bd, x402, narrative.
  - `/admin` Gated to `esgsportrive@gmail.com` via `has_role(auth.uid(),'admin')`.
  - `/auth` Email+password + Google sign-in.
- `NarrativeFeed` component streams Tarkwa's commentary live (server-sent events from `narrative-synth`).

### 4. Backend schema (Lovable Cloud)
Tables with explicit `GRANT`s + RLS via `has_role()`:
- `profiles`, `user_roles` (enum: admin/editor/actor/viewer)
- `events`, `event_artifacts`, `missions`, `tasks`
- `corpus_chunks` (pgvector), `narrative_entries`
- `agent_invocations` (audit trail: provider, model, tokens, cost, run_id)
- `x402_settlements`

Trigger: auto-create profile on signup; auto-grant `admin` role only to `esgsportrive@gmail.com`.

### 5. Design system evolution
- HSL tokens in `index.css` (army-black palette, warm amber accent).
- Syne (display) + DM Sans (body) via Google Fonts.
- New keyframes already present (`sweep`, `pulse-glow`, `scan-flow`) — extended with `spotlight`, `card-stack-rise`.
- All existing components (`ExecutiveCommand`, `CommandCenter`, `GriAnalytics`, `BusinessDevelopment`) retained — wrapped, not replaced.

### Technical file map
```text
NEW
├── supabase/functions/agent-invoke/index.ts        # dual-provider AI router
├── supabase/functions/narrative-synth/index.ts     # Tarkwa commentary stream
├── supabase/functions/corpus-ingest/index.ts       # embed master files
├── supabase/functions/_shared/ai-gateway.ts        # provider helper
├── src/lib/master-corpus.ts                        # canonical reference index
├── src/lib/agent-blueprint.ts                      # blueprint→module map
├── src/hooks/useAgentChat.ts
├── src/hooks/useAuth.ts
├── src/pages/Landing.tsx                           # cinematic hero
├── src/pages/Blueprint.tsx
├── src/pages/Auth.tsx
├── src/pages/Admin.tsx
├── src/pages/CommandLayout.tsx                     # /command/* shell
├── src/components/NarrativeFeed.tsx
├── src/components/AgentChat.tsx
├── src/components/HeroSpotlight.tsx
├── src/components/CardStack3D.tsx
└── src/components/ProtectedRoute.tsx

EDITED
├── src/App.tsx                # Router + AuthProvider
├── src/pages/Index.tsx        # becomes /command index
├── src/index.css              # tokens + keyframes
└── tailwind.config.ts         # font families
```

### Out of scope (will not touch)
- Engine rewrites — `command-center.ts`, `executive-workforce.ts`, `business-development.ts`, `gri-framework.ts` stay as-is, only consumed.
- Real x402 on-chain settlement (still simulated).
- Third-party email/SMS.
- Payments.

### What I'll need from you mid-build
1. **Revoke the leaked OpenAI key**, then I'll trigger the secure secret form for the replacement.
2. Confirmation when prompted to enable Lovable Cloud.

Approve and I'll execute end-to-end.