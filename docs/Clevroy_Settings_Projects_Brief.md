# Clevroy Frontend — Settings + Projects Design Brief

The two non-chat surfaces that users will touch the most after the centralized chat. This brief defines what "top-tier" means for each, maps every data intake, and lists the design moves worth making.

Pair with:
- `docs/Clevroy_UI_Design_System.md` §7.3 (projects), §7.7 (settings) — original specs.
- `docs/Clevroy_Routes_Inventory.md` — status snapshot.
- `docs/Clevroy_Routes_Build_Audit.md` — build-cost analysis.

Last written: 2026-04-28.

---

## Section A — `/projects`

### A.1 Intent

The user's reel. Every film they've ever shot, archived, returnable to. Secondary entry to the chat surface (each card routes to `/films/[id]`). The page has to read at three times of day: a user with 0 films (welcome / first-run), a user with 5 films (browse / recall), a user with 100 films (search / filter / find).

This is **not** a "manage your assets" admin page. It's a memory shelf. Brand voice matters: "Your reel" not "All Films," "Shooting" not "In progress," "Didn't render" not "Errored." Cinematic verbs throughout.

### A.2 Data intake

| Source | Shape | When |
|---|---|---|
| `useInfiniteFilms({ search, sort, status })` | `FilmSummary[]` paginated | On mount, on filter change, on scroll-near-end |
| `useDeleteFilm`, `useRenameFilm`, `useDuplicateFilm` | mutation handles | Per-card overflow menu |
| `useSeenFilms` | `{ isSeen(id), markSeen(id) }` | Drives "New" dot on cards user hasn't opened |
| `useFilmRealtime(id)` (per card mounted) | state + scene transitions | For in-progress cards' live treatment |
| `useProfile()` | `films_remaining` string | Empty state copy ("5 free films left") |
| Local UI state | search input value, debounced 350ms; sort; status filter; layout (grid/list) | Persisted? See A.7. |

**FilmSummary shape** (per `src/types/api.ts`):

```ts
type FilmSummary = {
  id: string;
  title: string;
  state: FilmState; // 12-value enum
  created_at: string;
  completed_at: string | null;
  scene_count: number;
  duration_seconds: number | null;
  cover_image_url: string | null;
};
```

The page never sees the full thread or the script — only the summary. Detail fetch happens on `/films/[id]`.

### A.3 Layout

**Desktop (≥md):**
- PagePanel header: H1 "Your Films" + subline "Every film you've shot."
- Toolbar row: search (left, ~360px) · sort (right) · status filter chips (right) · view toggle (grid/list).
- Pinned shelf (optional): top 3 most-recent + any in-progress, horizontal-scroll, larger cards. Below: full grid.
- 4-column grid on ≥xl, 3-column on lg, 2-column on md.
- Infinite scroll with "Loading more films…" ghost cards.
- Empty state takes over the whole canvas.

**Mobile (<md):**
- Sticky toolbar with search expanded; sort + filter become a single "Filter" sheet trigger.
- 1-column stack with larger cards.
- BottomTabBar visible (this isn't the chat surface).

### A.4 Sections

#### A.4.1 Toolbar
- **Search**: shadcn Input + Search icon. Debounce 350ms. Placeholder: "Search your films." Clearable.
- **Sort**: shadcn Select. Options: "Newest first," "Oldest first," "Title (A–Z)." Persist in localStorage.
- **Status filter**: ToggleGroup of chips. "All / Shooting / Complete / Didn't render." Visual count badge per chip ("Shooting · 2"). Mobile: collapses to a single Filter button → Sheet.
- **Layout toggle**: Icon-only, grid vs list. Persist in localStorage.

#### A.4.2 Pinned shelf (top of page, optional)
- Renders only when there's at least one in-progress film OR ≥6 total films (so it doesn't compete with a small grid).
- Horizontal-scroll row of larger cards (1.5× normal).
- Order: in-progress first (live pulse), then 3 most recent.
- Above the row: "Right now" eyebrow if any in-progress; otherwise "Recent."

#### A.4.3 Grid
- `<FilmCard>` per film. Cover image (16:9 if landscape, 9:16 portrait), title, scene count + duration, status badge, "New" dot for unseen.
- Hover (desktop): card lifts, cover plays a 1-second motion preview if cover is a video (Layer 5 mints these).
- Click: routes to `/films/[id]`.
- Overflow menu (44×44 corner tap): Rename, Duplicate, Delete (with EC-N9 confirm).

