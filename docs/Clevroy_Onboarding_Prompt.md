# Prompt — `/onboarding` expanded flow

Paste-able prompt for the next session. Companion to `docs/Clevroy_Onboarding_Brief.md` (the design intent).

---

## Where we are

Repo: `C:\Users\javar\Desktop\clevroy-frontend`. Branch: `main`. Single-developer layered build (`CLAUDE.md`). Layers 0–3 + State Management have shipped. Layer 4 + 5 (LLM + backend) are not started — this work runs on fixtures.

This task is **scoped to `/onboarding` only**. Don't touch the chat surface, projects, settings, sidebar, or any other route. The route already exists as a 427-line two-step flow (theme + start CTA); this is a rewrite that expands it to five steps and adds a developer-only skip affordance.

**Read these before writing code:**
- `CLAUDE.md` — ground rules.
- `docs/Clevroy_Onboarding_Brief.md` — full design intent for this work.
- `docs/Clevroy_UI_Design_System.md` §7.1 — original spec.
- `app/onboarding/page.tsx` (427 lines) + `app/onboarding/layout.tsx` — current implementation.
- `src/lib/copy.ts` — onboarding copy registry (search "onboarding =").
- `src/components/providers/profile-provider.tsx` — profile data source.
- `src/stores/ui-store.ts` — theme store.
- `src/hooks/_fixtures.ts` — `useHardcodedFixtures()` and `FIXTURE_PROFILE`.
- `app/(app)/ai-twin/page.tsx` (516 lines) — the full AI Twin surface; reference for capture patterns.
- `src/components/chat/ChatSurface.tsx` — `usePromptInputController()` and the prompt-prefill mechanism for step 5.

## What this work ships

A five-step onboarding flow with persistent skippable progression, a developer skip affordance, voice + face capture surfaces (fixture-backed), and a step 5 that prefills the chat input on `/home`.

## Decisions locked

1. **Five steps**: Hello → Look → Voice → Face → First take. Steps 2–5 skippable; step 1 is the brand intro and does not skip.
2. **Skip writes to sessionStorage today**, profile when Layer 5 lands. Keys: `clevroy:onboard:voice-skipped`, `clevroy:onboard:face-skipped`, `clevroy:onboarded` (completion).
3. **Voice capture via `MediaRecorder`**; iOS Safari supported. Unsupported browsers: render a deferred-state card with "Complete on a desktop or in the mobile app" copy. No App Store links yet.
4. **Single photo for face** in onboarding (drag-drop or file picker). The full multi-photo training flow stays in `/settings/ai-twin` and is not duplicated here.
5. **Step 5 prefill mechanic**: clicking a starter prompt sets `clevroy:home:prefill` in sessionStorage, then routes to `/home`. The chat surface reads the prefill on mount and seeds the textarea. This is a one-shot — read-and-clear semantics.
6. **`onboarding_completed_at` gate**: completion of step 5 (or dev skip) writes `clevroy:onboarded: ISO_NOW`. Visiting `/onboarding` when this is set redirects to `/home`. `?force=1` bypasses the redirect.
7. **Dev skip button**: visible when `useHardcodedFixtures() === true` OR `?dev=1` is in the URL. Persists `?dev=1` via sessionStorage so refresh keeps the dev mode active. Hidden in production.
8. **Brand voice** per the brief — Fraunces italic for casting beats, mono caption for slate moments, no banned words.

## File-by-file work order

### 1. Routing + gate

#### 1a. Completion gate

Modify `app/onboarding/layout.tsx`:

- Read `clevroy:onboarded` from sessionStorage on mount (client-side check; SSR returns `null`).
- If set AND no `?force=1` query: `router.replace('/home')`.
- If not set: render children.

#### 1b. Dev mode detection

Create `src/hooks/use-dev-mode.ts`:

```ts
export function useDevMode(): boolean {
  // Reads URL query (?dev=1) OR sessionStorage flag OR fixtures flag.
  // First read of ?dev=1 writes it to sessionStorage so refresh persists.
}
```

Used by both the dev skip button on each step and (later) the `/settings/developer` page hidden-in-production logic.

### 2. Step orchestration

Rewrite `app/onboarding/page.tsx` as a multi-step state machine:

```tsx
type Step = 1 | 2 | 3 | 4 | 5;
const [step, setStep] = React.useState<Step>(1);
```

Allow step jumps via `?step=N` query param (handy for design review and QA).

Each step renders a child component (created in step 3 below). Top-level wrapper provides:
- Brand chrome (Clevroy wordmark top-left, step counter top-right).
- Slate-shaped section header that names the step.
- Step transition animation: 240ms cross-fade + 8px slide. Reduced-motion: instant swap.
- Bottom controls (Continue / Skip / dev skip).
- Progress indicator (5 dots, current step highlighted).

### 3. Step components

Create one component per step in `src/components/onboarding/`:

#### 3a. `<HelloStep>`

