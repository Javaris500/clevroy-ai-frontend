# Clevroy Frontend — Routes Build Audit

Conversational companion to `docs/Clevroy_Routes_Inventory.md`. The inventory doc is the structured "what's where, what's status." This doc is the opinionated "what each page actually intakes, end to end, and what blocks it."

Pair them: inventory tells you the surface; this tells you the build cost.

Last written: 2026-04-28.

---

## Framing — what "intake" means here

"Intakes" means everything a page consumes to render and behave correctly:

- props
- store reads (Zustand, TanStack Query)
- server-rendered data
- user input devices (keyboard, mic, file picker, camera)
- third-party integrations (auth provider, Stripe, AI Gateway, R2, realtime)
- persistent storage (localStorage, sessionStorage, cookies, server DB)
- the upstream **decisions** that have to be made before the page can ship

Routes that look "almost done" often have unresolved intakes that are the actual blocker. The point of this audit is to surface those.

---

## 1. The auth / landing gates

These three pages aren't built yet (or are stubs), and they share one upstream decision that gates all of them: **the auth provider**. Until you pick — Supabase / Clerk / NextAuth-with-Supabase / Stack Auth / something else — none of these can ship and the rest of the app technically can't have real users.

### `/` — Landing

Today it's 26 lines: headline + two buttons. Real intake:

- brand assets (looping hero video or scene-strip animation)
- the marketing narrative (3 below-fold sections)
- footer with legal links
- *optionally* an auth-state check that redirects signed-in users to `/home`

The biggest decision isn't visual — it's whether marketing lives here or at `clevroy.com` and the app lives at `app.clevroy.com`. If split, this page becomes a single redirect and saves you weeks of marketing-site maintenance inside the product repo. If unified, you're building a marketing site — that's a different product.

### `/sign-in`

Pure auth-provider intake. Email + password form *or* magic-link form *or* OAuth buttons — depends entirely on the provider's UX patterns. It also intakes a `?returnTo=` query param so middleware-redirected users land back where they started. Error states (invalid creds, locked account, unverified email) are provider-specific. Don't design this until the provider is picked.

### `/sign-out`

Probably not even a page — should be a server action that clears auth cookies and redirects. Intake is the auth provider's session-clearing API. The interesting bit is the EC-N4 confirm dialog gate already wired in `ProfileChip.tsx` — that work survives whatever auth answer you pick.

### `/onboarding`

Two screens shipped (theme picker, "5 free films" CTA). Real intake to be solid:

- write `onboarding_completed_at` to the profile when step 2 finishes
- gate the route so users with that field set get bounced to `/home`

Today it's a freely-accessible URL — anyone can hit it and see the welcome flow over and over. Also: the AI Twin teaser is missing — should onboarding offer "record a 30-second voice sample now"? Probably yes for retention, but it's a 10x scope expansion if you do it right.

---

## 2. The chat surface — `/home` and `/films/[id]`

This is the most-built part of the app and it's already correct at the visual layer. The remaining intakes are all about Layer 4 and 5.

### `/home`

Already takes in:

- `firstName` (via ProfileProvider)
- the in-progress film (for the "Where we left off" pivot in the welcome line)
- the most recent film (for the "Previously" strip + CallSheetMeta)
- the balance string (for the FilmstripGauge)
- draft text (sessionStorage)
- aspect + style preferences (localStorage)

What it doesn't yet take in:

- real `useChat` from AI SDK v6
- voice-input audio
- attached files

The voice + paperclip slots are reserved real estate in the spec and they're real intakes — once wired, they need MediaRecorder permission flows, file-blob-to-R2 upload, and an attachment metadata shape on the user message.

The thing to flag specifically: the page intakes a *lot* of context-aware variants today (time-of-day greeting, type-on-once, in-progress redirect, idle pulse), and each one fires once on mount. When you add real `useChat`, those variants need to compose with the streaming state without rerunning the type-on every time a token arrives. That's a render-discipline problem more than a data problem.

### `/films/[id]`

This is the dense intake page. End-to-end it needs:

1. **Server-side hydration** of `thread_messages` for that `film_id`, passed to `useChat({ initialMessages })`. Today it's all client-side via Zustand persistence — fine for fixture, broken for cross-device.
2. **Supabase Realtime subscription** for `film:id=eq.{filmId}` and `scenes:film_id=eq.{filmId}` events, mapped to UI messages via the §7.2 mapping function in the spec.
3. **AI Gateway streaming** (`anthropic/claude-haiku-4-5`) for refinement intent parsing, with the six tool schemas (`reshoot_scene`, `cancel_generation`, `add_scene`, `change_music_style`, `change_voice_for_character`, `clarify_intent`) and the runtime voice filter wrapping every assistant text emission.
4. **Per-scene playback URL minting** when image+voice+music are co-located on the backend — that's what triggers the wow `scene_playback` card. The frontend takes this URL in via the realtime event; backend has to mint it.
5. **Catch-up REST endpoint** (`GET /api/films/{id}/messages?since={iso}`) for the leave-and-come-back case (Risk 6). The `useFilmRealtime` hook already plans for this; just needs the endpoint.
6. **Tool execution side-effects** — when the LLM calls `reshoot_scene`, the server route needs to talk to the backend's reshoot mutation, persist the `narration` + `system` messages bracketing the call, and emit them over the same UI message stream. Browser never holds the mutation surface.

