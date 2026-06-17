## Agent Tarkwa — Access, Gemini Fallback, GRI Enrichment, Social Force

Scope: evolve the existing Command Center. Keep current routes, schemas, and personas. No rewrites.

---

### 1. Passwordless allowlist access

- Add `allowed_emails` table: `email citext primary key, invited_by uuid, role app_role default 'viewer', note text, created_at`. Admin-only insert/update/delete; `select` allowed to authenticated.
- Trigger on `auth.users` insert: if `lower(email)` not in `allowed_emails` and not `esgsportrive@gmail.com`, raise an exception so signup fails cleanly.
- Update `handle_new_user` to read the allowlist row and apply its `role` (fallback `viewer`).
- Auth page `/auth` becomes magic-link only (email field + "Send sign-in link"). Calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: /command, shouldCreateUser: true } })`. Password UI removed. Google button kept but post-sign-in we check allowlist client-side and `signOut()` + toast if not allowed (defence-in-depth; trigger is the source of truth).
- Admin page gains an **Access list** panel: add email + role, list, revoke. Wired to `allowed_emails`.

### 2. Gemini API key as fallback

- Store the pasted key as secret `GEMINI_API_KEY` (Google AI Studio key, format `AQ.…`).
- Extend `supabase/functions/agent-invoke/index.ts`: existing Lovable→OpenAI fallback chain extended to a 3-tier ladder — Lovable Gateway → OpenAI (if `OPENAI_API_KEY`) → Google Generative Language API (`https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?key=GEMINI_API_KEY`) using `gemini-2.5-flash`. Translates OpenAI-style messages → Gemini `contents` and streams back as SSE chunks shaped like OpenAI deltas so the client stays unchanged.
- New `supabase/functions/media-generate/index.ts`: takes `{ kind: "image"|"video", prompt, aspect_ratio }`. Image → Gemini `imagen-3.0-generate` (or `imagegen-3` fallback) via Generative Language API with the same key; returns base64 PNG and uploads to a new public storage bucket `social-media`. Video → returns 202 + queued row (Veo access often gated); persisted in `media_jobs` so we can swap in Veo when accessible.

### 3. GRI report engine

- New table `gri_disclosures`: `event_code, gri_code (e.g. GRI-305-1), status (draft|in-progress|terminal), disclosure_type (full|nda), value jsonb, narrative text, citations text[], updated_by, updated_at`. RLS: editors+admins write, viewers read.
- New `gri_external_facts` cache table: `key, source (sheet|web|corpus), payload jsonb, fetched_at` so repeat lookups are cheap.
- New edge function `gri-compose`: pipeline = (a) pull rows from `events_log` for the event, (b) don't read the official Sheet (`1txzB76DTcWI03ddIOPdSLuD62FFN56ORHiyVyIwWzQE`) yet via the Google Sheets connector gateway, (c) optional web search for emission factors / water tariffs (only when value missing), (d) ask the model to emit per-GRI-code JSON keyed by `GRI-201-1`, `GRI-204-1`, `GRI-303-3/5`, `GRI-305-1/2/3`, `GRI-306-3`, each with `{ value, unit, method, citations[], nda: bool, status }`. Upsert into `gri_disclosures`.
- `GriAnalytics` page gets a "Compose disclosures" button + status badges (Draft / In-progress / Terminal) and NDA chips.
- User action required during build: don't link the **Google Sheets** connector yet(workspace-owner OAuth) so the function can not read the master sheet.

### 4. Social media force (human-in-the-loop OAuth)

- New tables:
  - `social_accounts`: `id, event_code (nullable = workspace-wide), platform (x|instagram|linkedin|facebook|tiktok|youtube), handle, status (requested|pending_oauth|connected|revoked), connection_id (nullable), requested_by, created_at`.
  - `social_posts`: `id, event_code, account_id, kind (image|video|text), prompt, generated_media_url, caption, scheduled_at, status (draft|scheduled|posted|failed), approval_state, created_by`.
  - `agent_requests`: `id, kind (oauth-link|account-create|approval), payload jsonb, status (open|fulfilled|dismissed), assignee_email, created_at` — generic human-loop inbox.
- New page `/command/social`:
  - **Accounts** tab: per-platform cards. When agent needs an account it inserts an `agent_requests` row of kind `account-create`; the card surfaces a "Connect &nbsp;" CTA that opens the platform's official signup, then a "Mark connected & link OAuth" flow that links the matching connector (X, LinkedIn, Instagram Graph, etc.) via `standard_connectors--connect` at build time. At runtime, posting uses connector gateway URLs.
  - **Content studio**: form (event, platform set, brief). Calls `media-generate` for image/video and `agent-invoke` (persona `comms-liaison`) for caption + hashtags. Preview grid, edit, then "Schedule" → row in `social_posts`.
  - **Schedule board**: timeline view grouped by event + platform.
- New edge function `social-publish` (cron every 5 min via pg_cron): pulls due `social_posts`, posts via the linked connector gateway, writes back `status` + remote URL. Failures move to `agent_requests` as `approval` items.
- Per-event flow: when a mission's "initiation" stage fires (existing `events_log` event), `narrative-synth` creates one `agent_requests` row per platform asking the human operator to authorise the event's dedicated sub-account.

### 5. Frontend wiring

- `useAuth.ts`: add `roles` already present; expose `allowedEmails` query for admins.
- `AgentChat.tsx`: unchanged contract, will transparently benefit from Gemini fallback.
- New `src/lib/social-platforms.ts` and `src/lib/gri-codes.ts` for the typed code tables used in UI.
- New components: `AllowlistManager`, `SocialAccountCard`, `ContentStudio`, `ScheduleBoard`, `GriDisclosureTable`.

### 6. Security & memory

- `GEMINI_API_KEY` stored as backend secret, never sent to client.
- Magic-link auth — disable email/password sign-ups in `configure_auth` (`disable_signup: true` is too strict; instead we rely on the allowlist trigger so signup is open at API but rejected when email not pre-approved).
- Save memory: "Access is allowlist-driven via `allowed_emails`; admin `esgsportrive@gmail.com` manages access from /admin."

---

### Sequencing during build

1. Migration: `allowed_emails`, `gri_disclosures`, `gri_external_facts`, `social_accounts`, `social_posts`, `agent_requests`, `media_jobs`, storage bucket `social-media`, signup trigger.
2. Add `GEMINI_API_KEY` secret (secure form).
3. Extend `agent-invoke` with Gemini fallback; create `media-generate`, `gri-compose`, `social-publish`.
4. Rebuild `/auth` to magic-link only; add `AllowlistManager` to `/admin`.
5. Add `/command/social` and GRI compose button on `/command/gri`.
6. don't Link Google Sheets connector; surface "don't Connect " CTAs that link the relevant connectors when the user is ready.
7. Schedule `social-publish` cron via `pg_cron` + `pg_net`.

### Out of scope

- Building bespoke OAuth flows for platforms without an existing Lovable connector (we surface a human-loop request instead).
- Real Veo video rendering until access is confirmed — stub returns a queued job.
- On-chain x402 settlement (still simulated).