- Hero: 16:9 video element autoplaying-muted-looping a sample film. Use `https://www.w3schools.com/html/mov_bbb.mp4` as a placeholder URL (consistent with phase-walker fixtures). Real curated film URL is a content task, not a code task.
- Headline: "I'm Clevroy." Fraunces italic, `text-phase`.
- Body: "I make films from your scripts in your voice." Inter, `text-body`.
- Single CTA: "Show me." → `setStep(2)`.
- No skip on this step.

#### 3b. `<LookStep>`

- Headline: "Pick a look." Mono small caps, `font-mono text-[11px] uppercase tracking-[0.2em]`.
- Three preview cards: Light / Dark / System. Each is a miniature mockup of the chat surface in that theme (welcome line + input card + suggestions row, all proportionally scaled). Click → applies theme via `ui-store`. Active card has a primary-color border ring.
- Continue button at the bottom; selected theme is whatever's in `ui-store.theme`.
- Skip is implicit (Continue without changing — defaults to System).

#### 3c. `<VoiceStep>`

- Headline: "Cast yourself." Fraunces italic, `text-phase`.
- Subhead: "Record 30 seconds. Anything — read a line from your favorite movie." Inter muted.
- Capture state machine:
  - **Idle**: a large "Tap to record" circle button (size-32, primary color). Below: helper "Make sure your microphone is enabled."
  - **Permission requested**: spinner + "Asking for permission…"
  - **Permission denied**: helper text "Microphone access needed. Open your browser settings."
  - **Recording**: live waveform visualization (use a simple `<canvas>` driven by `AudioContext` analyzer). Timer counts up. Button becomes "Stop." Auto-stops at 30s.
  - **Captured**: playback button + waveform (static). "Save your voice" CTA → `localStorage.setItem('clevroy:voice-blob', dataUrl)` (yes, we use a data URL today; Layer 5 swaps for R2 upload). Toast "Your voice is saved." Advance to step 4.
  - **Re-record**: link "Record again" resets to Idle.
- Skip link at the bottom: "Maybe later." Writes `clevroy:onboard:voice-skipped: 1` and advances to step 4.

Implementation: use `navigator.mediaDevices.getUserMedia({ audio: true })` and `MediaRecorder`. Handle the Safari quirk where `audio/webm` isn't supported — try `audio/mp4` as fallback, fail gracefully.

#### 3d. `<FaceStep>`

- Headline: "Cast yourself." (same as voice — intentional repetition signals "still casting").
- Subhead: "Upload a clear photo of your face." Inter muted.
- Capture state machine:
  - **Idle**: drag-drop zone (desktop) + file picker button (mobile). Helper: "JPG or PNG. Up to 10MB."
  - **Uploaded**: image preview (256×256 circle crop). "Save your face" CTA → `localStorage.setItem('clevroy:face-blob', dataUrl)`. Toast "Your face is saved." Advance to step 5.
  - **Replace**: link "Choose another."
- Skip link: "Maybe later." Writes `clevroy:onboard:face-skipped: 1` and advances to step 5.

#### 3e. `<FirstTakeStep>`

- Headline: "First take." Mono caption, slate-style.
- Body: "5 free films. No card needed."
- Faux scene-strip animation in the background (existing pattern from current onboarding step 2).
- Three randomized starter prompts from the 12-prompt pool, rendered as small cards. Click → writes the prompt to `clevroy:home:prefill` sessionStorage AND writes `clevroy:onboarded: ISO_NOW` AND routes to `/home`.
- Below the cards: "Start with a blank script" link → just writes the completion flag and routes to `/home` (no prefill).
- No "Continue" button — every action either picks a prompt or skips.

### 4. Prompt prefill on `/home`

Modify `src/components/chat/ChatSurface.tsx` `EmptyView` (or wherever the textarea mounts):

- On mount, read `clevroy:home:prefill` from sessionStorage.
- If present: call `usePromptInputController().textInput.setInput(value)`, then remove the storage key.
- Single-shot — only fires once per mount.

This is the prefill mechanic that completes step 5.

### 5. Dev skip button

Create `src/components/onboarding/DevSkip.tsx`:

- Renders only when `useDevMode()` returns true.
- Position: bottom-right corner of the onboarding container, 16px inset.
- Style: small, muted, `text-xs text-muted-foreground hover:text-foreground` text link with a tiny `<Code>` icon prefix (lucide).
- Label: "Skip onboarding (dev)."
- On click: writes `clevroy:onboarded: ISO_NOW` and routes to `/home`. No confirm — developer affordance, doesn't need a confirm step.
- Mounted in the onboarding `page.tsx` wrapper, visible across all five steps.

### 6. Copy registry updates

Extend `onboarding` in `src/lib/copy.ts`. Add keys for:

- `hello.headline`, `hello.body`, `hello.cta`
- `look.headline`, `look.label.light`, `look.label.dark`, `look.label.system`, `look.continue`
- `voice.headline`, `voice.subhead`, `voice.idleCta`, `voice.recording`, `voice.timer(secs)`, `voice.stop`, `voice.recapture`, `voice.save`, `voice.savedToast`, `voice.permissionDenied`, `voice.skipLink`
- `face.headline`, `face.subhead`, `face.dropZone`, `face.fileButton`, `face.replace`, `face.save`, `face.savedToast`, `face.skipLink`
- `firstTake.headline`, `firstTake.body`, `firstTake.blankLink`
- `dev.skipLabel`