#### A.4.4 Status visuals
- **Shooting** (in-progress): primary-color border ring with motion-safe pulse, "Shooting" badge, optional live phase preview ("Directing scene 3" mono caption).
- **Complete**: clean card, no decoration, scene count + duration visible.
- **Didn't render** (error): muted grayscale cover, destructive-color "Didn't render" badge, "Try again" inline action.
- **Canceled**: heavily muted, "Canceled" badge, no inline action (user has to start over).
- **Draft** (no script yet): rare; shows a placeholder cover with "Draft — pick up where you left off." Routes to `/films/[id]` which redirects back to `/home`. Only for accidental mints.

#### A.4.5 Smart grouping (optional)
- When `sort === "Newest first"` and total films ≥ 8, auto-group: "This week," "This month," "Earlier." Subtle eyebrow above each group, no hard divider.
- When sort is anything else, grouping disabled.

### A.5 States

**Empty (zero films):**
- Full-bleed `<NoFilmsEmptyState>` with Fraunces phase line "Your reel starts here."
- "Paste a script and we'll start shooting" body.
- "Start your first film" CTA → `/home`.
- "You have 5 free films to start. No credit card needed." hint if balance > 0.

**Empty results (filter returns nothing):**
- Different copy: "No films match those filters."
- "Clear filters" inline action.
- Don't show the start-your-first-film CTA — they have films, just not ones matching.

**Loading (initial):**
- Skeleton grid (3–6 placeholder cards). 3-second "Still loading your films…" swap if it takes longer (existing pattern).

**Loading (paginated, scroll):**
- 3 skeleton cards at the bottom of the grid, replace with real cards when they arrive.

**Error:**
- Banner above the grid: "We couldn't load your films. Try again." Retry button.
- If a partial page loaded before the error, show what we have + the banner.

### A.6 Mutations

**Rename:**
- Inline edit on overflow → opens a small dialog with current title pre-filled. Submit → `useRenameFilm`. Toast: "Renamed to *{new title}*."
- Optimistic update via TanStack Query `onMutate` → swap title in the cached list, rollback on error.

**Duplicate:**
- Confirm? Probably no — duplicating is non-destructive. Toast: "Duplicated. Find it at the top of your reel."
- New film appears at top of "Newest first" sort.

**Delete:**
- ConfirmDialog with `confirmVerbPairs.delete` ("Keep it" / "Delete it").
- Optimistic remove from list with undo toast (5 seconds): "Deleted. Undo?"
- Background mutation; if user clicks Undo, re-insert.
- EC-N9: if film is mid-pipeline, delete is disabled with tooltip "Still being shot. Cancel first, then delete."

### A.7 Top-tier design moves

These are the "make it sing" calls.

1. **Pinned shelf for in-progress + recent.** The thing the user wants to see on landing is "what am I working on right now." Surface it above the grid; don't make them scan.
2. **Live in-progress pulse + phase caption.** A shooting card shows a "Directing scene 3" mono caption that updates as the phase walker / Realtime advances. Risk 2 (silence anxiety) extends to this surface; the user's other films should breathe too.
3. **Cover-as-motion on hover.** When Layer 5 mints scene_playback per scene, the cover-image of a complete film can be a short loop. Hover desktop → autoplay-muted; tap mobile → expand to full preview. ChatGPT's video-thumb pattern.
4. **Smart grouping for archives.** Once the user has 20+ films, "This week / This month / Earlier" makes scanning feel like a memory shelf instead of a database table. Optional, behind a threshold.
5. **Filter chips with counts.** "Shooting · 2 / Complete · 14 / Didn't render · 1" gives the user a glance at the health of their reel without applying a filter.
6. **Inline rename, not a modal.** Cmd-click or double-tap title → editable inline. Modal feels heavy; this is a 5-character edit.
7. **Undo on delete.** A 5-second undo toast eliminates 90% of the anxiety around the destructive verb. Linear / Slack pattern.
8. **Cinematic empty state.** The current `<NoFilmsEmptyState>` is functional. Top-tier: a faux scene-strip animation behind the headline, same idiom as `/onboarding` step 2. Idle visual storytelling.
9. **Search by character / scene** (Layer 5+). Most users will remember "the one with the noir detective" before they remember the film's title. Backend has the metadata; front end exposes it as a deeper search.
10. **List view as a power-user mode.** Grid is default, list view is a denser table (title · status · scenes · duration · created). Persist user choice. Keyboard navigation in list mode (J/K, Enter to open).
11. **Cmd-K search.** Global keyboard shortcut to open the search input from anywhere on `/projects`. Eventually expands to a Cmd-K palette across the app, but this surface is the right place to start.
12. **"Right now" eyebrow.** The pinned shelf above the grid can carry a subtle Fraunces italic line — "Right now: 1 shooting, 14 complete." Frames the user's portfolio at a glance. Optional, threshold-gated.
13. **Bulk actions, but lazy.** Don't ship multi-select unless someone asks. The grid affords single-card actions; bulk is a power-user need that hasn't been validated.

