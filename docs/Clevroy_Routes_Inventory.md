# Clevroy Frontend — Routes Inventory & Design Intent

The canonical map of every URL in the app: what's there, what's missing, and what each one is for. Pair with `CLAUDE.md` (layer model), `docs/Clevroy_UI_Design_System.md` §7 (page specs), and `docs/Clevroy_Chat_Surface.md` (chat contract).

Last updated: 2026-04-28. Status legend:

- ✅ **Shipped** — code present, design intent met, ready to demo.
- 🟡 **Scaffolded** — file exists, structure correct, content is fixture / placeholder. Layers behind it not yet wired.
- 🟠 **Partial** — some sections done, others missing.
- ❌ **Missing** — link target referenced in code but route doesn't exist (404 today).
- 🚫 **Out of scope v1** — by design, not building yet.

---

## How to read this doc

Each route has a fixed shape:

> **Path** — file. **Status**. *Purpose in one line.*
>
> **On the page today** — concrete bullets of what renders.
> **What's missing** — gaps to reach "complete."
> **Layer dependencies** — what backend/AI work is needed.
> **Open questions** — decisions that haven't been made.

When iterating section-by-section, work from this doc top to bottom. The order matches user journey: landing → onboarding → home → thread → projects → settings → edge cases.

---

## Section 1 — Public (unauthenticated)

### `/` — Landing
**File**: `app/page.tsx`. **Status**: 🟠 Partial.
*The marketing surface for new visitors. First contact with the brand.*

**On the page today (26 lines):**
- Centered headline "Your script. On screen. Now."
- Sub-line "Watch your story shoot itself."
- Two CTAs: `Start your film` → `/onboarding`, `Sign in` → `/sign-in` (404).
- `bg-background` page, no shell.

**What's missing:**
- A hero asset (looping video / scene-strip animation / poster grid). Today the page is two lines and two buttons — feels like a placeholder.
- Below-the-fold storytelling: 2–3 sections explaining what Clevroy does (scripts → films, AI Twin, take it home).
- Footer with brand, terms, privacy, social.
- Auth-state awareness: if the user already has a session, redirect to `/home` (today the page renders the same for everyone).

**Layer dependencies:**
- Layer 5 + auth ships `/sign-in` so the second CTA stops 404'ing.

**Open questions:**
- Is this also the marketing site, or is `clevroy.com` separate from `app.clevroy.com`? If separate, this route is the auth-gated app entry and only exists for redirects → simplify to a single redirect-to-`/onboarding`-or-`/home`.

---

### `/sign-in` — Sign in
**File**: ❌ doesn't exist. **Status**: ❌ Missing.
*Authentication entry point.*

**Referenced from:**
- `app/page.tsx:21` — landing CTA.

**Required content:**
- Email + password (or magic-link / OAuth — TBD with auth provider).
- "Forgot password" affordance.
- "New here? Start your film" → `/onboarding`.
- Brand frame matching `/` landing.

**Layer dependencies:**
- Auth provider decision (Supabase, Clerk, NextAuth, Stack). The Backend_Handoff and Chat_Surface specs assume Supabase auth.

**Open questions:**
- Magic-link vs password vs OAuth-first? Decision lives upstream.

---

### `/sign-out` — Sign out
**File**: ❌ doesn't exist. **Status**: ❌ Missing.
*Sign-out endpoint.*

**Referenced from:**
- `src/components/nav/ProfileChip.tsx:88` — "Sign out" dropdown item routes here.
- The dropdown wraps the click in an EC-N4 confirm dialog when a film is in progress.

**Required content:**
- Server-side route that clears auth cookies / session and redirects to `/`.
- Should this be a route or a server action? Probably a server action (`async function signOut() { ... }`) — no UI needed.

**Layer dependencies:**
- Auth provider.

---

### `/onboarding` — Onboarding flow
**File**: `app/onboarding/page.tsx` + `app/onboarding/layout.tsx`. **Status**: ✅ Shipped (but unverified end-to-end).
*Two-screen first-run experience for new accounts.*

**On the page today (427 lines):**
- Step 1 — theme picker ("Pick a look"). Dark / light preview cards.
- Step 2 — start ("You have 5 free films to start"). Faux scene-strip animation. CTA → `/create` (which redirects to `/home`).

**What's missing:**
- Voice/face twin teaser? Spec mentions reserving real estate. May or may not belong on onboarding.
- "Skip to Home" routing — currently `Maybe later` exists. Check it works.
- AI Twin onboarding option is currently absent.

