# Clevroy Page → Component Inventory

Per-page breakdown of (a) what's mounted today, (b) what's missing, and (c) which shadcn primitive replaces any hand-roll. Cross-references `Clevroy_Layout_Enhancements.md` (A.1–A.15, B.16–B.30) and `Clevroy_UI_Design_System.md §7` (page specs) and `§8` (centralized generation).

Three columns mental model for every page:

- **Has** — components currently mounted in the page file.
- **Missing** — components named in the design system or layout-enhancements doc that aren't yet wired.
- **Wrong primitive** — places where a custom element should be a shadcn one.

---

## Global (root + app shell)

### `app/layout.tsx` — root

- **Has:** `Toaster` (sonner), `TooltipProvider`, `QueryProvider`, `ThemeSync`, `themeInitScript`, font wiring (Inter / Fraunces / JetBrains Mono).
- **Missing:** none for v1.
- **Notes:** Toaster is `position="bottom-right"` globally — see B.27 (toast position by viewport).

### `app/(app)/layout.tsx` — authenticated shell

- **Has:** `RoundedShell`, `AppSidebar`, `SidebarInset`, `BottomTabBar`.
- **Missing:** `SidebarTrigger` for mobile (B.17 — sidebar destinations are unreachable on phones today). Wire `BottomTabBar.hidden` from route segments (B.19 — currently the prop exists but is never set).
- **Wrong primitive:** —

---

## Public + auth-adjacent

### `/` — landing (`app/page.tsx`)

- **Has:** shadcn `Button`, `Link`.
- **Missing per Design_System §6:** hero with the live generation loop (the centralized-generation differentiator video), feature triplet, social proof, footer with `/terms` + `/privacy` links. The landing is currently a placeholder.
- **Wrong primitive:** —

### `/onboarding` — first-run

- **Has:** custom `OnboardingProgress`, `Button`, framer-motion `AnimatePresence`, `useReducedMotion`.
- **Missing (the three jobs onboarding should do, per the brand-guide differentiator):**
  1. Centralized-generation teaser (muted loop + one Fraunces phase line) — shadcn `AspectRatio`.
  2. Twin sample capture (voice or face) — reuse `/ai-twin` capture flow as a slide.
  3. `signup_bonus` reveal — shadcn `Card` + `Badge`.
- **Wrong primitive:** progress dots are hand-rolled; if a step indicator stays, use shadcn `Progress` or a `ToggleGroup` of dots.

### `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email` — **MISSING ENTIRELY**

- **Should have:** shadcn `Form` + `Input` + `Label` + `Button` + `Card`, plus an OAuth button row if Supabase OAuth is on. ProfileChip currently links to `/sign-out` which doesn't exist either.

### `/terms`, `/privacy` — **MISSING ENTIRELY**

- **Should have:** static MDX or a thin `<article>` inside a light-mode `PagePanel`. Required for Stripe + App Store review.

---

## Authenticated app

### `/home` — `app/(app)/home/page.tsx`

- **Has:** `Button`, `FilmCard`, `FilmCardSkeleton`, `useSeenFilms`, `useStillLoading`, `FilmInProgressCard`, `NoFilmsEmptyState`, hooks: `useUser`, `useRecentFilms`, `useInProgressFilm`, `useDeleteFilm`, `useRenameFilm`, `useDuplicateFilm`.
- **Missing per Layout_Enhancements A.4–A.6:**
  - `<CenterStage />` above-the-fold (A.4) — picks up the in-progress film or shows a "Start your film" CTA.
  - `<ActivityFeed />` rail (A.5) — right-rail on desktop, stacked on mobile.
  - "Pick up where you left off" card (A.6) — last 3 viewed films with a single hover affordance.
- **Wrong primitive:**
  - Page bypasses `PagePanel` and hand-rolls `flex flex-col gap-8 p-6 md:p-8` — should use `PagePanel` (Layout_Enhancements audit, §Pages).
  - "Start your film" link is a hand-rolled `<Link>` styled as a button — should be `<Button asChild size="lg">` (B.24).

### `/projects` — `app/(app)/projects/page.tsx`

