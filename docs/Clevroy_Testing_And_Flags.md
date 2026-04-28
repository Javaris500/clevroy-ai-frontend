# Clevroy Frontend — Testing & Flags

Living checklist for what to verify, what flags exist, and what's broken on purpose. Pair with `CLAUDE.md` (layer model) and `docs/Clevroy_Chat_Surface.md` (chat contract).

Last audit: 2026-04-28.

---

## Build status

| Layer | Slice | Status |
|---|---|---|
| 0 | Edge-to-edge shell, no cream, no inset | ✅ shipped |
| 1 | Visual `<ChatSurface mode="empty">` (AI Elements `PromptInput` + `Suggestions`) | ✅ shipped |
| 2 | `(chat)` route group + mint-redirect lifecycle, minimal `mode="thread"` | ✅ shipped |
| State | Per-film thread store + persistence + draft autosave + create-options + phase walker primitives | ✅ shipped |
| 3 | Message-type components (`UserMessage`, `NarrationMessage`, `SceneImageCard`, `ScenePlaybackCard`, `CharacterRefCard`, `FinalFilmCard`, `ActivityMessage`, `SystemMessage`, `AssemblyPreviewCard`) + phase walker wiring | ❌ not started |
| 4 | `useChat` + Vercel AI Gateway + tool schemas + voice filter | ❌ not started |
| 5 | Backend `thread_messages` + Realtime merge + REST `since` catch-up | ❌ not started |

The chat surface visually looks complete on `/home`, but submitting redirects to `/films/<uuid>` and the thread is empty (only `user`-type bubbles render until Layer 3). This is expected, not a bug.

---

## Environment flags

| Var | Type | Default | Effect |
|---|---|---|---|
| `NEXT_PUBLIC_USE_HARDCODED` | `"true"` / unset | unset | When `"true"`, `useUser()` and `useInProgressFilm()` resolve from fixtures in `src/hooks/_fixtures.ts`. Required for local dev today (no real backend). Read via **literal property access** in `_fixtures.ts:24-26` — do not change to computed access (`process.env[KEY]`) or hydration mismatch returns. |

**One-time setup**: create `.env.local` at repo root with `NEXT_PUBLIC_USE_HARDCODED=true`. Restart `npm run dev` after editing.

No feature flags wired yet. Reserved for Layer 4 voice-filter toggles and Layer 5 Realtime gates — when they exist, document them here.

---

## Persistent storage keys

These accumulate during a session and survive reloads. Clear via DevTools → Application → Storage to reset.

| Storage | Key | Contents | Cap |
|---|---|---|---|
| localStorage | `clevroy:chat:v1` | Per-film threads keyed by `filmId`. JSON. | 20 most-recently-touched films. `trimToCap` drops oldest silently. |
| localStorage | `clevroy:create-options:v1` | `{ aspect, style }` user preferences. | n/a |
| localStorage | `clevroy:theme` (Zustand `ui-store`) | Theme preference. | n/a |
| localStorage | `clevroy:seen-films` | Set of film IDs the user has opened (drives sidebar "New" dot). | n/a |
| localStorage | `clevroy.bottomTabBarHint` | Mobile-only first-three-opens hint state. | 3 shows max. |
| sessionStorage | `clevroy:welcome-typed` | Prevents the welcome line from re-typing on every nav. | n/a |
| sessionStorage | `clevroy:draft:home` | In-flight prompt text on `/home`. Autosaved every 2s. Cleared on submit. | n/a |
| sessionStorage | `clevroy:draft:thread:<filmId>` | In-thread draft text per film. Same autosave loop. | n/a |
| Cookie | `sidebar_state` | Sidebar open/collapsed state for SSR-correct first paint. | 7 days. |

---

## Manual testing — what works today

### Layer 2 (chat surface lifecycle)