The visual layer is ready for all of this. The wiring is what Layer 4 + 5 do.

The piece worth surfacing most: the `ScenePlaybackCard` is the single biggest emotional moment in the product. The frontend has the right design (autoplay-muted, mobile fallback, first-unmute Fraunces tooltip). The backend dependency is the per-scene MP4 mint — that's a non-trivial pipeline operation (image + voice + music co-located, frame-locked, encoded to a streamable format). If the backend mints these slowly, the wow moment stalls. The frontend's mitigation is the spec §3 anti-empty-stage rule — cycle the most-recent playback every 20s if no new one arrives — and that's also unwired today.

---

## 3. `/projects` — the archive

Already 630 lines. Intakes correctly today via `useInfiniteFilms` cursor pagination (fixtures). The real intake when Layer 5 lands:

- `GET /api/films?cursor=…&search=…&sort=…&filter=…` — backend needs to support cursor pagination + server-side search + status filter. If backend search isn't ready, the frontend has to do client-side filtering after fetching all results, which breaks beyond ~100 films.
- Three real mutations: `DELETE /api/films/{id}`, `PATCH /api/films/{id}` (rename), `POST /api/films/{id}/duplicate`. Each needs optimistic updates with TanStack Query's `useMutation` + `onMutate` rollback.
- Realtime invalidation: when a film state changes (e.g. completes), the recent items need to update without a manual refetch. `useFilmRealtime` already plans for this; the page needs to subscribe.

What's not designed yet: the in-progress film treatment in the grid. Today an in-progress card shows a "Shooting" badge but the card looks like every other card. Risk 2 (dead-thread silence) suggests the grid card should pulse or live-preview the latest scene. That's a design call, not just a wiring question.

The other open intake: bulk actions. Today only single-film overflow menus. Whether you ship "select 5 films, delete all" depends on usage patterns we don't have data for yet. Punt unless a user complains.

---

## 4. `/ai-twin` — capture + upload

Densest intake page after the chat surface. 516 lines of UI scaffold against zero real device APIs.

End-to-end it intakes:

- **Microphone access** via `navigator.mediaDevices.getUserMedia({ audio: true })` and `MediaRecorder`. Permission denial flow needs explicit copy ("Clevroy needs your microphone to learn your voice. Open browser settings to enable.").
- **File upload** for face photos — drag-drop OR click-to-upload (CC-3 keeps both for accessibility). Validate count (5–10), size (each ≤10MB?), format (jpg/png/heic). Generate previews via `URL.createObjectURL`.
- **Signed-URL upload flow**: `POST /api/twins/voice/upload-url` returns a one-time R2 URL; client `PUT`s the audio blob there; client tells backend the upload is done. Same pattern for face. This is a three-step contract that Backend_Handoff documents — frontend just needs to call it.
- **Training poll**: after kicking off training, the backend transitions a state field (`none → training → ready | failed`). Frontend either polls `GET /api/twins` every few seconds or subscribes to a realtime event. Polling is simpler; realtime is correct for the feel.
- **Failure UX intake** (EC-N10): three specific failure modes have specific copy. The third failure unlocks a help modal with photo/audio requirements. The 24-hour upload-hold (so users can retry without re-uploading) is a *backend* contract the frontend assumes.

What's not decided:

- multiple voice/face twins per account (today single)
- whether twins can be "named" (today implicit)
- the canonical-portrait selection step (when face training completes, does the user pick which photo is the canonical reference?)

All of these are open product questions.

The page is ready to wire as soon as the backend contract is up.

---

## 5. The settings sub-tree

Six routes (`/settings/account`, `/billing`, `/preferences`, `/notifications`, `/developer`, `/about`). They share a layout with a tabs strip; each is a separate URL so users can deep-link.

Two distinct patterns under one shell:

### Profile-mutating pages (`/account`, `/preferences`, `/notifications`)

Each form intakes the current profile state from ProfileProvider, lets the user edit a field, calls a profile-PATCH mutation, optimistically updates the provider on success. Same pattern repeated three times. The intake is the profile shape (`Profile` type in `src/types/api.ts`) plus per-field validation rules (display name length, email format, etc.). When Layer 5 ships the real `PATCH /api/me`, all three pages light up at once — no per-page work.

### Integration-dependent pages (`/billing`, `/about`, `/developer`)

Each takes in something the others don't.