- **Has:** `Button`, `Input`, `NoFilmsEmptyState`, `FilmCard`, `FilmCardSkeleton`, hooks: `useInfiniteFilms`, `useDeleteFilm`, `useRenameFilm`, `useDuplicateFilm`. Search debounce + IntersectionObserver pagination already in place.
- **Missing per Layout_Enhancements A.7–A.9:**
  - Filter chips bar (A.7) — shadcn `ToggleGroup` bound to backend state enum (All / In progress / Complete / Error).
  - Sort dropdown (A.8) — shadcn `Select` for `created_desc` / `created_asc` / `title_asc` (currently sort exists but as a custom control).
  - Empty state (A.9) — Fraunces phase line "Your reel starts here." + primary CTA.
  - Trash / recently-deleted view — soft-deleted films are unreachable except by deep-link to `/films/[id]`. Could be a tab on this page or `/projects?filter=deleted`.
- **Wrong primitive:** confirm sort control uses `Select` not a custom dropdown.

### `/create` — `app/(app)/create/page.tsx`

This route has **two phases** per `Design_System §7.4` and `§8`: the **input phase** (script-in) and the **generation phase** (centralized generation screen). The UI swaps in place when the user hits Start. The bottom tab bar is replaced by the scene strip during generation.

- **Has:** `CreateClient`, `PagePanel`.
- **Missing per Layout_Enhancements A.10–A.12 (input phase):**
  - Live cost preview chip (A.10) — bound to balance store, NUMERIC(8,2) string formatter.
  - Brief textarea with auto-grow + char counter (A.11) — shadcn `Textarea` with `aria-describedby`.
  - Phase-strip preview (A.12) — render the 12-state pipeline as inert `<PhaseNarration />` tokens so the user sees what's coming.
- **Missing per Design_System §8 (generation phase) — the product's defining surface:**
  - `<CenterStage />` — large display of the currently-rendering scene.
  - `<SceneStrip />` — horizontal/right-rail strip of scene cards with per-scene state.
  - `<PhaseNarration />` — Fraunces serif crossfade ("Reading your script…", "Final cut…").
  - `<ActivityFeed />` — live event log, throttled aria-live, jump-to-latest pill.
  - `<FilmBalanceBadge />` — already exists, surfaced in this view.
  - Cancel-with-refund CTA (EC-G6) — confirmation in shadcn `Dialog` (or `Sheet` on mobile per B.26) using the `idempotency_key` pattern.
  - Reshoot dialog already exists (`ReshootSceneDialog`) — wire from each `<SceneStrip />` card.
- **Wrong primitive:** `/create/page.tsx` double-pads — uses `<PagePanel flush>` then re-adds `px-6 py-6 md:px-8 md:py-8` inside (Layout_Enhancements audit, §Pages). Drop `flush` and remove the inner padding.
- **Wire from layout:** `BottomTabBar.hidden` should be true for the duration of the generation phase (B.19).

### `/films/[id]` — `app/(app)/films/[id]/page.tsx`

Results screen only. Generation lives at `/create` — **do not** add a `/films/[id]/shooting` variant.

- **Has:** `PagePanel`, `FilmNotFound`, `FilmRestore`, `ResultsView` (with `HeroPlayer` + `SceneStrip` + `TakeItHomeMenu`), `Skeleton`, hooks: `useFilm`, `useRestoreFilm`. `ResultsSkeleton` with 3s "Still loading…" swap.
- **Missing per Layout_Enhancements A.13–A.14:**
  - Sticky `PagePanel` header with title + balance badge + "Reshoot scene" / "Take it home" / "Keep it" buttons (A.13).
  - `<SceneStrip />` placement: bottom on mobile, right-rail on desktop (A.14). Today scene strip lives inside `ResultsView` — confirm it adapts.
  - EC-G4 "Continue without it" secondary CTA in `ErrorRecoveryActions` — wired to a backend route that doesn't exist yet (open question logged in `coordination.md`).
- **Wrong primitive:** rename input on the title swaps `<button>` → shadcn `Input` on click — confirm shadcn `Input`, not a hand-rolled one.

### `/ai-twin` — `app/(app)/ai-twin/page.tsx`

- **Has:** `PagePanel`, `SectionHeader`, `Badge`, `Button`, `ConfirmDialog`, twin status hooks. Voice + face capture sections.
- **Missing:**
  - shadcn `Progress` for upload + training progress.
  - shadcn `Tabs` to split Voice vs. Face if the page gets crowded — currently a vertical stack.
  - Empty/initial state copy in Brand voice ("Teach Clevroy your voice.") — confirm against `Brand_Guide §5.4`.