All copy in brand voice. No banned words.

### 7. Step counter + progress dots

In the onboarding wrapper:
- Top-right: small "Step N of 5" mono caption.
- Bottom-center (above the controls): 5 dots, current one filled `bg-primary`, others `bg-muted`.
- Skip-disabled steps (just step 1) hide the skip link entirely; replace with the Continue button only.

### 8. Edge states

- **Direct access to `/onboarding?step=3`**: jump to step 3, but if the user hasn't completed earlier steps, skip-flag handling still applies. Use case: design review, QA.
- **Refresh mid-onboarding**: read step from sessionStorage `clevroy:onboard:step`, restore. Default to step 1.
- **Completion already set + visiting `/onboarding`**: redirect to `/home` unless `?force=1`.
- **Voice/face uploads survive a refresh**: data URLs in localStorage. Up to ~5MB per asset; voice mp4 might exceed, so warn and keep blob in-memory if oversized.

### 9. Mobile

- Hero on step 1: 16:9 plays inline with `playsInline` and muted attributes.
- Voice step: mic permission flow works identically on iOS Safari + Android Chrome. Capacitor build will use the Capacitor plugin (post-v1).
- Face step: file picker uses `accept="image/jpeg,image/png"` and `capture="user"` for mobile front camera. Drag-drop disabled on touch devices (irrelevant).
- Step transitions: same animations, reduced-motion respected.
- Dev skip button: same position bottom-right, but bigger touch target (44×44).

### 10. Accessibility

- Each step's headline is `<h1>` (single per page; previous step's headline is unmounted).
- Progress dots have `aria-label` on the container ("Step 3 of 5") and individual dots are `aria-hidden`.
- Voice waveform `<canvas>` is `aria-hidden`; a sibling `<span class="sr-only">` reads "Recording in progress, N seconds elapsed."
- Face drop-zone is keyboard-focusable (`tabIndex=0`); pressing Enter opens the file picker.
- Reduced-motion gates the step transition + the faux scene-strip animation on step 5.

## Don't do (out of scope)

- Real R2 upload of voice/face — Layer 5.
- Multi-photo face training in onboarding — that flow stays in `/settings/ai-twin`.
- Capacitor-specific voice recording — post-v1 native build task.
- Auth-provider integration of the completion gate — depends on auth provider decision.
- Anything outside `app/onboarding/`, `src/components/onboarding/`, `src/hooks/use-dev-mode.ts`, `src/components/chat/ChatSurface.tsx` (only the prefill mount), `src/lib/copy.ts`.
- Subscription tier picking, notification preferences, billing — settings territory.
- New design tokens.

## Constraints reminder

- shadcn-first / AI Elements-first.
- 12px panel radius, 16px soft surfaces, color tokens only.
- 44×44 touch targets. Respect `prefers-reduced-motion` everywhere.
- "films" surface language; banned: Oops, Something went wrong, Generate, Magical, Seamless, Simply, AI-powered, emoji.
- Inter / Fraunces / JetBrains Mono.
- Work directly on `main`. Read-only git only — don't commit.
- TypeScript strict mode passes (`npx tsc --noEmit`).

## Verification (user runs in browser)

1. **Fresh user (no completion flag)** — `/onboarding` renders step 1. Hero plays muted. "Show me" advances to step 2.
2. **Theme** — selecting Light cross-fades the preview. Continue advances to step 3.
3. **Voice** — record a sample, see waveform, see timer count up, save. Toast confirms. Advances to step 4.
4. **Voice permission denied** — helper text appears with "Open browser settings."
5. **Voice skip** — "Maybe later" advances to step 4, skip flag set.
6. **Face upload** — drag-drop a JPG, see preview, save. Toast confirms. Advances to step 5.
7. **First take with prompt** — click a starter prompt → URL becomes `/home` with the textarea populated.
8. **First take blank** — click "Start with a blank script" → URL becomes `/home` with empty input.
9. **Completion gate** — refresh `/onboarding` after completing → instant redirect to `/home`.
10. **Force flag** — visiting `/onboarding?force=1` after completion renders the flow normally.
11. **Dev skip** — set `?dev=1`, the dev skip link appears bottom-right on every step. Clicking it routes to `/home` and sets the completion flag.
12. **Step deep-link** — `/onboarding?step=4` jumps to face step.
13. **Mobile** — full flow works on a mobile DevTools simulation. Mic permission prompt fires on iOS Safari simulation.
14. **Reduced motion** — step transitions are instant, scene-strip animation is static.
15. `npx tsc --noEmit` passes.

Ship this. Onboarding becomes the casting flow that surfaces Clevroy's biggest moat in the only window where users will sit through it.