### A.8 Open questions

- **Bulk select?** Punt unless requested.
- **Share a film** (public link to the playback)? Out of scope v1 per Chat_Surface §11.
- **Favorites / starred films?** Probably yes for repeat-customer retention, but adds a `pinned_at` column to the films table.
- **Folders / collections?** Heavy. Punt unless a user with 50+ films complains.
- **List view default vs power-user toggle?** Recommend grid default, list as toggle.

---

## Section B — `/settings`

### B.1 Intent

The user's control surface. Six sub-routes under one shell. Each is a small focused page; the shell ties them together with a tab strip.

Settings should feel **calm**. No dense forms, no surprise navigation. Every change has clear feedback. The brand voice softens here — these are utility surfaces, but they shouldn't read like a database admin tool.

### B.2 Shell

Already built:
- `<PagePanel title="Settings" subline="…">` with a horizontal `<Tabs>` strip.
- `usePathname()` resolves the active tab so deep-links light up correctly.
- Mobile: tab strip horizontally scrolls; no overflow menu.

What's missing:
- A "Save changes" toolbar that appears at the bottom when any field is dirty. Pattern: optimistic save where possible, batched save with explicit confirm where not (password, account delete).
- A "last saved at 3:42 PM" timestamp in the corner so users trust autosave.

### B.3 Per-section briefs

#### B.3.1 `/settings/account`

**Intent.** Identity. The "who am I to Clevroy" surface.

**Sections:**
1. **Profile** — display name, first name, avatar.
2. **Email** — current email read-only + "Change email" button → flow with verification.
3. **Password** — current + new + confirm. Strength indicator. Submit triggers a separate confirm dialog.
4. **Account deletion** — destructive zone, separated by a divider, soft-pinkish background hint. Confirm dialog with `confirmVerbPairs.deleteAccount` ("Keep my account" / "Delete account").

**Data intake:**
- `useProfile()` — read.
- `useUpdateProfile()` mutation (Layer 5) — for display name / first name.
- `useUploadAvatar()` mutation (Layer 5, R2 signed URL) — for avatar.
- `useChangeEmail()` (Layer 5 + auth provider).
- `useChangePassword()` (Layer 5 + auth provider).
- `useDeleteAccount()` (Layer 5 + auth provider, server-side).

**Top-tier moves:**
- **Avatar with crop.** shadcn doesn't have a cropper; add `react-easy-crop` or similar. Crop circle 1:1, output 256×256 webp.
- **Inline-validated fields.** Display name length, email format, password strength — feedback under the input as the user types, not on submit.
- **Optimistic display-name update.** Profile chip in sidebar reflects the change instantly.
- **Account deletion gauntlet.** Type your email to confirm. Lists what gets deleted ("Your N films, your voice twin, your face twin, your billing history"). Final confirm.

#### B.3.2 `/settings/billing`

**Intent.** Buy more films, see what you've spent, manage payment method.

**Sections:**
1. **Balance hero** — current films remaining, large numeric, filmstrip visual. "X films · last topped up Y days ago."
2. **Buy more films** — pack tiles (5 / 25 / 100 films). Each tile shows price, savings ("Save 20% on the 100-pack"). Click → Stripe Checkout session.
3. **Payment method** — current method ("Visa ending 4242, expires 12/27"). "Manage payment method" button → Stripe customer portal session.
4. **Recent invoices** — table: date, films purchased, amount, PDF link. Pagination if >10.