**Layer dependencies:**
- Layer 5 — record `onboarding_completed_at` on the profile when step 2 finishes. Today it's local-only.

**Open questions:**
- Is onboarding shown only on first sign-in (gated by `onboarding_completed_at`), or every time the user lands on `/onboarding` directly? Today the route is freely accessible.

---

## Section 2 — Authenticated app shell

These all live under `app/(app)/` and inherit the `<RoundedShell>` + `<AppSidebar>` + (mobile) `<BottomTabBar>` chrome from `app/(app)/layout.tsx`.

### `/home` — Chat surface (empty mode)
**File**: `app/(app)/(chat)/home/page.tsx`. **Status**: ✅ Shipped.
*The centralized generation entry point. The user's primary canvas.*

**On the page today:**
- Welcome line (Fraunces, type-on, time-of-day, in-progress redirect link).
- `<PromptInput>` from AI Elements with `Take 1` slate, FilmstripGauge cost chip, AspectToggle, CmdEnterHint, Roll button.
- StyleChips (Cinematic / Documentary / Noir / Animated).
- Rotating storyboard suggestion cards (12-prompt pool, 3 visible, 8s rotation, accent-tinted by genre).
- "Surprise me" pill.
- "Previously" strip (recent film titles, Fraunces italic, desktop only).
- Mobile: bottom-anchored input with safe-area + backdrop-blur.
- `<Atmosphere />` ambient cinematic chrome (Letterbox, Timecode, CueMarks, Grain).

**What's missing:**
- Voice input / mic affordance — reserved per spec §11, not wired.
- Attach (paperclip) for script file upload — reserved.
- 1/2/3 keyboard shortcuts to fill suggestion cards.
- Footer hint on focus ("Enter to send · Shift+Enter for newline").

**Layer dependencies:**
- Layer 4 wires `useChat` to the AI Gateway. Today submit fires `mintFilm` (fixture) and routes.
- Layer 5 wires real `POST /api/films` mint.

**Open questions:**
- Does the StyleChips selection get pre-pended to the user's prompt at submit time, or stay structured metadata? Today it's local UI state with no consumer.

---

### `/films/[id]` — Chat surface (thread mode)
**File**: `app/(app)/(chat)/films/[id]/page.tsx` + `(chat)/layout.tsx`. **Status**: ✅ Shipped (Layer 3 fixture-driven).
*The film's birth and the film's home. Same surface as /home, post-submit.*

**On the page today:**
- Bottom-anchored `<PromptInput>` with all the same chrome (cost chip, aspect, style, Roll).
- Scrollable message thread above input.
- Message types via `<MessageRenderer />` dispatch:
  - `UserMessage` — right-aligned bubble + attachment chips
  - `NarrationMessage` — Fraunces italic, muted→foreground crossfade
  - `ActivityMessage` — mono timestamp + muted text, ≤1 per 3s throttle via `compactActivities`
  - `SystemMessage` — centered badge
  - `SceneImageCard` — 16:9 still + AssetOverflow ("Reshoot" / "View characters")
  - `ScenePlaybackCard` — autoplay-muted desktop, mobile tap-to-play, first-unmute Fraunces tooltip, 44×44 unmute button
  - `CharacterRefCard` — stagger-fade portrait grid
  - `AssemblyPreviewCard` — Phase 5 surprise
  - `FinalFilmCard` — 2:3 poster + Watch button + brand-verb overflow
- Phase walker (`usePhaseWalker`) drives the six-phase fixture timeline (~30s compressed).
- Idempotency gate: walker only fires when no narration exists → reload mid-run preserves state.

**What's missing:**
- Action handlers on AssetOverflow menus (Reshoot, Take it home, Keep it, Delete it) are no-ops. **Layer 4** wires these to the AI SDK tool router; **Layer 5** wires to backend mutations.
- Real LLM-driven refinement — typing "make scene 3 darker" doesn't do anything yet. Layer 4.
- Real backend persistence — refresh works because of localStorage; cross-device doesn't. Layer 5.
- Catch-up endpoint (`GET /api/films/[id]/messages?since=…`) for reconnect after offline window. Layer 5.
- Heartbeat indicator next to "Clevroy" identity during silences (Risk 2 mitigation).
- Take counter — "Take 1" is hardcoded; should derive from refinement count.

**Layer dependencies:**
- Layers 4 + 5.

