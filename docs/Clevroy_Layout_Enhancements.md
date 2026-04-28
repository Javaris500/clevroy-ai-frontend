# Clevroy Layout Enhancements — 30 Changes

Captured from the layout / responsiveness discussion on 2026-04-25. Two parts:

- **Part A** — 15 page-by-page UI enhancements (sidebar polish, page-level surfaces).
- **Part B** — 15 responsiveness + component-design improvements for mobile / tablet / desktop and App Store readiness.

Authoring rules apply: shadcn-first, Theme v2 tokens only, Clevroy Brand verbs, no rolled primitives where a shadcn primitive exists.

---

## Why these changes — Layout audit (2026-04-25)

Audit covered `app/(app)/layout.tsx`, the shell + nav primitives, every authenticated page, and the shadcn `sidebar` source. The 30 changes below are not speculative polish — each one is anchored to a finding in the current tree. This section pairs every finding with the change it justifies.

### What's already strong (don't redo)

These aren't enhancement targets — they're load-bearing pieces that should not be touched while doing the 30:

- **Theme v2 OKLCH tokens** are wired correctly across `:root` + `.dark` in [app/globals.css](app/globals.css), including font overrides (Inter / Fraunces / JetBrains Mono) and the Clevroy extensions (`--primary-soft`, `--success`, `--warning`).
- **shadcn `sidebar-07` composition** is structurally correct: [src/components/shell/RoundedShell.tsx](src/components/shell/RoundedShell.tsx) wraps `<SidebarProvider>` so [src/components/nav/Sidebar.tsx](src/components/nav/Sidebar.tsx) drops in cleanly.
- **44×44 touch targets** are respected on `FilmBalanceBadge` ([src/components/nav/FilmBalanceBadge.tsx:75](src/components/nav/FilmBalanceBadge.tsx#L75)) and `ProfileChip` ([src/components/nav/ProfileChip.tsx:118](src/components/nav/ProfileChip.tsx#L118)).
- **Capacitor v7 haptics feature-detection** in [src/components/nav/BottomTabBar.tsx:64-73](src/components/nav/BottomTabBar.tsx#L64-L73) — pattern to reuse for keyboard + back-button listeners.
- **No-flash theme init** via a pre-hydration script in [app/layout.tsx:62](app/layout.tsx#L62).
- **Roving focus + arrow-key navigation** on `AppSidebar` ([src/components/nav/Sidebar.tsx:102-131](src/components/nav/Sidebar.tsx#L102-L131)).
- **Skeletons exist** for `FilmCard`, the projects grid, results — the gap is coverage, not the primitive.
- **Search debounce + intersection-observer infinite scroll** on `/projects` ([app/(app)/projects/page.tsx:386-397](app/(app)/projects/page.tsx#L386-L397)).
- **`prefers-reduced-motion` handling** in [app/globals.css:364-379](app/globals.css#L364-L379) collapses durations to 0ms (and to 150ms for phase narration only).

### Findings → Change mapping

#### Shell + radius

- **Outer shell radius is wrong (12px instead of 16px).**
  [src/components/shell/RoundedShell.tsx:64](src/components/shell/RoundedShell.tsx#L64) uses `md:rounded-lg` which maps to `--radius-lg = 12px`. The design system locks the outer shell at 16px. Should be `md:rounded-xl`. → Pre-req fix that supports **B.20 (container queries)** + **B.21 (max-width)** landing on a correct frame.

- **Sidebar / inset tones nearly collide in dark mode.**
  `--sidebar` is `oklch(0.1591 0 0)` and `--card` is `oklch(0.2002 0 0)` — close enough that the boundary blurs once shadows go to 0 in dark ([app/globals.css:159-172](app/globals.css#L159-L172)). RoundedShell paints the SidebarProvider with `bg-card` while Sidebar itself is `bg-sidebar`. → Justifies **B.28 (one elevation system in dark mode)** — add `border-sidebar-border` or use `bg-popover` for one of the two surfaces.

- **No `safe-area-inset-top` actually applied at the top.**
  The token is declared in [app/globals.css:107](app/globals.css#L107) and consumed in `RoundedShell`'s outer padding, but the `bg-sidebar` outer frame doesn't extend behind a transparent status bar. iPhone notch will overlap on Capacitor builds. → Justifies the **Capacitor pre-submission gate** at the bottom of this doc.

#### Responsiveness

- **Binary 768px breakpoint — no tablet treatment.**
  [src/hooks/use-mobile.tsx:3](src/hooks/use-mobile.tsx#L3) is the only breakpoint hook. An iPad in landscape (1024px) renders the full expanded sidebar at 16rem, eating ~256px on a portrait-app surface. → Justifies **B.16 (tablet breakpoint)**.

- **Mobile users cannot reach sidebar destinations.**
  shadcn's `<Sidebar>` renders as a `Sheet` on mobile via `useIsMobile` ([src/components/ui/sidebar.tsx:8,76](src/components/ui/sidebar.tsx#L8)), but no trigger is surfaced from any mobile page. `BottomTabBar` is the entire mobile nav today. Recent Projects, FilmBalanceBadge, ProfileChip → all unreachable on phone. → Justifies **B.17 (hamburger to Sheet on mobile)** and unblocks **A.1 (Recent Projects group)** + **A.2 (Feedback/Docs/Discord)** for mobile users.

- **Bottom bar doesn't hide for the keyboard.**
  [src/components/nav/BottomTabBar.tsx:171-182](src/components/nav/BottomTabBar.tsx#L171-L182) is `fixed inset-x-0 bottom-0` with no keyboard listener. On `/create` with the textarea focused, the bar overlaps the input on iOS. → Justifies **B.18 (keyboard hide)**.

- **`hidden` prop on BottomTabBar exists but is never wired.**
  [src/components/nav/BottomTabBar.tsx:127-129](src/components/nav/BottomTabBar.tsx#L127-L129) declares `hidden?: boolean`. Nothing in `app/(app)/layout.tsx` toggles it. Generation, playback, reshoot flows render the bar over their primary content. → Justifies **B.19 (hide in immersive screens)**.

- **Toast position is hardcoded `bottom-right` globally.**
  [app/layout.tsx:69](app/layout.tsx#L69). On mobile (`<md`), this overlays the BottomTabBar. → Justifies **B.27 (toast position by viewport)**.

#### Layout density

- **PagePanel uses viewport breakpoints, not container queries.**
  [src/components/shell/PagePanel.tsx:43-44](src/components/shell/PagePanel.tsx#L43-L44) uses `p-6 md:p-8`. On a small laptop with the sidebar expanded, the inset is narrow but `md:p-8` still fires because the *viewport* is `md`. → Justifies **B.20 (container queries)**.

- **No content max-width inside `SidebarInset`.**
  [app/(app)/layout.tsx:20](app/(app)/layout.tsx#L20) lets pages stretch edge-to-edge. On a 27" monitor, line lengths exceed comfortable reading width. → Justifies **B.21 (single max-width per page)**.

- **Inconsistent grid + scroller patterns for film cards.**
  Projects uses a 1/2/3/4-column grid with no `xl` break ([app/(app)/projects/page.tsx:447-449](app/(app)/projects/page.tsx#L447-L449)). Home uses a horizontal-scroll row ([app/(app)/home/page.tsx:311-333](app/(app)/home/page.tsx#L311-L333)). No shared primitive. → Justifies **B.22 (adaptive grid)**.

- **PagePanel headers don't stick on scroll.**
  [src/components/shell/PagePanel.tsx:50](src/components/shell/PagePanel.tsx#L50) is a plain `<header>` with no `position: sticky`. Long Projects scroll loses spatial grounding. → Justifies **B.23 (sticky PagePanel header)** + supports **A.13 (sticky film detail header)**.

#### Pages

- **Home bypasses `PagePanel` entirely.**
  [app/(app)/home/page.tsx:213-231](app/(app)/home/page.tsx#L213-L231) hand-rolls the layout with raw `<h1 className="text-h1">` and its own `flex flex-col gap-8 p-6 md:p-8`. The `PagePanel.tsx` docstring says: *"every page that lives inside RoundedShell opens with this. It owns the title's H1 styling."* This is a contract violation. → Strengthens the case for **A.4 (CenterStage)**, **A.5 (ActivityFeed)**, **A.6 (Pick up where you left off)** — all should drop into a real `PagePanel`.

- **Home's "Start your film" card is a hand-rolled `<Link>` styled as a button.**
  [app/(app)/home/page.tsx:233-244](app/(app)/home/page.tsx#L233-L244). Should be shadcn `<Button asChild size="lg">`. → Justifies **B.24 (button sweep)**.

- **`/create` double-pads.**
  [app/(app)/create/page.tsx:10-15](app/(app)/create/page.tsx#L10-L15) wraps `<CreateClient />` in a `<PagePanel flush>` then immediately re-adds `px-6 py-6 md:px-8 md:py-8`. The whole point of `flush` is to disable padding for full-bleed media — there's nothing full-bleed here. → Implicit support for **A.10–A.12 (Create page additions)**: do those *inside a non-flush PagePanel* and delete the manual padding.

- **Settings has no tabs page — it redirects to a sub-route.**
  [app/(app)/settings/page.tsx:6](app/(app)/settings/page.tsx#L6) redirects bare `/settings` to `/settings/account`. The other six sub-pages exist as separate routes. The VidRush reference uses tabs. → Justifies **A.15 (switch to shadcn `Tabs`)** — or document the deep-link-per-section choice as intentional and skip A.15.

#### Components

- **Active-state language is inconsistent.**
  Sidebar active state: `data-[active=true]:bg-primary-soft data-[active=true]:text-primary` ([src/components/nav/Sidebar.tsx:181](src/components/nav/Sidebar.tsx#L181)).
  BottomTabBar active state: `text-primary` only, no indicator bar ([src/components/nav/BottomTabBar.tsx:243](src/components/nav/BottomTabBar.tsx#L243)).
  Different mental models on the same app. → Justifies **B.29 (unified active-state language)**.

- **No `LayoutGroup` for sidebar collapse animation.**
  shadcn's primitive transitions width via CSS, but there's no Framer Motion choreography between the rail and the inset. → Justifies **B.30 (motion choreography)**.

- **Fixture-vs-real-hook duplication.**
  [src/components/nav/FilmBalanceBadge.tsx:28-38](src/components/nav/FilmBalanceBadge.tsx#L28-L38) and [src/components/nav/ProfileChip.tsx:49-54](src/components/nav/ProfileChip.tsx#L49-L54) both define a local `useProfile()` that gates `useUser()` behind `NEXT_PUBLIC_USE_HARDCODED`. Same pattern, copy-pasted. (Not in the 30, but worth a future cleanup pass — single `useProfileWithFixture()` helper in `src/hooks/_fixtures.ts`.)

#### Skeletons + async surfaces

- **Coverage is partial.**
  `FilmCard` has a skeleton, the Projects grid has one, Results has one. **Missing**: `FilmBalanceBadge` (renders 0 then jumps to real number), `ProfileChip` (avatar pops), `InProgressIndicator`, ActivityFeed, CenterStage. → Justifies **B.25 (Skeleton everywhere)**.

- **No mobile-vs-desktop dialog discipline.**
  `ConfirmDialog` ([src/components/ui/confirm-dialog.tsx](src/components/ui/confirm-dialog.tsx)) is a shadcn `Dialog` everywhere. On a phone, a centered modal with a backdrop tap-to-dismiss feels web, not native. iOS users expect bottom sheets. → Justifies **B.26 (`Sheet` over `Dialog` on mobile)**.

### What this audit does *not* cover

- Routes outside `(app)`: `(auth)`, `(landing)`, `(onboarding)` opt out of `RoundedShell` by design and were not scanned for this audit.
- Dev-only surfaces: `/dev/tokens` was deleted in the current working tree (visible in `git status`).
- Backend integration correctness: hooks throw stub errors today; the audit was performed against `NEXT_PUBLIC_USE_HARDCODED=true` semantics.

### Net read

The shell architecture is right. The 30 changes are quality + completeness work — not a re-platform. The single highest-leverage finding is the **mobile unreachability of sidebar destinations** (B.17): solving it unlocks half of Part A on phones for free. Second-highest is the **tablet treatment** (B.16): without it, "App Store top tier" is unreachable on iPad. Third is **content max-width + container queries** (B.20–B.21): these make every page look intentional on every screen.

---

## Part A — Page-by-page enhancements

### Sidebar (global)

1. **Recent Projects collapsible group.** Top 5 films by `created_at desc`. Each row: `film.title` (truncate) + a primary-soft "New" dot when the id is not in `useSeenFilms.isSeen`. Hide the whole group when the list is empty. Implementation: `<SidebarGroup>` with a `<SidebarGroupLabel>"Recent"</SidebarGroupLabel>` + `<Collapsible>` (the `sidebar-09` recipe).
2. **Secondary nav group: Feedback + Docs.** Two items above the footer: Feedback (mailto or in-product form), Documentation (`/docs`). Use `<SidebarGroup>` with `<SidebarGroupLabel>"Resources"</SidebarGroupLabel>` and `<SidebarMenuButton size="sm">` styled with `text-muted-foreground`. **Discord deferred** — only add when a Discord actually exists; an empty link is worse than no link.
3. **Real wordmark.** Replace the placeholder primary-circle dot in `Sidebar.tsx` ([src/components/nav/Sidebar.tsx:147-156](src/components/nav/Sidebar.tsx#L147-L156)) with the Clevroy aperture-mark SVG when Brand provides it. Keep the existing focus-ring + `group-data-[collapsible=icon]:hidden` behavior on the wordtype.

### Home `/home`

4. **`<CenterStage />` above-the-fold.** Single hero surface that shows the in-progress film when `useInProgressFilm()` returns a value, else an empty-state CTA "Start your film." This is the primary "where am I picking up from?" affordance — replaces the separate "Pick up where you left off" idea, which would duplicate the existing Recent Films row at [app/(app)/home/page.tsx:311](app/(app)/home/page.tsx#L311).
5. **`<ActivityFeed />` rail.** Right rail at `lg+`, stacks below CenterStage on `<lg`. Reads the `ActivityFeedEntry` type already shipped in `src/types/film.ts`.
6. **(Skipped — merged into A.4.)** A "Pick up where you left off" card was considered and dropped: the in-progress film already surfaces in `<CenterStage />`, and recently-viewed films already surface in the Recent Films row. A third entry point would be redundant.

### Projects `/projects`

7. **Filter chips bar.** Status: All / In progress / Complete / Error. shadcn `ToggleGroup`. Tied to the backend state enum.
8. **Sort dropdown.** `created_desc`, `created_asc`, `title_asc` — already typed in `src/types/film.ts`. Wire to shadcn `Select`.
9. **Empty state.** Serif phase-narration line "Your reel starts here." + primary CTA. No emoji. No "Oops."

### Create `/create`

10. **Live cost preview chip.** "≈ 600 films per video"-style mirror, bound to balance store. NUMERIC(8,2) string formatter — never cast to float.
11. **Brief field with auto-grow + char counter.** shadcn `Textarea`. `aria-describedby` to a help line ("What's the scene about?").
12. **Phase-strip preview (gated on user research).** Optionally render the 12-state pipeline as inert tokens beneath the brief field so the user sees what's coming. Reuses `<PhaseNarration />`. Only ship this if user testing shows users want a preview before submitting — otherwise it's clutter on a screen that should feel like one decision.

### Film detail `/films/[id]`

13. **Sticky `PagePanel` header.** Film title + balance badge + "Reshoot scene" / "Take it home" / "Keep it" buttons. Brand verbs locked.
14. **`<SceneStrip />` placement.** Bottom on mobile, right rail on desktop. Each scene in a 12px card. Reshoot opens a shadcn `Dialog` (or `Sheet` on mobile per B.26).

### Settings `/settings`

15. **Tabs that route, not Tabs that stash state.** Keep the existing per-section sub-routes (`/settings/account`, `/settings/billing`, …) — they're URL-shareable and back-button-correct, which is the right default for a settings surface. Add a shadcn `<Tabs>` strip above the section content where each `<TabsTrigger>` is a `<Link>` to its sub-route and the active value is derived from `usePathname()`. Plan cards use shadcn `Card` + `Badge` for "Current plan." No custom card primitive.

---

## Part B — Responsiveness + component design

### Responsive shell

16. **Add a tablet breakpoint.** Introduce `useIsTablet` (`min-width: 768px and max-width: 1023px`). Tablet gets `<Sidebar collapsible="icon" defaultOpen={false}>` — 56px rail with tooltips. Today the binary 768px split treats a 9.7" iPad like a 27" monitor.
17. **Hamburger entry to Sheet on mobile.** Add `SidebarTrigger` to a sticky top header on `<md`. shadcn renders the same Sidebar as a Sheet automatically — zero extra code.
18. **Hide bottom bar during keyboard.** Capacitor `Keyboard.addListener('keyboardWillShow')` or `visualViewport` API on web — translate the bar offscreen. Otherwise it covers the input.
19. **Hide bottom bar in immersive screens.** Generation, scene playback, reshoot flows. The `hidden` prop already exists on `BottomTabBar` — wire it from the (app) layout / route segments.

### Layout density

20. **Container queries on `PagePanel`.** Tailwind v4 `@container`. A panel that's narrow because of a sidebar should reflow the same way a panel that's narrow because of phone width does.
21. **Single content max-width.** `max-w-7xl mx-auto` (1280px Tailwind token) inside `SidebarInset`. Caps line lengths and keeps the gallery centered on ultrawide displays. Use the token, not a magic pixel value, so future scale changes flow through.
22. **Adaptive grid for film cards.** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6`. One shared component (`<FilmCardGrid>`) so Projects, search results, and any future archive use the same density rules. Don't fuss with per-breakpoint gap shrinking unless a real-world screenshot proves it's needed.
23. **Sticky `PagePanel` header on scroll.** Long pages (Projects, Settings) keep H1 + `headerAction` pinned for spatial grounding, especially on mobile.

### Component polish

24. **Sweep rolled `<button>` → shadcn `Button`.** Same for inputs / textareas. Brand verbs need to live on `Button` variants or focus rings drift across the app.
25. **`Skeleton` for every async surface.** Films list, balance badge, activity feed, scene strip. Token-perfect via shadcn.
26. **`Sheet` over `Dialog` on mobile.** Reshoot confirmation, settings sub-pages, profile — bottom sheets on `<md`, dialogs on `≥md`. shadcn `Drawer` (vaul) handles this natively.
27. **Toast positioning by viewport.** `Sonner` → `position="top-center"` on mobile (above bottom bar, away from thumb), `bottom-right` on desktop. One-line config.

### Polish & feel

28. **One elevation system in dark mode.** Sidebar and inset are both `bg-card` in dark — boundary disappears. Add `border-sidebar-border` on the sidebar OR use `bg-popover` for one of the two surfaces.
29. **Unified active-state language.** Sidebar active = `bg-primary-soft text-primary`. Bottom-bar active = `text-primary`. Pick one gesture and use it on both: a 4px primary indicator (left bar in sidebar, top bar in tab bar). Linear-style.
30. **Verify sidebar-collapse transition.** shadcn already drives the rail's width via CSS transition. Action: confirm the `SidebarInset` width transitions in lockstep (no jump), runs at `--duration-base` / `--ease-out`, and collapses to `0ms` under `prefers-reduced-motion`. Reach for Framer Motion *only* if the inset visibly snaps; otherwise leave the CSS transition alone — adding `LayoutGroup` for a width tween is over-engineered.

---

## Explicitly out of scope (considered, rejected)

These came up during the layout discussion and were deliberately not added to the 30. Recording the *why* so they don't keep resurfacing.

- **Workspace / team switcher in `SidebarHeader`.** Backend has no `organization_id` on `Profile` — Clevroy is single-tenant by data shape today. An empty switcher is dead pixels. When multi-tenancy ships, the `sidebar-08` `<TeamSwitcher />` recipe is a half-day add at that point. Don't scaffold for hypothetical futures.
- **"What's new" footer card.** Common in productivity apps but only earns its space when there's a real release-notes pipeline (changelog feed, "mark as read" state, deep links to feature surfaces). Building the card without that pipeline produces a card that's "Latest fixes and new features" forever.
- **Greeting card with emoji.** Banned by the brand-voice rules — no emoji in product copy. If a greeting is wanted, render it in Fraunces serif italic without an emoji.
- **Per-page padding overrides.** `PagePanel` owns padding. Pages should not redefine `p-6 md:p-8` themselves. The `/create` and `/home` violations are tracked in the audit, not as new features.
- **Custom card primitive.** shadcn `Card` covers every case in the design. No project-local `<RoundedCard>` / `<SurfaceCard>` wrapper.
- **A separate `<RecentFilmsScroller>` component.** Home's horizontal-scroll row and Projects' grid should share `<FilmCardGrid>` (B.22) — one primitive, two layout props (`scroller` vs `grid`), not two components.

## Design constraints (still in force regardless of process)

These are product/engineering rules independent of any team workflow:

- **shadcn-first**: never roll a button, input, dialog, dropdown, sheet, tabs, etc. when a shadcn equivalent exists.
- **Outer shell radius is 16px** (`--radius-xl`); inner panel radius is 12px (`--radius-lg`). Don't tweak.
- **Brand verbs only**: "Start your film," "Reshoot this scene," "Take it home," "Keep it," "Delete it." Banned: Oops / Something went wrong / Generate / Magical / Seamless / Simply / AI-powered / emoji.
- **NUMERIC(8,2) end to end** on balances. Never cast to float.
- **12 backend states** are the single source of truth for phase.
- **WCAG 2.2 AA** + 44×44 touch targets + `prefers-reduced-motion` respected.

## Capacitor / App Store pre-submission gates

Three native-only items that block App Store / Play submission, surfaced during the discussion:

- `safe-area-inset-top` is declared on `RoundedShell` but not applied above the sidebar header — status bar overlaps on notched iPhones. Fix before TestFlight.
- Disable iOS rubber-band scroll on the outer frame; allow it on the inset.
- Wire `App.addListener('backButton', ...)` for Android — back button currently exits the app instead of popping the route.