**Data intake:**
- `useProfile()` — `films_remaining`.
- `useFilmPacks()` — pack catalog (probably static, maybe fetched).
- `useCheckoutSession()` mutation — `POST /api/billing/checkout-session`.
- `useCustomerPortalSession()` mutation — `POST /api/billing/portal-session`.
- `useInvoices()` — paginated invoices list.

**Top-tier moves:**
- **Balance hero with filmstrip.** Not a number on a card — a visual that reads "8 films" through 8 filmstrip frames. The FilmstripGauge from the chat surface scales up.
- **Pack tiles, not a dropdown.** Three or four tiles. The 100-pack has a "Best value" tag; the 5-pack has a "Just topping up" tag. Selection feels like a choice, not a transaction.
- **"Free films" history.** If the user got 5 free at signup, surface that ("You started with 5 free films — thanks for trying Clevroy.").
- **Invoice download.** PDF button per row. Stripe issues these.
- **Spending visualization.** "$X this month" line at the top of the invoices table. Optional. Don't surface unless it's flattering.
- **Cancel subscription** (if subscription tier exists) — currently spec assumes packs only. Confirm with product.

#### B.3.3 `/settings/preferences`

**Intent.** How the app looks and behaves for me.

**Sections:**
1. **Theme** — Light / Dark / System. Live preview cards (not radios).
2. **Reduced motion** — toggle. Mirrors `prefers-reduced-motion` if "System."
3. **Default aspect** — segmented control 16:9 / 9:16 / 1:1.
4. **Default style preset** — chips: Cinematic / Documentary / Noir / Animated / None.
5. **Language** — locale dropdown (probably v2; only English today).
6. **Time zone** — dropdown (probably auto-detected from browser; option to override).

**Data intake:**
- `useUIStore` — theme.
- `useCreateOptionsStore` — aspect, style.
- `useProfile().reduced_motion` (Layer 5).
- `useUpdateProfile()` mutation for cross-device sync.

**Top-tier moves:**
- **Theme preview cards.** Each option is a miniature mockup of the chat surface in that theme. Click = apply + visible cross-fade. Beats radio buttons by orders of magnitude.
- **Default-style cards instead of chips.** Each card has a thumbnail demonstrating the style. Cinematic = warm color grade still; Noir = high-contrast; Animated = stylized; etc.
- **Reduced motion explainer.** Below the toggle, a one-line caption: "Skip the type-on intro and the idle pulse. Doesn't affect playback."
- **Autosave on change** — no save button. Toast: "Theme set to dark."

#### B.3.4 `/settings/notifications`

**Intent.** What does Clevroy reach me about, where, and how.

**Sections:**
1. **Film events** — toggles per channel. "Tell me when a film is ready" (email + push). "Tell me when a film hits a problem" (email + push).
2. **Account security** — "Sign-in from new device" (email always, push optional). Probably mandatory email; toggle is for push.
3. **Marketing** — "New features and tips" (email only, opt-in). GDPR-compliant: separate, default off, unsubscribe in every email.
4. **Quiet hours** (optional) — don't push between 10 PM and 7 AM.

**Data intake:**
- `useProfile().notification_preferences` (Layer 5; new field).
- `useUpdateProfile()` mutation.
- `useRegisterPushToken()` for native — Capacitor Push.

**Top-tier moves:**
- **Channel grid.** Rows are events, columns are channels (Email / Push). Toggle per cell. Clearer than a flat list.
- **Push registration is two-step.** Toggle on → request OS permission → if granted, send token to backend. If denied, show "Open settings" link with platform-specific instructions.
- **Marketing isolated.** Separate card with explicit "We'll email you twice a month, max. You can unsubscribe in any email."
- **"Test push"** button under the push toggle. Sends a test notification. Massively reduces "did this actually work?" anxiety.

#### B.3.5 `/settings/developer`

**Intent.** Power-user / staff-only surface. Hidden in production unless a flag is set.

**Sections:**
1. **Fixture mode** — toggle for `NEXT_PUBLIC_USE_HARDCODED` (env-driven today; UI override for staff).
2. **Feature flags** — empty list today. Layer 4 fills it (voice filter on/off, tool router model selection, etc.).
3. **API keys** — generate / revoke personal API keys. Out of scope v1; placeholder card with "Coming soon."
4. **Webhooks** — manage outbound webhooks. Out of scope v1.