- [ ] **Hard-refresh `/home`** → expect "Welcome back, Javaris. What's the next film?" with no console hydration error. Welcome line types in once per session, then renders pre-typed on subsequent refreshes.
- [ ] **Type into the input** → suggestions disappear, welcome line dims, char-count advances. ⌘↵ hint surfaces at ≥10 chars.
- [ ] **Press Roll (or ⌘↵)** → after ~250ms the URL flips to `/films/<uuid>`. The user bubble persists across the redirect because the layout owns the ChatSurface instance.
- [ ] **Visit `/create` directly** → instant redirect to `/home`. Sidebar Create slot still routes here.
- [ ] **Open two threads in two tabs** (submit twice) → each `/films/<uuid>` shows only its own user bubble. No bleed.
- [ ] **Refresh `/films/<uuid>`** → user bubble still visible. (Was lost before persistence shipped.)
- [ ] **Mobile DevTools (375px)** → input docks to the bottom edge with safe-area-inset-bottom + backdrop-blur veil. Welcome + suggestions scroll above.

### State Management

- [ ] **Type a partial draft on `/home`, navigate to `/projects`, navigate back** → draft is restored.
- [ ] **Toggle aspect to `9:16`, submit, navigate back to `/home`** → aspect chip is still `9:16`.
- [ ] **Toggle style to `Noir`, refresh, return to `/home`** → style chip is still `Noir`.
- [ ] **DevTools → Application → Local Storage** → verify `clevroy:chat:v1` and `clevroy:create-options:v1` keys exist after first interaction.
- [ ] **React DevTools Profiler** → typing into the textarea does **not** re-render the user bubble. Selector hygiene proof.
- [ ] **Hydration sanity** → no "Text content does not match server-rendered HTML" warning in console on any chat-surface route.

### Profile / sidebar (already in)

- [ ] **Network tab on first paint of any `(app)` route** → exactly one `useUser()` query (one `/me` request when backend exists). Was three before the ProfileProvider unification.
- [ ] **Toggle sidebar to icon mode** → `FilmBalanceBadge` shows just the integer with a tooltip on hover; `ProfileChip` shows just the avatar with a tooltip.
- [ ] **`prefers-reduced-motion: reduce`** + balance = 0 fixture → `FilmBalanceBadge` does not pulse.

### Profile / not yet wired