- **Wrong primitive:** confirm file-input trigger is a shadcn `Button asChild` wrapping the `<input type="file">`.

### `/settings` and sub-routes

`/settings/page.tsx` redirects to `/settings/account`. Per Layout_Enhancements A.15, this is a deliberate choice vs. converting to shadcn `Tabs`. Pick one and document.

#### `/settings/account` (`account/page.tsx`)

- **Has:** `SectionHeader`, `Button`, `Card` family, `Input`, `Separator`, `Dialog` (delete-account confirm).
- **Missing:** real `useUser()` wiring (TODO comment in file references stratum-S6 — now done; needs `useUpdateProfile` mutation when the API client lands), avatar upload (shadcn `Avatar` + `Input type="file"`).

#### `/settings/billing` (`billing/page.tsx`)

- **Has:** `SectionHeader`, `Button`, plan cards, transaction list.
- **Missing:** shadcn `Card` + `Badge` for "Current plan" (A.15 plan-card direction). shadcn `Table` for the credit-transaction history. `Skeleton` while loading.

#### `/settings/preferences` (`preferences/page.tsx`)

- **Has:** `SectionHeader`, theme + reduced-motion toggles via `useUIStore`.
- **Missing:** confirm shadcn `RadioGroup` for theme choice and shadcn `Switch` for reduced motion. shadcn `Select` for language (English-only MVP per `coordination.md` G8).

#### `/settings/notifications` (`notifications/page.tsx`)

- **Has:** `SectionHeader`, `Button`, `Separator`.
- **Missing:** shadcn `Switch` per channel (email, push, in-app), shadcn `Card` to group sections.

#### `/settings/developer` (`developer/page.tsx`)

- **Has:** `SectionHeader`, `Button`, copy-to-clipboard.
- **Missing:** shadcn `Tabs` if API key + webhook + logs sections grow. Mono-styled IDs already use the JetBrains Mono token.

#### `/settings/about` (`about/page.tsx`)

- **Has:** `SectionHeader`, `Link`.
- **Missing:** Real version + commit info wiring (currently static).

#### `/settings/help` — **MISSING**

- ProfileChip's dropdown points here. Even an FAQ accordion + "Email us" mailto suffices for v1. shadcn `Accordion` is the primitive.

### `/error`, `/not-found` (`app/error.tsx`, `app/not-found.tsx`)

- **Has:** Brand-voice copy.
- **Missing:** confirm both use `Button asChild` for the "Take me home" CTA, and that error.tsx logs to whatever observability stack we land on.

---

## Cross-cutting gaps (apply to multiple pages)

These are tracked in `Layout_Enhancements.md` Part B; listed here for convenience because they affect every page's component list.

- **B.25 Skeleton coverage** — missing on `FilmBalanceBadge`, `ProfileChip`, `InProgressIndicator`, `<ActivityFeed />`, `<CenterStage />`. Each needs a shadcn `Skeleton` matched to its layout.
- **B.26 Mobile dialog discipline** — every `Dialog` instance (reshoot confirm, delete confirm, sign-out confirm, account delete) should switch to shadcn `Sheet` / `Drawer` on `<md`.
- **B.24 Button sweep** — any `<Link>` styled as a button or raw `<button>` should be shadcn `Button asChild` / `Button`. Audit all pages, not just Home.
- **B.22 Adaptive grid** — Projects (1/2/3/4 cols) and Home (horizontal scroller) should share a `<FilmGrid />` / `<FilmRow />` primitive so card spacing stays consistent.

---

## "Should we build it" — components named in the design system but not yet on disk

These are referenced in `Design_System §9.4` and the layout doc but don't exist as files yet:

- `<CenterStage />` — Home A.4 + `/create` generation phase. **Highest leverage missing component.**
- `<FilmGrid />` / `<FilmRow />` — shared adaptive layout for Home + Projects (B.22).
- `<TwinUpload />` — extract from `/ai-twin` so onboarding can reuse it.
- `<LegalShell />` — light-mode static-page chrome for `/terms`, `/privacy`, future `/help`.

Everything else in `§9.4` (`<SceneStrip />`, `<ActivityFeed />`, `<PhaseNarration />`, `<FilmBalanceBadge />`, `<RoundedShell />`, `<BottomTabBar />`) is on disk per current `git status`.
