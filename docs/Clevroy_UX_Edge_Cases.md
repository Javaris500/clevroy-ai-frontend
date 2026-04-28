# Clevroy UX Edge Cases

**Document purpose:** The field manual for what goes wrong, what the product does about it, and how QA verifies the product actually does it. This is where the happy-path design decisions in `Clevroy_UI_Design_System.md` meet reality.

**Audience:** Frontend and backend engineers implementing survival behaviors, QA writing test plans, support triaging user reports.

**Status:** V1 — 20 cataloged edge cases across the generation screen and sidebar/navigation, 6 cross-cutting issues (dark mode, reduced motion, touch targets, keyboard, accessibility, copy tone), and 18 stress test prompts for manual verification. Every edge case maps to a test. Every test has an expected outcome and a fail condition.

**Inheritance:** Copy tone follows `Clevroy_Brand_Guide.md` §6. Layout and component behavior follow `Clevroy_UI_Design_System.md`. If a solution here contradicts those docs, the contradiction is a bug in this doc and needs reconciliation.

---

## 1. Operating Principles for Edge Cases

These are the tiebreakers when a new edge case is discovered and needs a quick call.

**1. Preserve progress.** If the user has partial work (a parsed script, 3 rendered scenes, a finished voice pass), every failure mode must preserve it. No error state should silently discard progress.

**2. Explain, don't apologize.** When something fails, state what failed in plain language and what the user can do. Never "Oops!" Never "Something went wrong." Always name the specific thing and offer the specific next action.

**3. Refund without asking.** If generation fails or is canceled, any films not consumed are returned to the user's balance automatically. No support ticket, no manual adjustment. Failed = refunded.

**4. The screen is not the source of truth.** Backend state is the source of truth. The UI catches up to backend state on reconnect, on tab refocus, on device switch. Never trust what the UI *thinks* is happening — always reconcile against the backend when returning to the screen.

**5. Degrade gracefully.** A single provider failure (fal.ai down, ElevenLabs rate-limited) doesn't kill the whole film. Partial films are a valid outcome — the user gets what succeeded and a clear reshoot path for what didn't.

**6. Consistency over cleverness.** In an edge case, a predictable behavior beats a clever one. If reconnection sometimes shows a toast and sometimes doesn't, that's worse than always showing the toast.

---

## 2. Generation Screen Edge Cases (10)

The centralized generation screen is the product's defining surface, so it's where the most edge cases live. Each case below has three parts: **what happens** (the scenario), **design problem** (what makes this hard), and **solution** (what the product does).

### EC-G1: User locks phone mid-generation, returns 10 minutes later

**What happens:** User starts a film on their phone. Midway through scene rendering, they lock the phone and put it in their pocket. Ten minutes later, they unlock the phone and open Clevroy again.

**Design problem:** Mobile OSes aggressively suspend backgrounded apps. The Supabase Realtime socket will have disconnected. The UI's local state reflects the moment of backgrounding, not reality. If we just show the stale UI, the user sees a frozen "Rendering scene 3..." that may actually be finished, failed, or on scene 6.

**Solution:** On app resume (Capacitor `App.addListener('resume', ...)` or `visibilitychange` on web), the UI fires a REST catch-up request to `/api/films/:id/state` that returns the current canonical backend state. The UI reconciles to that state before reopening the Realtime socket. If the backend says `complete`, the UI jumps directly to the completion phase with the play button ready. If it says `error`, the error state is shown. If it says the current scene is 6 instead of 3, the scene strip and center stage update to scene 6 with no reconnect animation — the user sees the truth, not the stale frame.

### EC-G2: Network drops for 30 seconds during scene rendering

**What happens:** User is on the generation screen. Their WiFi drops for 30 seconds, then returns. During that window, the backend renders two more scenes.

**Design problem:** The Realtime socket will fail silently if we don't detect disconnection. Even if we do detect it, we don't want to show a jarring full-screen error — generation is still happening on the backend.