- [ ] Sign-out lands on `/sign-out` → currently 404 (route doesn't exist; wired with `TODO(routes)` comment).
- [ ] Help link in profile dropdown lands on `/settings/help` → currently 404 (same).
- [ ] Sidebar Documentation link lands on `/docs` → currently 404 (same).

---

## Known issues — flagged, not fixed

### Severity: ship-blocking before Layer 3

- **F1. Phase walker not idempotent on reload.** `usePhaseWalker` schedules every event from `t=0` on mount. If the user refreshes mid-run, the walker re-fires the entire timeline against a thread that already has some events → duplicates. Fix in Layer 3 wiring: track a `walkedAt` timestamp per film in the store and skip events whose `atMs < (Date.now() - walkedAt)`, or guard with a per-film `walked: boolean` flag.

- **F2. ThreadMessages renders only `user`-type messages.** `ChatSurface.tsx:721-723` explicitly returns `null` for non-`user` messages with a Layer 3 TODO. Until Layer 3 lands, narration/asset/activity/system events from the phase walker would arrive in the store but render nothing.

### Severity: known awkward, fix when convenient

- **F3. Mint-first 250ms gap.** `(chat)/layout.tsx` calls `mintFilm()` *before* `addUser()`, so the user's bubble does not appear until after the fixture mint resolves. The redirect happens immediately after, so the bubble is "born" on the destination page. Trade-off: zero-latency optimism would require a client-side temporary `film_id` and a reconciliation step. Layer 5 will reconsider once the real `POST /api/films` lands.

- **F4. `markSettled` fires synchronously after `addUser`.** No "pending" state is ever visible. The `pending: true` flag exists in the store and survives ~1 render but no visual treats it. Layer 4 will need a real pending → settled visual when the LLM round-trip becomes async.

- **F5. Submit error path is silent.** `(chat)/layout.tsx:69-71` swallows mint errors with a TODO comment ("Layer 5 owns real error UX"). For now any failure leaves the user with `pending=false` and no system-message fallback. `mintFilm` doesn't fail today (fixture), so this is dormant — Layer 5 must wire a `system`-type message bubble or toast.

- **F6. Phase walker uses third-party asset URLs.** `picsum.photos` for stills, `w3schools.com` for the sample MP4. Network blocking, ad blockers, or those services going down breaks dev playback. Layer 5 swaps for backend-minted signed URLs. For now, run on a permissive network or replace `SCENE_IMAGES` / `SCENE_PLAYBACK_VIDEO` constants in `phase-walker.ts` with local files.

- **F7. `trimToCap` drops oldest threads silently.** When the user reaches their 21st film, the oldest thread disappears from localStorage with no UI. The Recent group in the sidebar will still show it from server-side data, but clicking through leaves the user staring at an empty thread. Mitigation: Layer 5 hydrates from `thread_messages` so even purged-locally threads rehydrate. Until then, document the cap; don't add UI noise for an edge case.

- **F8. `useTypeOn` and `useIdle` interact awkwardly on first paint.** `useTypeOn` plays once per session; `useIdle` arms a 30s timer on mount. If the user lands and walks away for 30s during the type-on, the idle pulse fires while the welcome line is still typing. Cosmetic.

- **F9. `useCurrentHour` snapshots at mount.** A session that crosses midnight uses the stale hour for the welcome greeting. Documented in the hook's comment; not worth a per-minute interval.

- **F10. Atmosphere component is unaudited.** `app/(app)/(chat)/layout.tsx:13` imports `<Atmosphere />` from `src/components/chat/atmosphere/`. Hasn't been reviewed by the audit chain. Verify it doesn't subscribe to a heavy data source on every chat-route mount.

- **F11. "Take 1" slate is literal text, not derived.** `ChatSurface.tsx:493-498` hardcodes "Take 1" in the PromptInputHeader. The brand intent is that subsequent reshoots become "Take 2" / "Take 3" — there's no take counter wired to the store. Layer 4 territory.

### Severity: paper-cut

- **F12. No error boundary around `<ChatSurface>` or the `(chat)` layout.** A render error in any message component would unmount the entire chat surface. Add a `<ErrorBoundary>` wrapper before Layer 3 ships components that touch external assets.

- **F13. Sign-out / Help / Docs routes are 404.** `ProfileChip.tsx:88-89` and `:152` plus `Sidebar.tsx:326` link to `/sign-out`, `/settings/help`, `/docs` respectively. All flagged with `TODO(routes)` comments; wire when those surfaces ship.

- **F14. Welcome line `text-balance` requires Tailwind v4** (already on it) but Safari < 17.4 falls back to native wrapping. Acceptable.

- **F15. `mode="thread"` ignores when `filmId` is undefined.** `(chat)/layout.tsx:42` resolves `filmId` only when `mode === "thread"`; if a user types `/films/` (no id), Next 404s before this code runs, so the case is theoretically unreachable. Don't add defensive code.

---

## Browser support

- **Chrome / Edge ≥ 110**, **Firefox ≥ 110**, **Safari ≥ 17.4** — primary targets.
- **iOS Safari ≥ 17** — chat input keyboard handling not yet wired (Layer 3 owns the Capacitor `Keyboard` listener bridge from `iyo.11`-style pattern).
- **Capacitor v7 native shell** — runtime feature-detected; `BottomTabBar` already gates on `Capacitor.isNativePlatform()`. Chat input has not been tested on a physical device.

---

## How to reset everything

```js
// Run in the browser console on any (app) route to nuke all persistence.
// Useful when QA states drift or when verifying first-run paths.
Object.keys(localStorage)
  .filter(k => k.startsWith("clevroy") || k.startsWith("sidebar_state"))
  .forEach(k => localStorage.removeItem(k));
Object.keys(sessionStorage)
  .filter(k => k.startsWith("clevroy"))
  .forEach(k => sessionStorage.removeItem(k));
location.reload();
```

---

## Adding new flags / TODOs

When you flag a new issue here, prefix the heading with the same `F{n}` scheme so cross-references in code comments work (`// see Testing_And_Flags.md F7`). Bump `n` monotonically; don't reuse retired numbers.

When a flag is fixed, **don't delete it** — strike it through with `~~F7. trimToCap...~~` and add a one-line note pointing to the commit/PR. The history is more useful than a clean list.