**Data intake:**
- localStorage for client-side flag overrides.
- `useFeatureFlags()` (Layer 4) — dynamic flag reads.
- `useApiKeys()`, `useWebhooks()` (post-v1).

**Top-tier moves:**
- **Hide in production unless `?dev=1` query or a staff-only flag.** Don't surface this to civilians.
- **JSON view of current flag state.** Code block with copy button. Useful for bug reports.
- **"Reset all preferences"** button. Clears all `clevroy:*` storage keys + cookies. Same one-liner from the testing doc, exposed in UI for QA.

#### B.3.6 `/settings/about`

**Intent.** Trust + transparency. Version, legal, credits.

**Sections:**
1. **Version** — version number, build hash, last deploy timestamp. Tap version 7 times to enable developer mode (iOS easter egg).
2. **Legal** — links to Terms, Privacy, Licenses (open-source acks), Help.
3. **Credits** — "Built by Clevroy" or similar. Optional.

**Data intake:**
- `process.env.NEXT_PUBLIC_BUILD_VERSION`, `NEXT_PUBLIC_BUILD_HASH`, `NEXT_PUBLIC_BUILD_TIME` — injected at build.
- Static link targets (resolve in/out-of-app question first).

**Top-tier moves:**
- **Real version source.** Stop hardcoding; inject at build via `package.json` version + Git short SHA.
- **Tap-to-reveal developer mode.** Hidden affordance for staff QA on mobile.
- **Open-source license bundle.** A simple list, generated at build from `npm-license-checker` or similar.

### B.4 Cross-cutting design moves for Settings

1. **Single canonical form pattern.** Input + label + helper + error + state. Build it once as `<SettingsField>`, use everywhere. Pattern from shadcn `Form` if you want react-hook-form integration.
2. **Autosave by default; explicit save for sensitive.** Theme, preferences, notifications: autosave + toast. Password, email, account deletion: explicit save with confirm.
3. **Last-saved indicator.** "Saved at 3:42 PM" in the page corner. Builds trust in autosave.
4. **Dirty-state indicator.** Tab strip shows a subtle dot on tabs with unsaved changes (only relevant for explicit-save sections).
5. **Mobile-respectful spacing.** Settings on mobile is often janky. Generous padding, large touch targets, no horizontal scrolling on form rows.
6. **Brand voice in helpers.** Every helper text is a chance to sound like Clevroy. "We'll email you when your film is ready" beats "Email notification on completion event."
7. **Section dividers, not card walls.** Use spacing + subtle divider lines, not nested cards. Cards-within-cards reads as bureaucracy.
8. **Hide what's not yet wired.** API keys, Webhooks, Quiet hours — gate behind feature flags or just don't render. Empty placeholders feel broken.

### B.5 Open questions

- **Save model: autosave vs explicit?** Recommend autosave for preferences/notifications/theme; explicit for account/password/billing.
- **Subscription vs film packs?** Affects /billing structure.
- **Quiet hours?** Nice-to-have; punt v1.
- **Multi-language?** Punt v1, but design fields with locale-aware copy in mind.
- **Where do legal pages live?** In-app MDX vs external `clevroy.com/terms`. Affects /about.

---

## Section C — Sequencing recommendation

If working these two surfaces in order:

1. **Projects first.** Higher visibility, visited more often, already 630 lines of scaffold. The design moves (pinned shelf, live in-progress, smart grouping) are cinematic and on-brand.
2. **Settings second, as one pass.** Six sub-routes share patterns; the canonical `<SettingsField>` + autosave hook + save-toast is built once and replicated. Order within: Account → Preferences → Notifications → Billing → About → Developer.

Both are blocked at full completion by Layer 5 (real backend). Both can be visually polished + state-correct on fixtures today.

---

## Section D — What to decide before starting

For Projects:
- Pinned shelf — yes / no?
- Smart grouping threshold — start at 8 films, or higher?
- List view — ship today or punt to v1.1?
- Cover-as-motion — depends on Layer 5 minting playable thumbs.

For Settings:
- Save model — autosave vs explicit per page?
- Subscription tier or packs only?
- Where do legal pages live?
- Hide /developer behind a flag?

Make these calls and the build is a straight line.
