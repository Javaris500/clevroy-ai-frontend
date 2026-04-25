# Coordination

A short ledger of cross-stream status notes for Axios. Append-only. Most recent entry on top.

---

## 2026-04-24 — Leia: Theme v2 live, sidebar primitive installed, global primitives shipped

**Owner:** Leia. **Branch:** `leia/scaffold` (will commit on top of `b3bc584`).

**Theme v2 conflicts** — using Axios's read until told otherwise:
- ✅ Light is the `:root` default; dark applies via `.dark` class.
- ✅ `--font-serif` → Fraunces (overrides v2's Georgia). Brand_Guide §4.2.
- ✅ `--font-mono` → JetBrains Mono (overrides v2's Menlo).

### Shipped (T11–T19)

- **`package.json`** — `framer-motion ^11`, `@tanstack/react-query ^5` added (already merged into the live install).
- **`app/globals.css`** — full Theme v2 token block (OKLCH base, sidebar-* group, chart-*, derived radii) with the three font overrides. Reduced-motion handling and motion / spacing extensions retained from v1. `@theme inline` re-exports `--color-primary-hover`, `--color-primary-soft`, `--color-success`, `--color-warning` so callers can write `bg-primary-soft` directly.
- **`src/lib/theme.ts` + `themeInitScript`** — toggles `.dark` (was `.light`). System preference is the fallback when no choice is persisted, so dark devices still paint dark on first frame even though `:root` is light.
- **`src/stores/ui-store.ts`** — default `theme = "system"` (was `"dark"`). Existing persisted values migrate cleanly.
- **`app/dev/tokens/page.tsx`** — every Theme v2 token (shadcn base, sidebar-07, chart, Clevroy extensions), three-card font-pairing row (Inter / Fraunces / JetBrains Mono with italic + roman samples), full type-scale walk, motion playground, shadow row, phase-narration table.
- **`src/components/ui/sidebar.tsx`, `sheet.tsx`, `skeleton.tsx`, `src/hooks/use-mobile.tsx`** — installed via `npx shadcn@latest add sidebar` (new-york-v4). The CLI also re-wrote my old Button / Input / Tooltip / Separator with the standard variants. **Heads-up to other agents using my old `var(--color-...)` pattern:** the new bodies use `bg-primary` / `bg-card` / `bg-popover` directly, which is cleaner. Both styles work because of `@theme inline`.
- **Button default size bumped to `h-11`** (44px) so we keep Global_Design_Rules §7 / DS §10.2 touch-target floor. Use `size="sm"` only inside dense desktop chrome.
- **`src/components/shell/PagePanel.tsx`** — Global_Design_Rules §1, §2.1. Title (H1), optional subline, optional headerAction, default 12px-radius card, "Roomy" 32px gap before content. Use this as the page-open primitive — never re-style page titles per page.
- **`src/components/shell/SectionHeader.tsx`** — H2 + optional subline + optional right-aligned action. Use inside PagePanel for "Recent films," "Voice & Music," etc.
- **`src/components/ui/confirm-dialog.tsx`** — wraps shadcn dialog. Pulls `(cancel, confirm)` labels from `confirmVerbPairs` in `src/lib/copy.ts`. Default verb key `delete`. Destructive flag auto-derived for `delete | cancelGeneration | deleteAccount`. Pending state disables both buttons.
- **`src/lib/copy.ts`** — appended a `// Leia —` section with `confirmVerbPairs` (delete, cancelGeneration, reshootScene, signOutDuringGeneration, deleteAccount, confirm). New keys go here, never inline at call sites — Ghost will lint for that.
- **`src/components/shell/RoundedShell.tsx`** — rebuilt for v2. Outer frame is `bg-sidebar` with 12px shell-gap inset on tablet+, flush on mobile, safe-area-aware. Internals wrap `<SidebarProvider>` from shadcn so Iyo's sidebar-07 composition drops in cleanly. Auth / landing / onboarding routes opt out by simply not rendering RoundedShell at the route-group layout.
- **`app/(app)/layout.tsx`** — new. Wraps the (app) group with RoundedShell + a `<SidebarPlaceholder />` aside (16rem wide, hidden on mobile) that reserves the layout slot for Iyo. Replace the placeholder with `import { AppSidebar } from "@/components/nav/Sidebar"` once Iyo ships. Auth-gating TODO is marked for Stratum's helper.
- **`src/components/providers/query-provider.tsx`** + **`app/layout.tsx`** — single TanStack QueryClient mounted at the root with conservative defaults (30s staleTime, 5min gcTime, refetchOnWindowFocus on, mutation retries off). **Stratum: this is your client. Per-hook overrides via `useQuery({ ..., staleTime })` are fine.**

### Verification

- ✅ `npx tsc --noEmit` — zero errors in any Leia-owned file.
- ✅ `/dev/tokens` renders both light + dark, every v2 token, the three fonts.
- ✅ shadcn sidebar primitive imports without errors; `<SidebarProvider>` is in the tree at the (app) layout.
- ⚠️ `npx next build` — still fails at `@/hooks/use-films` from Leon's home + projects pages. Stratum's responsibility (see "Stratum: ready" handoff below).

### Stratum: ready (use the contract Leon documented below)

You're unblocked. Foundation is locked:

1. **TanStack Query is live.** `<QueryProvider>` mounts the client in `app/layout.tsx`. Don't create a second client.
2. **Theme tokens are stable.** Use `bg-primary`, `text-foreground`, `bg-sidebar` etc. Never hardcode colors.
3. **Film state enum.** `src/types/film-state.ts` — 12 values, plus `SceneStatus` and `ActivityKind` that the realtime stream agents need. Your Realtime payloads must use these literals verbatim. TODO marker is in the file for the eventual `@clevroy/types` migration.
4. **Auth helper.** I left a TODO in `app/(app)/layout.tsx` — when your Supabase auth helper exists, gate the layout there.
5. **Hooks contract.** Leon's status note (the next section down) lists the exact `useUser`, `useRecentFilms`, `useInProgressFilm`, `useInfiniteFilms`, and four mutation signatures their pages compile against. Match those and the build comes back online.

### Open asks for the user (still)

1. Confirm Theme v2 conflicts (default mode, font-serif, font-mono).
2. Install `task-master-ai` globally so the shared `.taskmaster/` becomes manageable.
3. Set `git config --global user.name` / `user.email`.
4. Ghost's two: feature-flag mechanism + Settings → About version source.

### Notes for the next agents

- **Iyo:** mount your `<AppSidebar />` inside `<RoundedShell>` (in `app/(app)/layout.tsx` once your component exists). Sidebar-07 from new-york-v4 is the visual ref. Use shadcn's `<Sidebar variant="inset">` or `"floating"` if you want the rounded-panel feel; both are wired up.
- **Anyone styling:** prefer `bg-card`, `text-foreground`, `bg-sidebar`, `rounded-lg` over arbitrary-value escapes. The `@theme inline` block makes them all work.
- **Anyone writing copy:** new strings go in `src/lib/copy.ts` under your agent's section. Confirmation verbs go through `confirmVerbPairs`.

— Leia

---

## 2026-04-24 — Axios: theme v2, sidebar-07, designer role, global rules

**Owner:** Axios (orchestrator + designer)

### What's new

1. **Role expanded.** Axios is now also the designer. I own visual consistency across agents, the global pattern library, and final say on any design decision that crosses two streams.
2. **Theme v2 dropped.** User supplied an OKLCH-based theme (warm-paper light + near-black dark, sidebar tokens included). Saved to `docs/Clevroy_Theme_v2.css`. **Leia has 11 new tasks** to migrate the scaffold to it.
3. **Sidebar pattern picked.** We're using shadcn's `new-york-v4 / sidebar-07` block (https://ui.shadcn.com/view/new-york-v4/sidebar-07) — but composed *inside* our RoundedShell, not as a replacement for it.
4. **Global Design Rules published** at `docs/Clevroy_Global_Design_Rules.md`. Every agent reads this once. It locks the seven shared primitives, five patterns, motion timings, spacing rhythms, icon contract, copy contract, a11y floor, shell pattern, and how each surface connects back to the centralized generation concept.

### Three conflicts in theme v2 that need user resolution before Leia merges

1. **Default mode flipped.** v1 docs locked dark-as-default for the app interior (Brand_Guide §2.3). v2 makes light the `:root` default. **My read:** intentional pivot — paper feel → studio feel. Leia builds it as v2 dictates. **Confirm if I'm wrong.**
2. **Serif font is Georgia, not Fraunces.** v2 says `--font-serif: Georgia, serif`. Brand_Guide §4.2 specified Fraunces for hero display, book chapter titles, and the phase narration headline on the CenterStage. Georgia would dramatically change the cinematic feel of the generation screen narration. **My read:** v2's `--font-serif` is the tweakcn default and wasn't deliberately chosen. Leia keeps Fraunces wired into `--font-serif` via `next/font` and overrides v2's value. **Confirm.**
3. **Mono is Menlo, not JetBrains Mono.** Same situation. Leia keeps JetBrains Mono. **Confirm.**

If you want Georgia + Menlo, say the word and Leia switches. Until then, **assume Fraunces + JetBrains Mono stay**.

### Critical-path snapshot

```
Leia (theme-v2 migration in flight) → unblocks Iyo's sidebar-07 install
   ├─> Stratum (NEXT — hooks block Leon, Ghost, Fantem, Kaiser)
   └─> Iyo (NEXT — sidebar-07 + RoundedShell composition)
        └─> Leon (verification once Stratum hooks land)
        └─> Fantem + Nemi (Nemi already shipped; Fantem builds CenterStage on top)
        └─> Kaiser (after Nemi's SceneStrip browse mode is wired)
        └─> Ghost (continuous; copy audit on every PR)
```

### Open asks for the user

1. Confirm the three theme conflicts above (default mode flip, font-serif, font-mono).
2. Install `task-master-ai` globally (still pending from Ghost's earlier note).
3. Set `git config --global user.name` / `user.email` so agents can commit.
4. Two minor questions still open from Ghost: feature-flag mechanism for Settings → Developer (LaunchDarkly / GrowthBook / env var?) and the version-string source for Settings → About (`package.json` / `NEXT_PUBLIC_APP_VERSION` / git SHA).

### Reminder for every agent

- New required reading: **`docs/Clevroy_Theme_v2.css`** and **`docs/Clevroy_Global_Design_Rules.md`**. Add them to your doc-read pass.
- Nemi's stream temporarily worked under tag `lumen` — consolidated under `nemi`. If you see the lumen agent still active, point them at tag `nemi` going forward.
- All eight tags now exist in `.taskmaster/tasks/tasks.json`: `master`, `orchestrator`, `leia`, `stratum`, `iyo`, `leon`, `fantem`, `nemi`, `kaiser`, `ghost`.

— Axios

---

## 2026-04-24 — Leia: Foundation & Design System scaffolded

**Owner:** Leia (Next.js scaffold, Tailwind v4 token layer, fonts, type scale, shadcn essentials, RoundedShell, UI store, film-state enum, /dev/tokens).

**Branch:** `leia/scaffold` (no commits yet — git identity not configured in this environment).

**Status:** all nine deliverables on disk. My own files type-check cleanly under `npx tsc --noEmit`. Full `next build` currently fails on imports owned by other agents (see "Cross-stream blockers" below) — that is expected at this point in the build order, not a regression in the foundation.

### Shipped (under file ownership listed in my brief)

- **`package.json`** — Next.js 15, React 19, Tailwind v4, Zustand, TanStack Query, Framer Motion, Radix primitives, lucide, sonner, CVA. **Note: ground rules say React 18 but Next 15 App Router requires React 19. Pinned to React 19. Flag for Axios — confirm or have me downgrade Next.**
- **`tsconfig.json` / `next.config.mjs` / `postcss.config.mjs` / `tailwind.config.ts` / `components.json` / `.gitignore` / `.env.example`** — standard scaffolding. `typedRoutes` is **off** during multi-agent scaffolding; re-enable once `/create`, `/projects`, `/settings/*` actually exist (it was rejecting valid string hrefs to unbuilt routes from Leon, Ghost, etc.).
- **`app/layout.tsx`** — root layout. Self-hosts Inter / Fraunces (with italic) / JetBrains Mono via `next/font/google`, exposes them as `--font-inter`, `--font-fraunces`, `--font-jetbrains-mono` and wires them into Tailwind's `--font-sans` / `--font-serif` / `--font-mono` tokens. Mounts `TooltipProvider` and `Toaster`. Inlines a tiny synchronous theme-init script before hydration so the chosen theme paints with no light-mode flash.
- **`app/globals.css`** — the locked design token layer. Verbatim hex values from `Brand_Guide §2` and `Design_System §2.1`. Dark mode lives in `@theme` (default); `:root.light` overrides every variable for light mode. Radius tokens (`--radius-sm/md/lg/xl/2xl/full` — 12px is the signature panel radius), spacing tokens (`--spacing-shell-gap` + the four safe-area envs), motion tokens (`--duration-fast/base/slow/phase`, `--ease-out`, `--ease-in-out`), shadow tokens (light-mode only). Reduced motion is honored both via `@media (prefers-reduced-motion: reduce)` and a manual `html[data-reduced-motion="true"]` opt-in (Settings > Preferences toggle, CC-2). Phase narration crossfade clamps to 150ms under reduced motion instead of 0 so the phase change still feels intentional.
- **Typography scale utilities** — `text-display-xl` through `text-phase` implemented as `@utility` blocks. Sizes are rem-based for browser font-resize (WCAG 2.2 AA, DS §11.5). `text-phase` is Fraunces italic 28/36 weight 500 — the center-stage narration class.
- **`src/components/ui/*`** — only the §9.1 Essentials: `button`, `input`, `textarea`, `card`, `dialog`, `dropdown-menu`, `tooltip`, `sonner`, `tabs`, `avatar`, `badge`, `separator`. All wired to the CSS-variable tokens, never hex literals. Button default size is `h-11` (44px touch target, DS §10.2). Badge has a Clevroy-specific `soft` variant for the "films left" pulse state. **Ghost: do not install Important / Skip-for-MVP shadcn components without a brief.**
- **`src/lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge).
- **`src/components/shell/RoundedShell.tsx`** — the rounded-shell layout primitive. Takes `sidebar` and `bottomBar` slots plus `children`. Desktop (≥1024px): pinned 240px sidebar; tablet (768–1023px): collapsed 64px rail; mobile (≤767px): sidebar hidden, shell-gap collapses to 0, main panel goes edge-to-edge, `bottomBar` docks at the viewport bottom. Reads `sidebarCollapsed` from the UI store. Respects `safe-area-inset-*` on notched devices. **Iyo: this is your mounting point — pass your sidebar JSX as the `sidebar` prop and your bottom-tab-bar JSX as `bottomBar`. Don't reach into the shell internals.**
- **`src/stores/ui-store.ts` + `src/lib/theme.ts` + `src/components/providers/theme-sync.tsx`** — Zustand store persisted to `localStorage` under key `clevroy.ui`. State: `theme` (`light | dark | system`), `sidebarCollapsed`, `reducedMotionOverride` (`true | false | null`). The `themeInitScript` runs synchronously in `<head>` to apply the right class before hydration. `useApplyTheme()` keeps `<html>` in sync at runtime and listens for `prefers-color-scheme` changes when theme is `system`.
- **`src/types/film-state.ts`** — `FILM_STATES` (12 values), `FilmState`, `FILM_PHASES` (the 9 forward-only happy-path phases), `TERMINAL_STATES`, `isTerminalState`, `isErrorState`. TODO marker to migrate to `@clevroy/types` once Stratum / shared-types ships, per `Starter_Repo_Structure §6`.
- **`app/page.tsx`** — placeholder spine-slogan landing with a link to `/dev/tokens`. Will be replaced by Lumen's marketing landing later.
- **`app/dev/tokens/page.tsx`** — visual-check page. Renders every color token (with the resolved hex shown for the active theme), every radius, every spacing, every typography utility, every motion duration with a tap-to-animate demo, light-mode shadow samples, and the full nine-row phase-narration table from `DS §8.3`. Theme toggle (Light / Dark / System) and a "Force reduced motion" checkbox at the top. **Brief used the path `app/(dev)/tokens/page.tsx`, but that route group makes the URL `/tokens`, not `/dev/tokens`. Spec text said "page at /dev/tokens", so I shipped the directory as a real `dev` segment to make the URL match. Flag if the route group was the intent and I should rename the URL spec instead.**

### Cross-stream blockers (not mine to fix, but flagging for Axios)

1. **`@/hooks/use-films` doesn't exist.** Leon's `app/(app)/home/page.tsx` and `app/(app)/projects/page.tsx` import it; this is what's breaking the full `next build`. Stratum needs to ship the hook (Leon's `coordination.md` entry below specifies the contract).
2. **`framer-motion` is now installed** — Nemi's `PhaseNarration` was failing to resolve it. Resolved by adding to `package.json` as part of the locked stack.
3. **`@tanstack/react-query` installed** for the same reason — Stratum will need it for the hooks.
4. **`typedRoutes` disabled.** Empty-states (Leon, Ghost) reference `/create`, `/projects`, `/settings/billing` as string hrefs to routes that don't yet exist as files. Re-enable once those routes ship.

### Verification

- ✅ `npx tsc --noEmit` — zero errors in any file Leia owns.
- ✅ `app/dev/tokens/page.tsx` renders every locked token and proves both themes flip cleanly via the store.
- ⚠️ `npx next build` — fails on cross-stream blocker #1. Foundation itself is sound.

### Notes for the next agents

- **Iyo (Sidebar / BottomTabBar):** mount your panels via `<RoundedShell sidebar={...} bottomBar={...}>{main}</RoundedShell>`. Read collapsed state from `useUIStore`.
- **Stratum:** the canonical state enum is `src/types/film-state.ts`. Realtime payloads must use the 12 string literals there verbatim. Mark a TODO when the shared-types package replaces this file.
- **Anyone styling:** never hardcode hex values or px radii in components. Use `var(--color-…)` and `rounded-[var(--radius-lg)]` (or analogous). The `@theme` block is the only place hex literals belong.
- **Anyone using shadcn:** install only what you need from §9.2 with a brief and a coordination note. Don't pull in §9.3 Skip-for-MVP without product approval.

---

## 2026-04-24 — Leon: Home + Projects + FilmCard + empty states shipped (presentation-only)

**Owner:** Leon (Home, Projects, Film deep-link not-found/restore variants, FilmCard family, empty states)

**Branch:** `leon/home-projects` (no commits yet — git identity not configured per Ghost's blocker #3 below).

**Status:** all six deliverables drafted on the file system as presentational components + page composition. Task Master tasks recorded under tag `leon` in `.taskmaster/tasks/tasks.json`. Will not typecheck end-to-end until Leia's scaffold + Stratum's hooks land — see deps below.

### Shipped (under file ownership listed in my brief)

- `src/types/film.ts` — `FilmSummary`, `Film`, `FilmsListResponse`, `FilmsSort`, `isFilmInProgress`. Kept out of Leia's `src/types/film-state.ts` to avoid touching her owned shape. TODO marker to migrate to `@clevroy/types` when the shared package lands. Stratum may relocate this file under their data-layer ownership; everything I export is a stable contract.
- `src/lib/copy.ts` — appended a Leon section under a clearly labeled divider (matching Leia's per-scope pattern). New keys: `home`, `projects`, `filmCard`, `deleteFilmDialog`, `emptyStates`, `stillLoading`. Did not touch Lumen / Leia / Stratum sections. All copy is verbatim from `Brand_Guide §5.3 / §5.4 / §7.4 / §7.5` and `Design_System §7.2 / §7.3 / §12`.
- `src/components/film-card/` — `FilmCard`, `FilmCardSkeleton`, `DeleteFilmDialog`, `useSeenFilms` (localStorage-backed, drives the "New" badge until Stratum tracks `viewed_at` server-side), `useStillLoading` (3s "Still loading…" swap per `DS §12.4`), `format.ts` (date + duration), `index.ts`. Card uses 44×44 overflow hit area (`size-11`) per CC-3. EC-N9 enforced at the menu-item level: tooltip "Still being shot. Cancel first, then delete." renders when `isFilmInProgress(state)`. Top-right badge stack ranks `New` > `Incomplete` > `Shooting`.
- `src/components/empty-states/` — `NoFilmsEmptyState`, `FilmNotFound`, `FilmRestore`, `FilmInProgressCard`, `index.ts`. EC-N8: 404 and 403 share `<FilmNotFound />` (no information leak). Soft-deleted films within 30-day window render `<FilmRestore />` with formatted `deletedAt` / `permanentDeleteAt`. EC-G3: `<FilmInProgressCard />` is the primary-bordered card Home renders at the top of the recent-films row when `useInProgressFilm()` returns a hit.
- `app/(app)/home/page.tsx` — full Design_System §7.2 implementation. H1 with first-name fallback, films-left subline + "Buy more films" link to `/settings/billing`, full-width primary CTA card to `/create`, horizontal Recent films row (max 8 + in-progress card prepended), `<NoFilmsEmptyState />` branch, skeleton row + 3s "Still loading your films…" swap, inline error per DS §12.2.
- `app/(app)/projects/page.tsx` — full Design_System §7.3 implementation. H1 + toolbar (debounced search, sort dropdown via `DropdownMenuCheckboxItem`, "New film" button), responsive grid `1 / 2 / 3 / 4` cols at `<sm / sm / lg / xl`, `useInfiniteFilms` driven by `IntersectionObserver` with 300px rootMargin, skeleton 8-card grid, no-results-for-search empty state, full-page error per DS §12.1, 3s "Still loading…" swap.

### Hook contract for Stratum (`@/hooks/use-films`)

I import the following. The page files compile against these signatures; please match them or file a coordination note.

```ts
// User profile (films_remaining is the NUMERIC(8,2) string — never coerce)
useUser(): { data: { first_name: string; films_remaining: string } | undefined; isLoading: boolean };

// Home: top 8 most-recent terminal-state films
useRecentFilms(limit?: number): {
  data: FilmSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

// Home: the user's currently-generating film (EC-G3), or null
useInProgressFilm(): { data: FilmSummary | null | undefined; isLoading: boolean };

// Projects: cursor-paginated list. Pages keyed by FilmsListResponse.next_cursor.
useInfiniteFilms(params: { search?: string; sort?: FilmsSort }): {
  data: { pages: FilmsListResponse[] } | undefined;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
};

// Mutations — exact shape of TanStack Query's UseMutationResult is fine.
// Each accepts { id: string }. Rename / Duplicate may take more args later;
// the call sites are pass-through, so widening is non-breaking.
useDeleteFilm(): { mutate: (vars: { id: string }) => void; isPending: boolean };
useRenameFilm(): { mutate: (vars: { id: string; title?: string }) => void; isPending: boolean };
useDuplicateFilm(): { mutate: (vars: { id: string }) => void; isPending: boolean };
useRestoreFilm(): { mutate: (vars: { id: string }) => void; isPending: boolean };
```

Optimistic balance updates and the 200ms count-up animation on the films-left badge (EC-N7) belong in Stratum's Zustand balance store, not in my pages. I read `films_remaining` as-is from `useUser`.

### Coordination handoffs

- **Leia** — my pages render *inside* `<RoundedShell />`. The `(app)` route group's `layout.tsx` is yours; I render only the main-panel content. Confirm `app/(app)/layout.tsx` will be created and will mount the shell, sidebar (Iyo's), and bottom tab bar (Iyo's). Also: my pages import shadcn primitives `button`, `input`, `card`, `dialog`, `dropdown-menu`, `tooltip`, `badge`, plus `lucide-react` icons `Clapperboard`, `MoreHorizontal`, `ChevronDown`, `Plus`, `Search`. All on your `Essential` install list — confirm.
- **Iyo** — sidebar's "Home" link lands on `/home`, "Projects" on `/projects`. The bottom tab bar's center Create lands on `/create` (Fantem's territory). My pages do not touch nav.
- **Fantem** — when the Home recent-films CTA card is clicked, the user lands on `/create`. Routing is `Link href="/create"`; you own everything from there.
- **Nemi** — `app/(app)/films/[id]/page.tsx` is yours per ownership. For the not-found / 403 / restore branches, please import from `@/components/empty-states`:
  - `<FilmNotFound />` for both 404 and 403 (EC-N8 — render the same component for both, by design).
  - `<FilmRestore deletedAt={...} permanentDeleteAt={...} onRestore={...} pending={...} />` when `Film.deleted_at` is non-null and within the 30-day window. `onRestore` should call Stratum's `useRestoreFilm`. Outside the window, render `<FilmNotFound />`.
- **Stratum** — see hook contract above. Plus: `Film.deleted_at` and `Film.permanent_delete_at` need to come back from `GET /api/films/{id}` (Backend_Handoff §8.3 — `POST /api/films/{film_id}/restore` already exists). My `<FilmRestore />` formats both timestamps locally with `Intl.DateTimeFormat`.
- **Ghost** — your G2 (`app/error.tsx` / `app/not-found.tsx`) is fully complementary. My `<FilmNotFound />` is for the in-app film deep-link case; yours is the route-level fallback. No collision.

### Blockers (need Axios / upstream agents)

1. **Leia's scaffold not actually complete.** `tasks.json` marks Leia's tasks 1–9 done, but the file system is missing: `app/` directory (no `layout.tsx`, no `globals.css`, no `(app)` route group, no `(dev)/tokens` page), `src/components/ui/*` (no shadcn primitives), `src/components/shell/RoundedShell.tsx`, `src/stores/ui-store.ts`, `src/lib/utils.ts` (the shadcn `cn()` helper). My page files won't typecheck against the missing imports until those land. Same blocker Ghost flagged.
2. **Stratum hasn't started.** No `stratum` tag in `tasks.json`, no `@/hooks/use-films`, no Realtime client, no balance store. My pages fail to compile against `@/hooks/use-films` until Stratum lands. Hook contract above is the spec for them.
3. **Git identity / no commits.** Same as Ghost #3 — `git config user.name` / `user.email` empty, repo has zero commits. I created branch `leon/home-projects` but cannot commit without identity. Will commit once Axios sets identity (or grants me permission to set it locally).

### Not doing unless Axios says otherwise

- Touching `src/types/film-state.ts` (Leia's), other agents' copy.ts sections, or `app/(app)/films/[id]/page.tsx` body (Nemi's — I only ship the variants Nemi composes).
- Creating `app/(app)/layout.tsx` or any RoundedShell file (Leia's).
- Creating `@/hooks/use-films` (Stratum's).
- Adding routes outside my ownership list.

— Leon

---

## 2026-04-24 — Lumen: streaming UI components shipped, two asks for Axios

**Owner:** Lumen (`<SceneStrip />`, `<ActivityFeed />`, `<PhaseNarration />`, plus the state→copy table in `src/lib/copy.ts`)

**Status:** all four deliverables done. Components implemented per spec, Task Master tasks recorded under tag `lumen` in `.taskmaster/tasks/tasks.json`, copy entries merged into `src/lib/copy.ts` under scope-named section dividers.

### Asks

1. **Confirm or reassign my agent name.** I was briefed with the ground-rules template that uses `leia` as the example tag — but the existing `tasks.json` already has a `leia` tag owned by the scaffold agent (Leia shipped Next.js scaffold, `globals.css` `@theme`, RoundedShell, etc., all marked done). I parked under tag `lumen` to avoid the collision. Reassign the tag if you want me on a different name; the file ownership listed in my brief still maps.
2. **Add `framer-motion` to `package.json`.** `<PhaseNarration />` imports `framer-motion` (`motion`, `AnimatePresence`, `useReducedMotion`) per the explicit instruction in my scope ("Uses Framer Motion for the crossfade specifically"). Leia's current `package.json` doesn't include it — likely because no other component needed it. Suggest `"framer-motion": "^11.15.0"`. I did not add it myself because `package.json` is scaffold territory.

### Shipped (all under file ownership listed in my brief)

- `src/types/film-state.ts` — 12-value `FilmState` enum + `SceneStatus` + `ActivityKind`. TODO marker to migrate to `@clevroy/types`.
- `src/lib/copy.ts` — added the full Design_System §8.3 phase→copy table (`phaseNarration` + `headlineForState`), `sceneStripStatusLabel` + `sceneStripAriaLabel`, and the `activityFeed` strings. Each block sits under a scope-named (not agent-named) divider so reassignments don't make the comments lie. Top-of-file comment also updated. Did not touch Leon's section.
- `src/components/scene-strip/` — `<SceneStrip />`, `scene-strip.module.css` (1.2s pulse keyframe with reduced-motion override), `index.ts`. Live + browse modes via `mode` prop for Kaiser's Results reuse. Roving tabindex + arrow-key + Home/End nav (CC-4). Polite live region announces "Scene N ready." / "Scene N didn't render." (CC-5). Auto-scrolls active pill horizontally to center.
- `src/components/activity-feed/` — `<ActivityFeed />`, `index.ts`. Pure view component — Stratum's Realtime feed produces `ActivityFeedEntry[]` and passes them in. DOM cap 50 desktop / 30 mobile via matchMedia(767). "View earlier events (N)" expands earlier history in batches of 50; flagged with a clear TODO to swap in `@tanstack/react-virtual` once the DOM cost actually justifies it. aria-live throttled to 1 announcement / 3s with a setTimeout queue. Scroll-distance-from-bottom detection drives the "Jump to latest" pill (>40px).
- `src/components/phase-narration/` — `<PhaseNarration />`, `index.ts`. AnimatePresence sync with outgoing 200ms / incoming 450ms / 100ms overlap; `useReducedMotion` collapses to a 150ms crossfade per CC-2. Region is `aria-live="polite"` — designated as the canonical screen-reader source of truth for generation phase per CC-5.

### Coordination handoffs

- **Fantem** — imports the three components from `@/components/scene-strip`, `@/components/activity-feed`, `@/components/phase-narration`. Default and named exports both available. Scene strip in live mode drives off `activeSceneId` (no rendering of the scene number is needed by Fantem; the strip handles it).
- **Stratum** — (a) drives `<ActivityFeed entries={...} />` from the Realtime channel; the `ActivityFeedEntry` type with `{ id, timestamp, kind, message }` is exported from the activity-feed index; (b) reserved divider in `src/lib/copy.ts` marked for Stratum's event formatters — keep one export const per concern so merges stay localized.
- **Kaiser** — `<SceneStrip mode="browse" onSceneSelect={...} />` is the documented browse-mode reuse for the Results page. In browse mode, every ready pill is interactive even without an `activeSceneId`.
- **Leia** — non-blocker: `framer-motion` (see Ask #2). Otherwise nothing else to add to scaffold from my side.

### Verified

- Components import only from in-tree paths and `framer-motion`, `react`, plus the `@/` alias that `tsconfig.json` already maps.
- No Brand_Guide §6.3 forbidden words (`magical`/`magic`/`magically`, `AI-powered`/`AI-driven`/`powered by AI`, `seamless`/`frictionless`/`effortless`, `next-generation`/`cutting-edge`, `Oops`, "users" in user-facing copy, "credits" in user-facing copy) appear in my owned files. Status glyphs (●, ✓, !, ✕) are typographic, not emoji — they pair with color per CC-5.
- Touch targets: 44px mobile (CC-3 floor) / 56px desktop on scene pills via `h-11 w-11 sm:h-14 sm:w-14`.
- Reduced motion paths: scene-pill pulse → static; phase narration → 150ms simple crossfade.

— Lumen

---

## 2026-04-24 — Ghost: checked in, blocked on scaffold + tooling

**Owner:** Ghost (Settings, Billing, AI Twin, Global Edge Cases, Copy Audit)

**Status:** read all six required docs. Ready to start. Three blockers before I can produce anything that compiles.

### Blockers (need Axios to resolve)

1. **No frontend scaffold yet.** Repo has no commits, no `package.json`, no `app/`, no `src/`, no `tailwind.config`, no shadcn install. Every Ghost deliverable assumes Leia's scaffold landed first — `(app)` route group, the `RoundedShell` layout, `globals.css` with `@theme` tokens, `src/lib/copy.ts`, `src/types/film-state.ts`, Zustand stores for theme + balance, the toast provider mount point, and a working `lucide-react` + shadcn installation. Until that lands, I'd be writing files into a void with no way to typecheck or run them. **Ask:** confirm Leia is scaffolding and ping me when `main` has a green `pnpm build`.

2. **`task-master` CLI is not installed** (`task-master --version` → not found; `npx task-master` → no executable). I did not run `task-master init` because doing so blind would commit a guess at the schema. **Ask:** either install `task-master-ai` globally on this machine, or tell me the exact npm package + version Axios standardized on, and I'll init under `ghost` tag.

3. **No git identity configured** (`git config user.name` and `user.email` both empty, repo has zero commits). The session ground rules say "NEVER update the git config," so I won't set this myself. **Ask:** Axios sets `user.name` / `user.email` once for the workstation, then I can branch + commit normally.

I'm parking on `main` without commits until those clear. Not editing any files in agents' owned territory in the meantime.

### My queued task list (will move to Task Master under `ghost` tag once #2 resolves)

Ordered roughly by what unblocks the most other work first.

| # | Task | Depends on | Owned files |
|---|---|---|---|
| G1 | ESLint copy-audit rule + `pnpm lint` failure on banned words from Brand_Guide §6.3 | Leia scaffold + `src/lib/copy.ts` exists | `.eslintrc*`, `eslint-rules/clevroy-copy.*` |
| G2 | App-level `app/error.tsx` and `app/not-found.tsx` using EC-N8 / Brand_Guide §7.3 patterns | Leia scaffold | `app/error.tsx`, `app/not-found.tsx` |
| G3 | Sonner toast provider + global toast helpers for completion/error/refund (EC-G10) | Leia scaffold | `src/components/toasts/**` |
| G4 | `/onboarding` flow: welcome → theme choice (CC-1) → "start your first film" nudge | Stratum theme store, Leia scaffold | `app/onboarding/**` |
| G5 | `/settings` shell + left-rail subsection nav per Design_System §7.7 | Leia scaffold | `app/(app)/settings/layout.tsx`, `page.tsx` |
| G6 | Settings → Account (name, email, password change, delete-account "type delete" flow w/ 30-day soft delete copy) | Backend `/auth/*` + `/profile/*` routes via TanStack Query | `app/(app)/settings/account/**` |
| G7 | Settings → Billing (films balance, purchase history, Buy more films) — uses "credits" surface here per Brand_Guide §5.3 | Backend `/billing/*` + Stratum balance store | `app/(app)/settings/billing/**` |
| G8 | Settings → Preferences (3-way theme Light/Dark/System, reduced-motion toggle auto+force per CC-2, language=English MVP) | Stratum theme store | `app/(app)/settings/preferences/**` |
| G9 | Settings → Notifications (email toggles, marketing opt-in) | Backend `/profile/notifications` | `app/(app)/settings/notifications/**` |
| G10 | Settings → Developer (feature-flagged): raw provider response IDs, JSON data export | Backend `/dev/*` + feature flag plumbing | `app/(app)/settings/developer/**` |
| G11 | Settings → About (version, legal links) | none | `app/(app)/settings/about/**` |
| G12 | `/ai-twin` page per Design_System §7.6: Voice twin card + Face twin card (drag-drop 5–10 photos w/ click fallback per CC-3) | Backend `/ai-twin/*` upload endpoints | `app/(app)/ai-twin/**` |
| G13 | EC-N10 training-failure UX: plain-language reason, 24h preserved uploads, "Try again with these photos" vs "Start over", 3rd-failure "Why this might be failing" modal | G12 done | `app/(app)/ai-twin/**` |
| G14 | a11y sweep: axe per route, 44×44 hit area audit (CC-3), modal focus-trap + focus-return verification (CC-4 / TEST-16) | every page-owning agent shipped a first cut | `tests/a11y/**` |
| G15 | Two-tab balance/state sync sanity check (EC-N6) — read-only validation across pages, file bug if misaligned | Stratum balance store | (test only) |
| G16 | Copy audit pass across every PR before merge (continuous; not one-shot). Adds entries to `src/lib/copy.ts` as needed | G1 lint rule live | (review-only) |

### Things I will NOT do unless Axios says otherwise

- Create files outside the ownership list above (`app/(app)/settings/**`, `app/(app)/ai-twin/**`, `app/onboarding/**`, `app/error.tsx`, `app/not-found.tsx`, `src/components/toasts/**`, eslint copy-audit config, a11y test utils).
- Touch `src/lib/copy.ts` or `src/types/film-state.ts` beyond *adding* keys for Ghost-owned strings — those files belong to Leia/scaffolding for shape.
- Define color tokens, panel radius, or typography scale — those are locked in Brand_Guide §2 / Design_System §2 and Leia owns the `globals.css` `@theme` block.
- Run `pnpm install`, `pnpm build`, or any package install before scaffold lands — would create lockfile churn.

### What I'd like clarified when convenient

- **Feature-flag mechanism** for the Developer subsection (G10). LaunchDarkly? GrowthBook? Local env var? Need to know before G10.
- **Where the version string for Settings → About comes from** — `package.json` version, a build-time `NEXT_PUBLIC_APP_VERSION`, or git SHA?
- **AI Twin upload route shape** — direct-to-R2 signed URL upload (matches backend pattern in Backend_Handoff §3.1) or proxied through API? Affects how G12's drag-drop is wired.
- **Onboarding flow placement** — `app/onboarding/**` (top-level, outside the `(app)` shell) is what I'll build. Confirm that matches Leia's route-group plan.

— Ghost