- **`/billing`** intakes a Stripe Checkout session URL (or the customer-portal URL) and a list of recent invoices. `POST /api/billing/checkout-session` + `GET /api/billing/invoices`. The "credits" word exception inside this page is the only place in the product where the locked vocabulary bends — be careful with copy.
- **`/about`** intakes the build version, ideally from `process.env.npm_package_version` injected at build time, and links to four legal URLs that don't exist yet. The legal-page question is a build-vs-host call (in-app MDX vs external `clevroy.com/terms`).
- **`/developer`** intakes feature flags. There are no feature flags today — none have been declared — so this is an empty placeholder. When Layer 4's voice-filter and tool-router toggles ship, they belong here.

### `/settings/help`

404 today. Open question: FAQ accordion in-app vs external knowledge base + contact form vs both. The shape of the page is entirely downstream of that decision.

### Settings sequencing

If sequencing, treat all six as one design pass — get the form patterns right once (input + label + helper + error + submit), then apply across all of them. Today there are 1,119 total lines across the sub-tree, all in different idioms.

---

## 6. Edge / legal — the punt list

`/terms`, `/privacy`, `/licenses`, `/help`, `/docs`. None exist. All are referenced from settings/about and the sidebar.

The intake question for every one of these is: **do they live in the app or somewhere else?** If they live at `clevroy.com/terms`, you change the link target and never build the route. If they live in-app, you're hosting MDX inside the bundle and shipping legal updates through code deploys. Most products do the former. Assume external until someone says otherwise, and update the four link targets accordingly.

The exception is `/docs` — if Clevroy ships a public API later, in-app docs make sense (interactive, searchable, code-sample-driven). Today no API → external Notion / Mintlify is the right call.

---

## 7. Cross-cutting intakes (every page touches these)

- **Auth gate.** Every `(app)` route should be middleware-protected. No middleware exists today. When the auth provider is picked, `middleware.ts` at the repo root enforces session presence; unauthenticated requests redirect to `/sign-in?returnTo=…`. Until then, every `(app)` page is technically world-readable in a deployed environment.
- **Loading skeletons.** `loading.tsx` per route group can render token-perfect skeletons during server work. None exist today. The chat surface doesn't need one (client-rendered) but `/projects`, `/films/[id]`, `/settings/*` do.
- **Error boundaries.** Only `app/error.tsx` exists at the root. Per-route-group boundaries (`app/(app)/error.tsx`, `app/(app)/(chat)/error.tsx`) would isolate failures so a thread-render bug doesn't crash the whole shell.
- **Metadata.** No `generateMetadata` exports anywhere. Sharing a `/films/[id]` URL today gets a generic OG image. Each route should declare title + description + OG image. `/films/[id]` should generate per-film OG (the poster) once Layer 5 mints stable poster URLs.
- **Capacitor splash + native chrome.** When the Capacitor build ships, every route needs to play nice with `safe-area-inset-*` (mostly already done) and the Android hardware back button (already wired in `useCapacitorBackButton`). Splash screen, app icon, and deep-link routing are not yet configured.

---

## 8. The build-order recommendation

Given all of the above, the page-by-page order:

1. **Make the auth decision.** Until the provider is picked, six routes (`/sign-in`, `/sign-out`, the middleware gate, the `(app)/layout` auth check, and the onboarding completion gate) cannot ship. This unblocks the most surfaces with one decision.
2. **Resolve the marketing-site question.** Either reduce `/` to a redirect or commit to building the landing page. Either is fine; not deciding is the cost.
3. **Polish `/onboarding` end-to-end** (with the `onboarding_completed_at` gate wired). It's the second impression, and it's already the most-built unauthenticated surface.
4. **Layer 4 on the chat surface.** This is what makes `/films/[id]` actually do something. Six tool schemas, voice filter, AI Gateway wiring. `/home` + `/films/[id]` are visually validated; this turns them from a fixture demo into a working product.
5. **Layer 5 + the projects page.** Real backend contracts let `/projects` light up across pagination + mutations + realtime, and the chat surface becomes cross-device. These are the same backend work — projects gets it for free.
6. **AI Twin — full wiring.** Microphone, drag-drop with previews, signed-URL upload, training poll, EC-N10 failure modes. Densest single page; sequence it after Layer 5 because it shares the R2 + Supabase infrastructure.
7. **Settings sub-tree as one pass.** Account → Preferences → Notifications first (same pattern), then Billing (Stripe), then About + Developer + Help.
8. **Legal / docs / external links.** Resolve the host question, redirect or build accordingly.

Throughout, the cross-cutting items (auth middleware, loading skeletons, per-route error boundaries, metadata, native chrome) should be picked up incidentally as routes are touched — not done as a separate sweep.

---

## 9. The single most-blocking decision

**Pick the auth provider.** Almost every "what does this page intake?" question dead-ends at it. Six routes can't ship without it; every `(app)` route is technically world-readable without middleware; the onboarding gate has nowhere to write `onboarding_completed_at`; the profile-mutating settings pages have no `useUser()` to read against; the chat surface can't be cross-device because there's no session to attach `thread_messages` to.

Make that one call and the rest of the audit becomes executable.