**Solution:** A connection indicator watches the Realtime socket state. On disconnect, a `--color-warning` banner slides down from the top of the main panel: "Lost connection. Reconnecting..." Generation continues on the backend (the UI doesn't need connection to continue). On reconnect, the banner updates to "Reconnected." briefly (1 second), then fades. During the outage, the socket library retries with exponential backoff (1s, 2s, 4s, 8s, max 15s). When the socket reconnects, the UI fires the same `/api/films/:id/state` catch-up call as EC-G1 to fill in any missed events, then resumes live streaming. The activity feed shows any events that occurred during the outage in their real timestamps, not the reconnection timestamp.

### EC-G3: User starts generation on laptop, opens app on phone mid-generation

**What happens:** User pastes a script on their laptop, hits Start, watches for 30 seconds, then picks up their phone and opens Clevroy. The generation is still running.

**Design problem:** The phone has no local state for this film. Naively opening the app would land on Home with the film missing (because it's not "recent" yet — it doesn't exist). If the user navigates to the generation screen, it would be starting from zero.

**Solution:** On app open, if the user has an in-progress film, Home shows a "Film in progress" card at the top of the recent films row with a `--color-primary` border and a small live-dot indicator. Tapping it opens the generation screen on the phone with the current backend state streamed in — same code path as EC-G1's resume. Both devices watch the same generation in sync via the Realtime channel. Either device can cancel; canceling on one reflects on the other within 1 second.

### EC-G4: One scene fails (provider error), others succeed

**What happens:** Out of 7 scenes, scene 4 fails to render because fal.ai returned a 503 after retries exhausted. Scenes 1–3 and 5–7 succeed.

**Design problem:** We don't want to fail the whole film because of one scene. But we also can't silently ship a film with a blank scene 4. The user needs to know what happened and have a path forward.

**Solution:** The generation continues to completion for all other scenes. When the `final_concat` phase would normally run, the backend detects the missing scene and pauses. The UI flips to the `error` phase variant: center stage holds on the last successful scene (scene 3), scene strip shows scene 4 as `error` state (red border, red `!` icon in the corner), and the phase narration reads "We missed a shot. Scene 4 didn't render." The primary CTA is "Reshoot scene 4" (costs 0 films because it's a generation failure, not a regen). Secondary CTA is "Continue without it" which triggers concat with a 1-second black intertitle in place of scene 4 and marks the film as "Incomplete" in Projects. Films are only debited for successful generations — the 1 film is refunded if the user cancels here or partially refunded proportional to the scenes that failed if they continue incomplete.

### EC-G5: All fal.ai calls fail (provider outage)

**What happens:** fal.ai is down entirely. Every scene image call fails after the circuit breaker trips.

**Design problem:** Partial-failure (EC-G4) is recoverable in-flow; total provider failure isn't. We shouldn't just hammer the provider forever; we shouldn't leave the user staring at a spinner.

**Solution:** The circuit breaker trips after N consecutive failures for a provider (defined in the backend handoff doc). When tripped, the backend marks the film state as `error` with a reason of `provider_unavailable`. The UI shows the error phase with narration: "fal.ai is having trouble right now. Your script is saved and 1 film is back in your balance. We'll let you know when it's working again." Primary CTA: "Try again" (retries the chain). Secondary CTA: "Back to Create" (returns to input phase with the script preserved). The full 1 film is refunded automatically. The activity feed is preserved so the user can see what got further than what — this also helps support if the user writes in.

### EC-G6: User hits Cancel during generation

**What happens:** User clicks "Cancel generation" at any point mid-flow. A confirmation modal appears. User confirms.

**Design problem:** Celery tasks can't be force-killed mid-execution without potentially corrupting state. Partial outputs that are already uploaded to R2 need to not become zombies. Refund math needs to be right.

**Solution:** Clicking Cancel opens the confirmation modal: "Stop this generation? You'll get back any unused films." with [Keep going] [Stop]. On confirm, the UI immediately flips to a "Stopping..." state (disables further interaction on the generation screen, shows a minimal spinner for up to 5 seconds). The backend marks the film as `canceled`, any in-flight Celery tasks for this film check the cancel flag before starting the next step and abort. Already-uploaded R2 assets are deleted in a cleanup task. Credits are refunded based on phases not yet fully consumed: parse is free, character refs cost 10% of the film, scene images cost 50% total, voice + music cost 30%, assembly is free. Partial refunds are calculated in NUMERIC(8,2) precision and credited back to the user's balance. After backend confirms the cancel succeeded, UI returns to the Create page with the original script pre-filled in the textarea and a toast: "Stopped. {X.X} films refunded to your balance."

### EC-G7: Activity feed overflows with hundreds of events

**What happens:** A long, complex script produces a very detailed generation run. The activity feed accumulates 200+ events by the end.

**Design problem:** Keeping 200 DOM nodes in the feed can cause scroll jank, especially on mobile. But truncating loses context the user might want for debugging or just for the feeling of "I saw the whole thing happen."

**Solution:** Activity feed keeps the latest 50 events rendered in the DOM at any time. Older events are replaced by a collapsible "View earlier events (143)" button at the top of the feed when the count exceeds 50. Expanding loads the earlier events in batches of 50, virtualized via `react-virtual` or similar. All events are persisted in the database, so leaving and returning reloads them. On mobile, the collapsible threshold drops to 30 to be extra conservative on scroll performance.

### EC-G8: User rapidly clicks Reshoot on a scene after completion

**What happens:** After the film completes, the user is on the Results page. They click "Reshoot this scene" on scene 2. Before the new generation finishes, they click Reshoot on scene 2 again (or on scene 3).

**Design problem:** Without protection, we'd either double-bill them or queue up a race condition where the second regen overwrites the first mid-flight. Either is bad.

**Solution:** Reshoot buttons enter a disabled state immediately on click. The scene pill enters the `pending` state. The specific scene's Reshoot button stays disabled until the new generation completes or fails for that scene. Other scenes' Reshoot buttons remain clickable — you can reshoot scene 2 and scene 3 in parallel, but not trigger scene 2 twice simultaneously. If a Reshoot is somehow fired twice (e.g., a network retry), the backend idempotency key on the regen endpoint rejects duplicates with a 409 and the UI shows "That scene is already being reshot." as a small toast.

### EC-G9: Generation takes longer than expected (stuck phase)

**What happens:** The user has been staring at "Blocking the scenes..." for 4 minutes with no apparent progress. Either the provider is slow, something is stuck, or everything is fine and it's just a complex scene.

**Design problem:** If we don't acknowledge the slowness, the user assumes it's broken and refreshes (or cancels). If we add a reassurance too soon, we undercut the sense of momentum.

**Solution:** Track phase duration on the backend. If a phase exceeds its p95 expected duration (defined per phase in the backend handoff — e.g., `parsing` should be <20s, `scene_images_pending` should be <90s per scene), the backend emits a `phase_slow` event to the activity feed. The UI responds by adding a subline under the phase narration: "Taking a little longer than usual. Still shooting." No behavior change, no spinner switch — just an acknowledgment. If the phase exceeds the p99 threshold, the banner becomes: "This is running slow. You can wait or cancel — your script is saved either way." The cancel button in the corner becomes slightly more prominent (no change in position, but gains a subtle `--color-warning` border).

### EC-G10: User navigates away from the generation screen mid-flow

**What happens:** User is watching generation. They click the sidebar's "Projects" link. The generation is still in progress.

**Design problem:** We don't want to force users to stay on the screen. But we also don't want them to lose track of the film. If they come back an hour later, the generation has long since completed or failed, and we need them to be able to find it.

**Solution:** Clicking away from the generation screen is allowed at any time. No "are you sure" modal. As they navigate away, a small toast anchored to the bottom-right appears: "Your film is still being shot. Click to watch." for 4 seconds. The sidebar's Create nav item gains a small red dot indicator while any film is generating, visible across all pages. On Home, the in-progress film shows as a "Film in progress" card at the top of the Recent films row (same as EC-G3). When generation completes, a toast appears regardless of what page the user is on: "Your film is ready. Take a look." with a Watch button. If generation errors, the toast is `--color-warning` colored: "Your film hit a problem. We saved what finished." with a View button.

---

## 3. Sidebar & Navigation Edge Cases (10)

### EC-N1: User on mobile, tries to use sidebar muscle memory

**What happens:** User has used Clevroy on desktop, becomes used to the left sidebar. They open the app on mobile and instinctively swipe from the left edge looking for the sidebar.

**Design problem:** The mobile nav is a bottom tab bar, not a left drawer. A left-edge swipe that does nothing feels broken. But adding a left drawer just because that's the expected gesture creates two competing nav patterns.

**Solution:** A left-edge swipe on mobile is intentionally inert — nothing slides in. Instead, on the user's first three app opens on mobile, a subtle one-time hint appears: the bottom tab bar's center Create button gets a brief (2s) `--color-primary-soft` glow on first open, and a tiny caption "Tap Create to start a film" appears below the center button for 3 seconds then dismisses. The hint is persisted as dismissed after three shows or any tab bar interaction. This trains the bottom-bar pattern without creating redundant nav.

### EC-N2: Films balance drops to 0 mid-session

**What happens:** User has 1 film, starts a generation, it completes successfully. They return to Home. They click "Start a new film." They have 0 films.

**Design problem:** We don't want to let them write a whole script and then block at the Start button. We also don't want a hard wall that feels like a punishment.

**Solution:** The Create page's input phase is still fully accessible at 0 films — users can write, paste, pick a style. The primary CTA at the bottom becomes "Buy more films to start" (disabled for starting, enabled for purchase). The subline above the CTA changes from "This will use 1 film from your balance" to "You're out of films. Grab more to start shooting." The sidebar's films balance badge flips from its normal state to a `--color-primary-soft` background with a small pulse to draw attention. If the user buys films from this page, the balance updates via Realtime, the CTA flips back to "Start your film" and enables, and the user can hit Start without leaving the Create page.

### EC-N3: Sidebar collapsed state on tablet breaks a user's flow

**What happens:** User is on a tablet (768–1023px) where the sidebar is collapsed by default. They can't remember which icon is which.

**Design problem:** Icon-only navs have a learning curve. Tooltips help on hover but hover is finicky on touch tablets.

**Solution:** On tablet, the collapsed sidebar has a 48px expand button at the top ("›" chevron icon) that toggles it open. When expanded, the user's preference is stored in Zustand and persisted to localStorage; on next visit the sidebar respects that preference. Tooltips on hover still work for mouse users. On touch-only tablets (iPad Pro), a long-press on any sidebar icon shows the label as a popover for 2 seconds. The expand button is always visible so the user can toggle full sidebar at any time.

### EC-N4: User signs out mid-generation

**What happens:** User is watching generation. They open their profile menu and click Sign out.

**Design problem:** Signing out kills the Supabase session, which kills the Realtime channel. The generation is tied to their user ID on the backend and continues running, but they can't observe it. If they don't know that, they'll assume it's canceled.

**Solution:** Clicking Sign out during active generation opens a confirmation modal: "Sign out? Your film will keep shooting — you'll see it the next time you sign in." with [Stay signed in] [Sign out]. If they confirm, the session ends, they're redirected to the landing page. The backend generation continues unchanged. When they sign back in later, Home will show the film (completed, errored, or still in progress if <15 minutes elapsed) with the same in-progress handling as EC-G3.

### EC-N5: Session expires while on an authenticated page

**What happens:** User leaves a tab open overnight. Their Supabase session token expires. They come back and try to click something.

**Design problem:** Clicking a nav link with an expired token results in a failed API call. Without handling, the user sees a broken UI with no explanation. Auto-redirecting to sign-in drops them somewhere they weren't expecting.

**Solution:** Supabase's auth listener detects session expiration. On detection, the app:
1. Preserves the user's current URL in sessionStorage under `clevroy_return_to`
2. Shows a non-dismissable modal: "You've been signed out. Sign in to pick up where you left off." with a single [Sign in] CTA
3. On successful sign-in, redirects back to the preserved URL

If the user was mid-script on Create, the script draft is also preserved in sessionStorage (draft saved every 2 seconds while typing via debounced effect) and restored after sign-in.

### EC-N6: User opens two tabs simultaneously

**What happens:** User opens Clevroy in two browser tabs. Starts a generation in tab A. Switches to tab B. Navigates to the generation screen for the same film.

**Design problem:** Both tabs will subscribe to the same Realtime channel, both will catch up via the REST call. If they both try to send events (like cancel), race conditions are possible.

**Solution:** Both tabs can read the same film state simultaneously without issue — Realtime subscriptions are fine with multiple subscribers. For write operations (cancel, reshoot), idempotency keys on the backend ensure only one action succeeds. In tab B, if the user clicks Cancel after tab A already canceled, the backend returns the already-canceled state and tab B's UI reconciles — no error shown, it just reflects the cancellation. Both tabs stay in sync via Realtime.

### EC-N7: User's balance shows one number in sidebar, another on Create page

**What happens:** User has 3 films. Starts a generation (which debits 1). While generation is running, they open another tab and go to Create. The sidebar might show 2, the Create page might show 3 — stale data from different fetches.

**Design problem:** Multiple components fetching the same data at different times leads to visual inconsistency, which erodes trust in balance accuracy.

**Solution:** Films balance is a single Zustand store value, sourced from the backend on app load and updated via Realtime. Any component that displays balance reads from that store — sidebar badge, Create page subline, Buy more films button label. Balance is updated on three events: (1) successful generation debit, (2) successful purchase credit, (3) refund on cancel/error. All three come through Realtime with an authoritative new value; the UI snaps to the new value with a 200ms count-up animation from the old value. Never shows two different numbers at the same time.

### EC-N8: Deep link to a film that doesn't exist or doesn't belong to the user

**What happens:** User clicks a link like `/films/abc123` from an email or shared URL. The film ID either doesn't exist, has been deleted, or belongs to a different user.

**Design problem:** We don't want to reveal whether a film exists but belongs to someone else (that's an information leak). We also don't want a generic 404 because the user might have a valid reason they're expecting to see it.

**Solution:** For both "doesn't exist" and "belongs to someone else," the page shows the same state: "We couldn't find that film. It may have been deleted or moved." with a "Back to your films" CTA. The 404 and 403 responses from the backend are indistinguishable to the client by design. For films the user has soft-deleted (within the 30-day recovery window), the page instead shows: "You deleted this film on {date}. It will be permanently removed on {date + 30 days}." with a Restore button.

### EC-N9: User tries to delete a film while it's still generating

**What happens:** User starts a generation, navigates to Projects, and clicks Delete on the in-progress film.

**Design problem:** Deleting a generating film needs to also cancel the generation cleanly, refund appropriately, and clean up any uploaded partial assets.

**Solution:** Delete is blocked for in-progress films. The delete button on an in-progress film card is disabled with a tooltip: "Still being shot. Cancel first, then delete." Clicking the disabled button opens the three-dot menu and highlights "Cancel generation" instead. Once canceled, the user can delete normally. This keeps cancel and delete as two distinct operations with clear sequencing.

### EC-N10: AI Twin training fails mid-upload

**What happens:** User uploads 8 face reference photos to AI Twin. The upload completes, but the training task fails (e.g., face-detection model couldn't find a consistent face, or R2 upload was corrupted).

**Design problem:** The user has invested effort uploading photos. Losing them and asking to start over is frustrating. But we also can't just silently retry forever.

**Solution:** On training failure, the Face Twin card shows a `--color-warning` state with the error reason in plain language: "We couldn't train from these photos. Most often this happens when the faces aren't clearly visible or are too different from each other." The uploaded files are preserved on R2 for 24 hours. The card offers two actions: "Try again with these photos" (re-runs training without re-upload) and "Start over" (deletes uploads, clears the card). If the user picks "Try again" and it fails twice more, the card adds a tips link: "Why this might be failing" — opens a help modal with photo requirements (well-lit, face front-on, similar person, 5+ photos).

---

## 4. Cross-Cutting Issues (6)

Edge cases that aren't tied to a single screen but apply across the product.

### CC-1: Dark mode as the default is a choice, and some users will hate it

**What happens:** A user opens Clevroy for the first time, sees the dark interior, and finds it uncomfortable. They want light mode.

**Design problem:** Dark is the intentional default (screening-room feel, video content looks better). But forcing dark on users who prefer light is anti-accessibility. At the same time, auto-detecting `prefers-color-scheme: light` and immediately switching away from our intended look undermines the brand.

**Solution:** First-time visitors see dark mode regardless of system preference — this is a brand choice. Onboarding includes a single-screen theme preference step: "Clevroy's studio mode is dark by default. Switch to light if you prefer." with a [Keep dark] [Switch to light] choice. This surfaces the choice explicitly rather than either imposing dark or silently following system preference. Their choice is persisted and respected on every subsequent session. Settings > Preferences has a three-way toggle: Light / Dark / System.

### CC-2: Reduced motion users miss the generation vibe

**What happens:** User has `prefers-reduced-motion: reduce` enabled. The phase narration crossfades, the ken-burns zoom, the scene strip pulse, the activity feed slide-ups — all of these are disabled. The result feels static and less magical.

**Design problem:** The "watching your film come together" feeling depends partly on motion. Stripping it all leaves a bare-bones version that doesn't hit the same way. But forcing motion on users who can't tolerate it isn't an option.

**Solution:** Reduced motion doesn't mean no motion — it means meaningful motion only. The spec in Design System §11.4 is preserved: phase narration still crossfades (150ms, not 450ms) because the phase change needs to feel intentional. Everything else goes static. To compensate for the lost sense of activity, the activity feed is extra-prominent for reduced-motion users: its panel gets a slightly larger proportion of the vertical space (20% instead of 16%), ensuring the user can still feel progress through the stream of events. No special copy or explanation — the experience is meaningfully different but still complete.

### CC-3: Touch targets work on paper but fail in practice

**What happens:** The Design System says 44×44 px minimum touch targets. But a real user with large fingers, on a phone in bright sun, trying to tap the three-dot menu on a crowded Projects grid, misses it.

**Design problem:** Meeting the minimum spec is not the same as being easy to use. Dense layouts make even 44px targets frustrating in practice.

**Solution:** Apply "hit target > visual target" — the visible icon can be 20px but its clickable hit area extends via padding to 44×44 px or more. On the Projects grid, the entire film card is clickable (opens Results) except for explicit overflow areas (three-dot button, which gets its own 48×48 px hit area isolated from the card click via `stopPropagation`). On the generation screen, scene strip pills have 8px gap between them; increase the hit area via outside-pill padding so adjacent taps don't register on the wrong pill. Test cases in section 6 explicitly cover this.

### CC-4: Keyboard users can't reach everything

**What happens:** Keyboard-only user tabs through the generation screen. The activity feed is reachable but the individual log entries aren't keyboard-focusable. The scene strip is a row of divs without roving tabindex.

**Design problem:** Custom components (the scene strip, the activity feed) need explicit keyboard affordances. Default Tab order is wrong for roving-focus patterns like the scene strip.

**Solution:** The scene strip implements a roving tabindex pattern — the row is a single tab stop, Arrow keys navigate between pills, Enter activates. Each pill has `role="button"` and the right aria attributes. The activity feed is a single `aria-live` region for screen readers, but individual entries are not tabbable — that would be noise. If a user needs to read past entries, they can expand the feed (which brings all entries into DOM) and their screen reader handles traversal via its own commands. Modals and dropdowns use shadcn's built-in focus trapping. The sidebar is arrow-key navigable top-to-bottom, Enter activates, and the active item's tabindex is 0 while the others are -1.

### CC-5: Accessibility gaps in custom animations

**What happens:** The phase narration crossfade, the waveform animation during voice synthesis, the ken-burns zoom on scene images — none of these announce themselves to a screen reader. A blind user gets nothing about what phase the film is in.

**Design problem:** Visual motion is invisible to screen readers by definition. The phase narration text is announced, but the underlying change (what's on center stage now) isn't.

**Solution:** The phase narration block is the canonical screen-reader source of truth for "what's happening now." Its `aria-live="polite"` announces every phase change. Visual animations are always `aria-hidden`. The scene strip pill states are announced too — when a scene changes from pending to ready, an invisible `aria-live="polite"` region says "Scene 3 ready." The activity feed's `aria-live` is throttled (one announcement per 3 seconds max) to avoid overwhelming. Error states announce with `aria-live="assertive"` to interrupt whatever the user was last reading. Complete phase announces: "Your film is ready. Press Enter to play." with focus auto-moved to the play button.

### CC-6: Copy tone slips under pressure

**What happens:** Engineers writing strings in a rush, or third-party error messages from providers bubbling up verbatim. The user gets "ERR_PROVIDER_503" instead of "fal.ai is having trouble right now."

**Design problem:** Copy discipline is hard to enforce at the implementation layer. It's also impossible to pre-write every possible error message, especially for provider-originated errors.

**Solution:** Three defenses, in order:
1. **All user-facing strings route through a single module** (`lib/copy.ts`) with typed keys. No raw strings in JSX unless they're passed through this module. This forces engineers to add a copy entry, which a PR reviewer can catch.
2. **Provider errors are wrapped** by a mapping layer in the backend before surfacing to the client. Unknown provider error codes map to a generic friendly message: "Something didn't go through. We're retrying." Known error codes have specific wrappings: rate limit → "We're shooting too fast. Slowing down a bit." Provider down → "{Provider} is having trouble right now."
3. **A copy audit runs in CI** on every frontend PR — greps for banned words from Brand Guide §6.3 (Oops, magical, seamless, etc.) and fails the build if found. A linting rule that respects brand voice.

---

## 5. Stress Test Prompts (18 tests)

These are the exact tests QA runs to verify each edge case is handled. Every test has: setup (what to do before the test), the test itself (the action), expected outcome (what the product should do), and fail conditions (when to file a bug).

Most tests reference a specific edge case (e.g. EC-G1, CC-3) so failures trace back to a design decision. Tests that cover multiple edges are tagged accordingly.

Format: **SETUP → TEST → EXPECTED → FAILS IF.** Tester should record each test's pass/fail with a note on actual behavior.

---

### TEST-01: Mobile lock-and-resume mid-generation

**Covers:** EC-G1

**SETUP:** On a mobile device (iOS or Android), sign in with an account that has ≥1 film. Start a new film generation with a script long enough to take ~3 minutes (aim for 5+ scenes).

**TEST:** When the generation reaches the `scene_images_pending` phase (you see "Blocking the scenes..."), press the lock button on the phone. Wait 10 minutes. Unlock and reopen the Clevroy app.

**EXPECTED:** Within 3 seconds of opening the app, the generation screen displays the current canonical state from the backend. This might be a later phase than when you locked (e.g., `voice_synthesis` instead of `scene_images_pending`), or it might be `complete`. The scene strip reflects the current scene count accurately. No spinner, no "reconnecting" banner persisting, no blank center stage.

**FAILS IF:** The UI shows the same phase it was on at lock time (stale state). The scene strip shows fewer completed scenes than the backend reports. The app hangs on a spinner for more than 3 seconds. Any toast says "Reconnected" or "Welcome back" — the reconciliation should be silent.

---

### TEST-02: Network drop during scene rendering

**Covers:** EC-G2

**SETUP:** On desktop or mobile. Start a generation. Wait until the generation reaches a scene-rendering phase.

**TEST:** Disable network (airplane mode on mobile; disable WiFi + cellular on laptop). Wait 30 seconds. Re-enable network.

**EXPECTED:** Within ~2 seconds of network dropping, a `--color-warning` banner slides down from the top of the main panel: "Lost connection. Reconnecting..." The banner stays visible during the outage. The scene strip and center stage do not freeze — they remain visible but don't update. Within ~5 seconds of network returning, the banner updates to "Reconnected." and fades after 1 second. The UI catches up to any scenes that completed during the outage within ~3 seconds of reconnection; those scene pills update to ready state, and activity feed shows the events with their original backend timestamps.

**FAILS IF:** No banner appears on disconnect. Banner appears but never clears. After reconnection, scene pills or activity feed don't catch up to missed events. The UI shows an error page or forces a full reload.

---

### TEST-03: Cross-device generation watching

**Covers:** EC-G3

**SETUP:** Two devices signed into the same account. One desktop, one mobile.

**TEST:** Start a generation on desktop. Wait until the scene_images_pending phase begins. Pick up mobile and open the Clevroy app (app should be fully closed or backgrounded first).

**EXPECTED:** On mobile, Home shows a "Film in progress" card at the top of the recent films row with a red dot / live indicator. Tapping the card opens the generation screen on mobile showing the current backend state. Both devices now show the same phase. As new scenes complete, both devices update within ~1 second of each other.

**FAILS IF:** Mobile Home shows no indication of an in-progress film. The card is there but tapping it doesn't open the generation screen. Mobile shows stale state from a previous session. The two devices drift more than 3 seconds apart on phase updates.

---

### TEST-04: Cancel mid-generation and verify refund

**Covers:** EC-G6

**SETUP:** Account with exactly 3 films. Note the balance precisely.

**TEST:** Start a generation. Wait until the `voice_synthesis` phase begins (about 30% of the way through). Click "Cancel generation" in the bottom-right of the main panel. Confirm cancellation in the modal.

**EXPECTED:** The UI flips to a brief "Stopping..." state for ≤5 seconds, then returns to the Create page with the original script pre-filled in the textarea. A toast appears: "Stopped. {X.X} films refunded to your balance." The films balance badge in the sidebar increments from 2 to 2.X (where X is the fractional refund — parse and character refs are already consumed, partial credit for scene images). Check the balance: you should have more than 2 but less than 3 films. Navigate to Settings > Billing; the purchase history / credit log shows the refund line item.

**FAILS IF:** The Cancel confirmation modal doesn't appear. After confirming, the UI stays on the generation screen. The balance doesn't increase. The refund is the full 1 film (should be partial since some phases ran). The script is lost from the Create textarea after return. No toast appears. The credit log doesn't show a refund entry.

---

### TEST-05: Simulated provider failure for a single scene

**Covers:** EC-G4

**SETUP:** Requires backend cooperation or a test-mode toggle. In a staging environment with a test-mode flag that forces one scene to fail, start a generation with a script of 5+ scenes.

**TEST:** Run the generation through to where scene 3 fails (or whichever scene is forced-failed).

**EXPECTED:** The other scenes complete normally. When the normal flow would move to `final_concat`, the UI instead shows the error phase variant. Center stage holds on the last successful scene. Scene strip shows scene 3 with a red `!` icon and red border. Phase narration reads: "We missed a shot. Scene 3 didn't render." Primary CTA: "Reshoot scene 3" (shown with "free" or "no film cost" indicator). Secondary CTA: "Continue without it."

Clicking "Reshoot scene 3" restarts just that scene. The user's films balance is not debited for the reshoot (it's a generation failure, not user-initiated regen). On success, the film continues to `final_concat` and completes normally.

Clicking "Continue without it" assembles the film with a 1-second black intertitle for scene 3. The film is marked as "Incomplete" in Projects. A partial refund is credited (proportional to the scene cost).

**FAILS IF:** The whole film errors when just one scene fails. The reshoot debits a film charge (should be free for generation failures). The "Continue without it" option produces an invalid video file or hangs. No partial refund on the incomplete path. The film completes normally with a visible broken/blank scene and no indication to the user.

---

### TEST-06: Rapid-fire reshoot button clicks

**Covers:** EC-G8

**SETUP:** Account with a completed film. Open the Results page.

**TEST:** On scene 2's three-dot menu, click "Reshoot this scene." Confirm in the modal. Immediately (within 1 second), try to click the same "Reshoot this scene" button again. Also try clicking it a third time rapidly.

**EXPECTED:** Only the first click starts a reshoot. The Reshoot button for scene 2 enters a disabled state immediately after the first confirm. The scene 2 pill enters the `pending` state. Additional clicks on scene 2's reshoot do nothing (button is disabled). If the user can click fast enough to fire the second request to the server, the server returns a 409 and the UI shows a small toast: "That scene is already being reshot."

Meanwhile, Reshoot on scene 3 (a different scene) should still be clickable — parallel reshoots of different scenes are allowed.

**FAILS IF:** Two reshoot jobs fire simultaneously (double-bill). The scene 2 reshoot button stays clickable after the first click. Clicking scene 3's reshoot is blocked because scene 2 is mid-regen.

---

### TEST-07: Deliberately slow phase detection

**Covers:** EC-G9

**SETUP:** Staging environment with a test toggle that forces a phase to exceed its p95 duration (e.g., holds `scene_images_pending` for 3+ minutes).

**TEST:** Start a generation. Wait for the slowness flag to trigger.

**EXPECTED:** When the phase exceeds p95 duration, an activity feed entry appears: "Taking a little longer than usual." A subline appears under the phase narration: "Taking a little longer than usual. Still shooting." No other UI changes — position, size, colors unchanged except for the subline addition.

If the phase exceeds p99 duration, the subline updates: "This is running slow. You can wait or cancel — your script is saved either way." The Cancel link in the bottom-right gains a subtle `--color-warning` border (no movement).

**FAILS IF:** No slowness indicator appears at p95 threshold. The UI changes layout or position when the indicator appears (should be additive). The Cancel link becomes too prominent or jumps position at p99.

---

### TEST-08: Navigate away mid-generation, return later

**Covers:** EC-G10

**SETUP:** Account with ≥1 film. Start a generation.

**TEST:** Part 1: Click the sidebar's "Projects" link while generation is in progress. Observe what happens.
Part 2: Wait for the generation to complete in the background (watch another tab or a second device to confirm completion).
Part 3: From Projects page, navigate to Home.

**EXPECTED:**
- Part 1: Navigation succeeds without a confirmation modal. A toast appears bottom-right: "Your film is still being shot. Click to watch." (auto-dismisses after 4 seconds). The Create nav item in the sidebar gains a small red dot indicator.
- Part 2: When the generation completes, a toast appears on whatever page the user is on: "Your film is ready. Take a look." with a Watch button.
- Part 3: Home shows the completed film in the Recent films row, with a "New" badge until it's been viewed. The sidebar Create's red dot indicator has cleared.

**FAILS IF:** Clicking away prompts a confirmation modal (should not — user can leave freely). The toast never appears. The red dot on Create doesn't appear or doesn't clear. The completion toast doesn't appear if the user is not on the generation screen. The "New" badge on Home persists after the film has been clicked/viewed.

---

### TEST-09: 200+ event activity feed on mobile

**Covers:** EC-G7

**SETUP:** Mobile device. A test-mode generation that produces 200+ activity feed events (e.g., verbose logging mode, or a script with 20+ scenes).

**TEST:** Let the generation run. Observe the activity feed throughout.

**EXPECTED:** The feed's DOM node count stays bounded at ~30 entries (mobile threshold). Once the feed exceeds 30, a "View earlier events (N)" button appears at the top. The feed continues to render new events smoothly at the bottom — scroll is not janky. Tapping "View earlier events" expands 30 more, and the button updates to "View earlier events (N-30)." All events are persisted; reopening the film later still shows the full history.

**FAILS IF:** Scroll jank becomes visible as events accumulate. The whole feed renders in DOM (check with devtools — should never exceed ~60 entries rendered at once). The "View earlier events" button doesn't appear. Expanded events are lost on scroll-up within the same session.

---

### TEST-10: Mobile left-edge swipe training hint

**Covers:** EC-N1

**SETUP:** Fresh install of the Clevroy mobile app, or clear local storage for the web app on mobile. Sign in (or sign up).

**TEST:** On first three app opens, observe the bottom tab bar.

**EXPECTED:** On each of the first three opens, the center Create button briefly glows with `--color-primary-soft` for 2 seconds, and a small caption "Tap Create to start a film" appears below the button for 3 seconds. Attempting a left-edge swipe does nothing (no sidebar slides in). After the third opening, or after any interaction with the tab bar (tapping any button), the hint stops appearing.

**FAILS IF:** A left-edge swipe opens a sidebar drawer (should not exist on mobile). The hint doesn't appear. The hint appears more than three times. The hint continues after the user has tapped any tab bar button.

---

### TEST-11: Films balance depletion and purchase flow

**Covers:** EC-N2

**SETUP:** Account with exactly 1 film.

**TEST:** Part 1: Start a generation. Wait for it to complete successfully.
Part 2: After completion, navigate to Create. Balance is now 0.
Part 3: On the Create page, observe the state and try to start a new film.
Part 4: Purchase more films via the CTA.

**EXPECTED:**
- Part 2: The sidebar's films balance badge shows "0 films left" with a `--color-primary-soft` background and subtle pulse.
- Part 3: The Create page input phase is fully accessible. The user can write, paste, and pick a style. The primary CTA reads "Buy more films to start." The subline above the CTA reads: "You're out of films. Grab more to start shooting."
- Part 4: Purchase flow opens. On successful purchase, the balance updates via Realtime. Sidebar badge flips back to normal. Create page CTA flips to "Start your film" and enables. No page reload or navigation is required — the user can hit Start without leaving the Create page.

**FAILS IF:** Create page input is blocked when balance is 0. The CTA just says "Start your film" but is disabled without context. The user is force-navigated to a pricing page instead of staying on Create. After purchase, the CTA doesn't update without a page reload.

---

### TEST-12: Sign out mid-generation, sign back in

**Covers:** EC-N4

**SETUP:** Account with ≥1 film. Start a generation.

**TEST:** While generation is in progress, click the profile chip, click Sign out. Confirm in the modal. Wait 1–2 minutes. Sign back in.

**EXPECTED:** Sign out confirmation modal says "Sign out? Your film will keep shooting — you'll see it the next time you sign in." After confirming, the user is redirected to the landing page. On the backend, the generation continues. When signing back in, the user lands on Home. If the generation is still in progress (<15 min elapsed), the "Film in progress" card is at the top of Recent films with the live indicator. If complete, the film appears as a normal recent film with a "New" badge. If errored, the film appears with a warning indicator.

**FAILS IF:** Signing out cancels the generation. The confirmation modal text is different or missing. After signing back in, the generation's state is unclear from Home. The Film in progress card doesn't appear during an active generation.

---

### TEST-13: Session expiration with unsaved work

**Covers:** EC-N5

**SETUP:** Sign in. Navigate to Create. Start typing a script (get to 200+ characters). Do NOT click Start. Leave the tab open overnight or manually expire the Supabase session token.

**TEST:** Return to the tab the next morning. Try to click the Start your film button, or click any sidebar link.

**EXPECTED:** The app detects the expired session. A non-dismissable modal appears: "You've been signed out. Sign in to pick up where you left off." with a single [Sign in] button. Clicking the button routes to the sign-in screen. After signing in, the user is redirected back to Create, and the script they were writing is restored in the textarea.

**FAILS IF:** The expired session results in a cryptic error. The user is redirected to sign-in without preserving the return URL. The script draft is lost. The modal is dismissable (should force sign-in).

---

### TEST-14: Two-tab state sync

**Covers:** EC-N6, EC-N7

**SETUP:** Desktop browser. Sign in. Account with ≥1 film.

**TEST:** Open Clevroy in Tab A and Tab B (same account). In Tab A, start a generation. Observe Tab B.

**EXPECTED:** Tab B's sidebar films balance updates to reflect the debit within ~1 second. Tab B's Home (or wherever it is) also shows the in-progress film indicator. Navigate Tab B to the generation screen for the same film — it shows the live state in sync with Tab A. From Tab B, click Cancel generation, confirm. Tab A's UI immediately reflects the cancellation (flips to "Stopping..." then back to Create). The refund appears in both tabs' balance badges.

**FAILS IF:** Tab B's balance is out of sync with Tab A. Canceling from one tab doesn't propagate to the other. Both tabs try to send their own cancel request and one of them errors in an unfriendly way.

---

### TEST-15: Dense touch target accuracy on mobile

**Covers:** CC-3

**SETUP:** Mobile device. Account with ≥10 films in Projects. Dark mode. Ideally outdoor/bright-sun conditions or simulate with reduced contrast.

**TEST:** Open Projects. Try to tap the three-dot overflow menu on a film card. Repeat 10 times on different cards. Then try to tap the center of a film card to open its Results page. Repeat 10 times.

**EXPECTED:** All 10 three-dot menu taps open the overflow menu (not the card). All 10 card body taps open the Results page. Tap accuracy is at or near 100%. Visual feedback (subtle press state) is immediate on tap.

**FAILS IF:** Three-dot menu taps sometimes open the Results page instead (target overlap). Card body taps sometimes miss and do nothing. Tapping near the three-dot button accidentally opens the menu (hit area too generous in the wrong direction). More than 1 out of 10 taps misfire.

Also run this test on the scene strip pills during generation: tap each scene pill 10 times and confirm the correct pill is selected every time.

---

### TEST-16: Keyboard-only navigation through the app

**Covers:** CC-4

**SETUP:** Desktop browser. Account with ≥1 completed film. Keyboard only (don't touch the mouse during the test).

**TEST:** Starting from the Home page, use only Tab, Shift+Tab, Arrow keys, and Enter to:
1. Navigate to Projects via the sidebar
2. Open a film's Results page
3. Navigate to a scene in the scene strip
4. Open the scene's three-dot menu
5. Select "Reshoot this scene"
6. Confirm or cancel in the resulting modal

**EXPECTED:**
- Focus is visible at every step (2px `--color-ring` outline)
- Sidebar is arrow-key navigable; Enter activates the focused item
- Film cards on Projects are Tab-reachable; Enter opens them
- Scene strip uses roving tabindex: Tab enters the strip once, Arrow keys move between pills, Enter opens the pill's preview or menu
- Three-dot menu is reachable; Arrow keys navigate menu items, Enter selects
- Modal traps focus (Tab cycles within modal), Escape closes the modal
- After closing the modal, focus returns to the button that opened it

**FAILS IF:** Any of the steps above can't be completed with keyboard alone. Focus outline is missing at any step. Tab order jumps unexpectedly or skips interactive elements. Modal doesn't trap focus (Tab escapes to the page behind it). After modal close, focus is lost to `<body>` instead of returning to the trigger.

---

### TEST-17: Screen reader on generation screen

**Covers:** CC-5

**SETUP:** Desktop with a screen reader enabled (VoiceOver on macOS, NVDA or JAWS on Windows). Start a generation.

**TEST:** Let generation run for 2 minutes. Listen for screen reader output during each phase transition.

**EXPECTED:**
- Every phase transition is announced politely. Example announcements: "Reading your script. Understanding your story, scene by scene." then later "Blocking the scenes. Working on scene 3 of 7."
- Scene strip state changes are announced: "Scene 3 ready." (when a scene finishes)
- Activity feed announcements are throttled (no more than 1 every 3 seconds)
- If an error occurs, it's announced assertively: "We missed a shot. Scene 4 didn't render. Reshoot scene 4 available."
- Completion announces: "Your film is ready. Press Enter to play." Focus moves automatically to the play button.
- Visual-only animations (ken-burns zoom, waveforms, pulsing borders) are not announced (they're aria-hidden).

**FAILS IF:** Phase changes aren't announced. Activity feed spams the screen reader with every single event. Errors don't interrupt ongoing reading. Completion doesn't move focus. Visual animations are announced (shouldn't be).

---

### TEST-18: Copy voice audit

**Covers:** CC-6

**SETUP:** Complete access to the app (not just as a user — also the codebase for the CI check).

**TEST:** Part 1: Manually click through every page of the app, every error state, every modal, every empty state. Note any copy that reads as generic software-style language.
Part 2: Run the CI copy audit lint rule against the frontend codebase. Review the rule's output.

**EXPECTED:**
- Part 1: No occurrences of "Oops," "Something went wrong," "Generate Now," "Retry," "Magical," "Seamless," "Unleash," "Simply," or any emoji in product UI (marketing is separate). Errors use the pattern "{Specific thing} didn't {specific action}." Primary CTAs use "Start your film," "Reshoot this scene," "Take it home," "Keep it" / "Delete it" for confirmations, "Buy more films" for upgrades. Balance shown as films, not credits.
- Part 2: The CI lint rule runs against every frontend PR. Banned words list matches Brand Guide §6.3. Raw string usage outside `lib/copy.ts` is flagged. The rule fails the build on violations.

**FAILS IF:** Any banned word appears in user-facing copy. Provider error codes (like "ERR_503" or "fal_api_error") leak into the UI. The word "credits" appears in user-facing copy outside Settings > Billing line items. CI rule doesn't run or doesn't block PRs.

---

## 6. Test Execution Notes

### 6.1 Cadence

- **Before every beta launch or major release:** Run all 18 tests. Required for go/no-go.
- **Weekly during active development:** Run tests for any edge cases in areas touched that week.
- **On bug reports:** If a user reports an issue that maps to an existing edge case (EC-G, EC-N, or CC), run the corresponding test to reproduce before fixing.

### 6.2 What "pass" means

A test passes if every line of the EXPECTED section is observed. A single FAILS IF condition triggered is a fail — don't partial-credit. Document exactly what happened in the fail case (screenshots, network tab traces, backend logs) so the fix has enough context.

### 6.3 Regression discipline

Every time a bug is found that doesn't map to an existing edge case, add a new EC-G, EC-N, or CC entry to this doc AND a new TEST to section 5. This document grows with the product. If it shrinks, we're losing context.

### 6.4 Environment requirements

Some tests need staging-only affordances (forced provider failures, forced phase slowness, balance manipulation for refund tests). These should be controlled by environment flags, not compiled-out code. Production never exposes them.

---

## 7. Cross-Reference Notes

- **Generation phase names** (`parsing`, `cie_building`, `character_refs`, `scene_images_pending`, `voice_synthesis`, `music_composition`, `scene_assembly`, `final_concat`, `complete`, `error`) are referenced throughout this doc. They must match the canonical state enum defined in `Clevroy_Backend_Handoff.md`. If the backend doc uses different names, reconcile against that doc.
- **Refund math** in EC-G6 (partial refunds based on phase progress) references percentages that need to match the actual credit cost model in `Clevroy_Cost_Decisions.md`. The phase-cost percentages shown here (10% character refs, 50% scene images, 30% voice+music) are illustrative; verify against the cost decisions doc.
- **Copy strings** referenced in TEST-18 must exist in the copy module (`lib/copy.ts`) with exactly the wording shown. If the frontend uses different wording, either update the frontend or update this doc — don't let them drift.
- **Edge case IDs (EC-G1 through EC-G10, EC-N1 through EC-N10, CC-1 through CC-6)** are canonical. Don't renumber. If an edge case becomes obsolete, mark it `[RETIRED]` but keep the ID so test logs remain valid over time.

---

**UX Edge Cases version: V1 — April 2026.** The 20 edge cases + 6 cross-cutting issues + 18 stress tests represent the known problem space for beta. New cases discovered during beta are appended with the next available ID.