**Open questions:**
- Where does the reshoot confirm dialog live — global modal, in-card, or inline in the thread? Today no UI.
- When the walker completes, does the input switch to "refinement mode" with different placeholder copy? Spec §4.4 says yes.

---

### `/create` — Redirect
**File**: `app/(app)/(chat)/create/page.tsx`. **Status**: ✅ Shipped.
*Compatibility redirect — `/create` used to be the form-shaped flow; now it just redirects to `/home`.*

**On the page today:**
- `redirect('/home')`. Nothing else.

**What's missing:**
- Nothing. Designed to be invisible.

---

### `/projects` — Films archive
**File**: `app/(app)/projects/page.tsx`. **Status**: ✅ Shipped (Layer 5 hooks pending).
*"Your reel." All films, searchable, filterable.*

**On the page today (630 lines):**
- Search bar with 350ms debounce.
- Sort select (Newest / Oldest / Title).
- Status filter toggle group (All / Shooting / Complete / Didn't render).
- `<FilmCardGrid />` infinite list — `useInfiniteFilms` with cursor pagination.
- Empty states: `<NoFilmsEmptyState />` (zero films), `<ProjectsEmptyState />` (zero results from filter).
- 3-second "still loading" swap.
- FilmCard overflow menu: Rename / Duplicate / Delete (with EC-N9 confirm).

**What's missing:**
- Bulk actions (multi-select to delete several films) — out of scope v1?
- Visual treatment for in-progress films within the grid — they show a "Shooting" badge but no pulse / live preview.
- The "Still loading" copy needs to render consistently in fixture mode.

**Layer dependencies:**
- Layer 5 swaps fixtures for real `GET /api/films` cursor pagination.
- Real `DELETE`, `PATCH (rename)`, `POST (duplicate)` mutations.

**Open questions:**
- Are duplicates a thing? UI exists; semantics in the backend spec aren't fully nailed down.

---

### `/ai-twin` — Voice + face twin training
**File**: `app/(app)/ai-twin/page.tsx`. **Status**: 🟡 Scaffolded.
*Personal training surface — record your voice, upload your face, train the twins, use them in films.*

**On the page today (516 lines):**
- Two cards side-by-side (stacked on mobile): voice + face.
- Voice — record / playback / delete (no real audio API yet).
- Face — drag-drop 5–10 photos with click-to-upload fallback (CC-3).
- Training progress UI (state: none / training / ready / failed).
- EC-N10 failure UX: warning banner, "Try again" preserves upload, "Start over" clears, third failure unlocks help modal.

**What's missing:**
- Real microphone capture (MediaRecorder API).
- Real upload-to-R2 (signed URL flow).
- Real training poll (currently fixture-driven).
- Reference portrait preview (face only — once training completes, show the canonical portrait).
- "Use in next film" toggle — pin a voice or face to the next mint.

**Layer dependencies:**
- Layer 5 — `useTwins`, `useVoiceTwinUploadUrl`, `useFaceTwinUploadUrl`, `useStartVoiceTwin`, `useStartFaceTwin`.
- R2 signed-URL upload contract from Backend_Handoff.

**Open questions:**
- Is voice training a one-shot (record once, submit, done) or iterative (record, listen, re-record)? Today UI suggests one-shot.
- Multiple voice / face twins per account? Today single-of-each.

---

### `/settings` — Settings index
**File**: `app/(app)/settings/page.tsx`. **Status**: ✅ Shipped.
*`redirect('/settings/account')`. The bare URL goes to first sub-section.*

---

### `/settings/account` — Account
**File**: `app/(app)/settings/account/page.tsx` (220 lines). **Status**: 🟡 Scaffolded.
*Email, password, display name, profile photo, account deletion.*

**Required content:**
- Display name + first name (editable).
- Email (read-only display + "Change email" flow).
- Password change (current + new + confirm).
- Avatar upload.
- "Delete account" with `confirmVerbPairs.deleteAccount` confirm.

**Layer dependencies:**
- Layer 5 — profile mutations + auth provider account-delete endpoint.

---

### `/settings/billing` — Billing
**File**: `app/(app)/settings/billing/page.tsx` (252 lines). **Status**: 🟡 Scaffolded.
*Buy films, view invoices, manage payment method.*

**Required content:**
- Current balance (NUMERIC(8,2) string, never coerced).
- Buy more films CTA → checkout flow (Stripe Checkout? — spec assumes so).
- Recent invoices list.
- "Manage payment method" → Stripe customer portal.
- Note: "credits" word is allowed *only* on invoice line items per Brand_Guide §5.3 — everywhere else say "films."

**Layer dependencies:**
- Stripe / payment-provider integration. Layer 5+.

**Open questions:**
- Is there a subscription tier or only one-time film packs? Spec implies packs.

---

### `/settings/preferences` — Preferences
**File**: `app/(app)/settings/preferences/page.tsx` (144 lines). **Status**: 🟡 Scaffolded.
*Theme, reduced motion, default aspect, default style preset.*

**Required content:**
- Theme radio (Light / Dark / System).
- Reduced-motion toggle (mirrors `prefers-reduced-motion`).
- Default aspect ratio (currently lives in `create-options-store`).
- Default style preset.
- Language? Not yet defined.

**Layer dependencies:**
- These are mostly client-side preferences — already wired to ui-store / create-options-store. Layer 5 syncs them to the profile so they cross devices.

---

### `/settings/notifications` — Notifications
**File**: `app/(app)/settings/notifications/page.tsx` (123 lines). **Status**: 🟡 Scaffolded.
*Email + push notification preferences.*

**Required content:**
- Film-ready email toggle.
- Film-error email toggle.
- Marketing email toggle (separate by GDPR convention).
- Push notifications (Capacitor — only on native shell).

**Layer dependencies:**
- Layer 5 + email provider integration.
- Capacitor push setup for native.

---

### `/settings/developer` — Developer (advanced)
**File**: `app/(app)/settings/developer/page.tsx` (181 lines). **Status**: 🟡 Scaffolded.
*Power-user surface — feature flags, fixture toggle, API key management.*

**Required content:**
- Toggle for `NEXT_PUBLIC_USE_HARDCODED` (today env-only).
- Feature flags (none today; reserved for Layer 4 toggles).
- Personal API key generation (if Clevroy ships an API).
- Webhook endpoints.

**Layer dependencies:**
- Most of this is post-MVP. v1 may just expose the fixture toggle for QA.

**Open questions:**
- Is this hidden behind a hidden URL fragment / staff flag in production? Likely yes.

---

### `/settings/about` — About
**File**: `app/(app)/settings/about/page.tsx` (85 lines). **Status**: 🟠 Partial.
*Build version, legal links.*

**On the page today:**
- App version (hardcoded — should read from `package.json` at build).
- Links to `/terms`, `/privacy`, `/licenses`, `/help` (all 404 today).

**What's missing:**
- Real version source (env var injected at build, or `process.env.npm_package_version`).
- The four legal pages don't exist yet.

---

### `/settings/help` — Help
**File**: ❌ doesn't exist. **Status**: ❌ Missing.
*Contextual help / FAQ / contact support.*

**Referenced from:**
- `src/components/nav/ProfileChip.tsx:152` — "Help" dropdown item.

**Required content:**
- FAQ accordion.
- Email support link.
- Link to `/docs` (also missing).
- Link to status page if one exists.

---

## Section 3 — Edge / utility routes

### `/error.tsx` — Route error boundary
**File**: `app/error.tsx` (52 lines). **Status**: ✅ Shipped.
*Catches uncaught render/data errors.*

**On the page today:**
- "This page didn't load." headline.
- "Try again" button (calls `reset`).
- "Back to home" link to `/home`.

**What's missing:**
- Sentry / error-tracking integration call (probably already wired in `useEffect`).

---

### `/not-found.tsx` — App-level 404
**File**: `app/not-found.tsx` (27 lines). **Status**: ✅ Shipped.
*Catches unknown routes.*

**On the page today:**
- "We couldn't find that page."
- "Back to home" CTA.

**Note:** Distinct from EC-N8 deep-link 404 for `/films/[id]` — that lives in the films page itself with a contextual message.

---

### `/docs` — Documentation
**File**: ❌ doesn't exist. **Status**: ❌ Missing.
*Public-facing product docs.*

**Referenced from:**
- `src/components/nav/Sidebar.tsx:326` — Sidebar Documentation item.

**Open questions:**
- Is this an in-app surface, or a separate Notion / Mintlify / GitBook? If external, swap the sidebar link to the external URL and don't ship a route.

---

### `/terms`, `/privacy`, `/licenses`, `/help` — Legal & help
**File**: ❌ none exist. **Status**: ❌ Missing.
*Standard legal surfaces.*

**Referenced from:**
- `app/(app)/settings/about/page.tsx:47-71`.

**Open questions:**
- Static MDX inside the app, or external pages on `clevroy.com/terms`? Probably external — the app shouldn't host TOS revisions.

---

## Section 4 — Cross-cutting UI surfaces (not routes, but every route inherits them)

### App sidebar (desktop / tablet)
**File**: `src/components/nav/Sidebar.tsx`.

**Items:** Home · Projects · New film (was "Create") · AI Twin · Settings.
- Recent films collapsible group (5 items, "New" dot for unseen).
- Resources group (Feedback mailto, Documentation `/docs` ❌).
- Footer: `<FilmBalanceBadge />` (compact in collapsed rail) + `<ProfileChip />`.

**Mobile:** opens as a Sheet via the `md:hidden` SidebarTrigger in the inset top header.

### Bottom tab bar (mobile only)
**File**: `src/components/nav/BottomTabBar.tsx`.

**Items:** Home · Projects · Create (elevated red circle) · AI Twin · Settings.
- Hidden on `/home`, `/create`, `/films/*` so the chat input owns the bottom edge.
- First-three-opens hint glow on Create per EC-N1.
- Keyboard-aware: slides offscreen when soft keyboard opens.

### Profile chip dropdown
**File**: `src/components/nav/ProfileChip.tsx`.

**Items:** Theme picker (Light / Dark / System) · Help (`/settings/help` ❌) · Sign out (`/sign-out` ❌, EC-N4 confirm gate when film in progress).

### Modals / dialogs
- `<ConfirmDialog>` — generic confirm with `confirmVerbPairs` registry.
- Delete film dialog ("Delete this film?" / "Keep it" / "Delete it").
- Cancel-generation dialog ("Stop?" / "Keep going" / "Stop").
- Sign-out-during-generation dialog (EC-N4).
- Delete-account dialog.
- Reshoot scene dialog (Layer 4 wires it).

### Toasts
**File**: `src/components/shell/ResponsiveToaster.tsx` + `globalToasts` in copy.ts.
- Film ready / Film error / Film refunded / In-progress navigation / Reconnected / Connection lost.

---

## Section 5 — What's next, prioritized

If working route-by-route to maximize "ready to demo," this is the order I'd take:

1. **`/home` + `/films/[id]`** — already ✅ at the fixture layer. **Done for visual review.** Layer 4/5 needed for real generation, but the design is validated.
2. **Landing `/`** — currently 26 lines. Highest visibility, lowest content. Either build out (hero + below-fold sections + footer) or reduce to a redirect if marketing lives at `clevroy.com`.
3. **`/sign-in` + `/sign-out`** — both 404 today. Required before any real user can use the app. Auth provider decision blocks this.
4. **`/projects`** — already 🟡 substantial. Visual review pass: in-progress film treatment, FilmCard details, search/filter UX. Layer 5 swaps fixtures.
5. **`/onboarding`** — 🟡 already 427 lines. Visual review for flow + EC-N5 (session-restoration after redirect).
6. **`/ai-twin`** — 🟡 substantial scaffold. Highest design-density route after the chat surface; needs careful review of the failure-mode (EC-N10) UX.
7. **Settings sub-tree** — six routes, all 🟡. Each is a small surface; treat as a single design pass rather than six separate ones. Order: Account → Preferences → Billing → Notifications → About → Developer.
8. **`/settings/help`** — ❌ missing. Block on a content decision (FAQ vs contact form vs both).
9. **Edge/legal** — `/terms`, `/privacy`, `/licenses`, `/help`, `/docs`. Block on the "in-app vs marketing-site" decision.

**Routes that should not be touched until backend lands**: anything requiring real auth (`/sign-in`, `/sign-out`), anything requiring real mutations (account delete, password change, twin training, billing checkout). Everything else can be polished on fixtures.

---

## How to add a new route to this doc

When a new route is added to `app/`:

1. Append it to the right section (Public / App / Settings / Edge).
2. Set Status (`✅` / `🟡` / `🟠` / `❌` / `🚫`).
3. Fill the four bullets: On the page today / What's missing / Layer dependencies / Open questions.
4. If it gets referenced from elsewhere in the codebase, add the reference paths under "Referenced from."
5. Bump the `Last updated` date at the top.

This doc is the source of truth for "is this surface ready?" Pair it with `Clevroy_Testing_And_Flags.md` for the "is the underlying state correct?" answer.
