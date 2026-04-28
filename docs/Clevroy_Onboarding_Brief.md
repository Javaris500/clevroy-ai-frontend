# Clevroy — Onboarding Design Brief

The most underused 60 seconds in the app. Today onboarding does theme picking and a "5 free films" CTA. This brief expands it into a five-step casting flow that surfaces the AI Twin moat, prefills a first film, and respects the user's patience.

Companion to:
- `docs/Clevroy_UI_Design_System.md` §7.1 — original onboarding spec.
- `docs/Clevroy_Routes_Inventory.md` — onboarding status snapshot.
- `docs/Clevroy_Competitor_Research.md` — gap 5.6 (no character-consistency surface during generation) maps to this work.

Last written: 2026-04-28.

---

## 1. Why expand onboarding

Onboarding is the only moment in the user's lifetime where they're **patient by default** — they expect setup, they aren't yet trying to do work. That patience is finite. Today it's spent almost entirely on theme.

A first-time user who finishes onboarding should leave with:

1. A sense of what Clevroy is — not generic "AI video," but specifically "the film studio that makes films from scripts in your voice."
2. Their look (theme — already done).
3. Themselves cast (voice + face — currently buried in `/settings/ai-twin`).
4. A first film in flight (currently gestured at; landing page sends them to `/home` empty).

We're hitting 1.5 of 4 today. The biggest gap is #3 — and that's also the strongest competitive moat.

---

## 2. The flow — five steps

Every step except step 1 is skippable. Skips write a hint that re-prompts in context later (without nagging).

### Step 1 — Hello
A 5–10 second sample film plays as the welcome hero. Below: "I'm Clevroy. I make films from your scripts in your voice." One CTA: "Show me." Establishes the value prop in motion, not text.

The sample film is a curated fixture — mint one good loop and reuse it. No "magical" / "AI-powered" copy.

### Step 2 — Pick a look
Existing theme step, polished with the live-preview cards from the settings brief. Light / Dark / System as miniature mockups of the chat surface. Click applies; cross-fade animation. Lowest-cost, highest-satisfaction step.

### Step 3 — Cast yourself (voice)
Headline: "Cast yourself in your films." Subhead: "Record 30 seconds. Anything — read a line from your favorite movie."

Big record button. Waveform visualization during capture. Playback after. "Save your voice" CTA. "Maybe later" link skips.

Permission gate: tapping record triggers `getUserMedia` permission request. If denied, fall back to "Open your browser settings to enable the microphone" with a help link.

### Step 4 — Cast yourself (face)
Same headline ("Cast yourself"), different subhead: "Upload a clear photo of your face."

Single photo for onboarding (not the full 5–10 multi-photo flow that lives in `/settings/ai-twin`). Drag-drop on desktop, file picker on mobile. Preview after upload. "Save your face" CTA. "Maybe later" link skips.

### Step 5 — First take
Headline: "First take." Subhead: "5 free films. No card needed."

Faux scene-strip animation already in place. New layer: three starter prompts as cards (random sample of the 12-prompt pool from `/home`).

Click any prompt → routes to `/home` with the prompt already in the textarea. The user lands ready to Roll. This is the killer ergonomic — instead of "go figure out what to type," they arrive with a film already half-started.

If they ignore the cards: "Start with a blank script" → routes to `/home` with empty input.

---

## 3. The AI Twin moat — why this matters most

This is the single addition that earns onboarding's existence.

**It's the differentiator.** LTX Studio has Persistent Character Profiles (text descriptions). Higgsfield has image-to-video character lock. Runway has reference images. Nobody else has *first-party voice and face capture* baked into the product. Clevroy already has the infrastructure — `voice_twin_status` and `face_twin_status` are in the `Profile` type today.

**It's currently invisible.** AI Twin lives in `/settings/ai-twin`. That's a 516-line page that 90% of users will never visit. The data exists in fixture today — the page just isn't promoted.

**It's the casting metaphor.** Onboarding becomes "casting." Every step has a slate; every action is a beat in pre-production. That's a memorable user moment.

**It compounds.** Once a user has a voice twin, every film can use it for narration. Every face twin can appear as a character. Each film becomes more personally theirs. Retention follows.

Why split voice and face into two steps instead of one combined step:
- Different device permissions, different failure modes, different mental models.
- Combining creates a "this is too much" moment.
- Splitting respects the user's capacity to bail at either point.

---

## 4. Skippability + re-entry

Each skip writes `voice_skipped_in_onboarding` / `face_skipped_in_onboarding` flags (sessionStorage today; profile-bound when Layer 5 ships).

Re-entry strategy:

- **Soft re-prompt** on first chat submit on `/home`: a non-blocking toast — "Add your voice and Clevroy can narrate this in your voice. Add now?" Dismissable.
- **Skip counter cap**: stop re-prompting after 3 dismisses. Don't become nagware. After cap, the only path back is `/settings/ai-twin`.
- **Re-entry from settings**: if the user is mid-onboarding and bails, `/settings/ai-twin` should know and resume the flow. Today it doesn't.

---

## 5. The `onboarding_completed_at` gate

Currently `/onboarding` is freely accessible — anyone can hit it and re-trigger.

The fix:

- On step 5 finish: write `onboarding_completed_at: ISO_NOW` to the profile. Today: sessionStorage proxy `clevroy:onboarded`.
- Middleware (when auth lands): if signed-in AND no completion timestamp, force-redirect to `/onboarding`. Already done? `/onboarding` redirects to `/home`.
- For testing: `?force=1` bypasses the redirect (developer convenience).
- For QA / development: a "Skip onboarding (dev)" link visible when `useHardcodedFixtures()` is true OR `?dev=1` is in the URL. Hidden in production. Sets the completion flag and routes to `/home`.

---

## 6. Brand voice

This is the most uncynical the user will ever be. Lean into the cinematic voice harder than anywhere else.

| Step | Headline | Vibe |
|---|---|---|
| 1 | "I'm Clevroy." (Fraunces italic) | Brand introduction |
| 2 | "Pick a look." (mono small caps) | Production decision |
| 3 | "Cast yourself." (Fraunces italic) | Casting beat |
| 4 | "Cast yourself." (Fraunces italic) | Same headline, different scene |
| 5 | "First take." (mono caption) | Slate moment |

Each step uses a slate metaphor visually — section header rendered as a film slate at the top. Bridges directly into `/home`'s "Take 1" slate in the chat input.

Banned per CLAUDE.md: Oops, Something went wrong, Generate, Magical, Seamless, Simply, AI-powered, emoji.

---

## 7. Audio capture on web

`MediaRecorder` works in modern browsers. iOS Safari has historical quirks but is solid as of iOS 17.

Strategy:
- Web: try `MediaRecorder` with audio/webm or audio/mp4 codec.
- iOS Safari: works but quirks; test specifically.
- Capacitor native: use the Capacitor Voice Recorder plugin when shipped.
- Unsupported browser: render a "Complete this on the mobile app" deferred state with App Store / Play Store links (post-v1).

For onboarding v1, accept that ~5% of web users on old browsers will hit the deferred state. Better than not shipping.

---

## 8. Open questions

1. **Sample film for step 1 — what is it?** Needs a 5–10 second cinematic loop that demonstrates Clevroy's output without specific brand association. Designer + content question.
2. **Step 1 skippable?** Recommendation: no. The brand intro is non-negotiable. Skipping starts the user at step 2 directly via `?step=2` URL — useful for QA.
3. **Where do voice/face artifacts go before backend exists?** SessionStorage blobs work for the visual flow. Real R2 upload waits for Layer 5.
4. **Multi-photo face in onboarding?** Recommendation: single photo for onboarding flow, the multi-photo training surface stays in `/settings/ai-twin`. Onboarding is intro, not full training.
5. **Skip counter persistence?** Recommendation: per-account when backend exists; localStorage proxy today.

---

## 9. Sequencing

This work depends on:
- Auth provider decision (for the completion gate to be enforced via middleware).
- Layer 5 (for real voice/face upload + persistence of completion timestamp).

But it can ship as a frontend pass against fixtures today. Voice/face capture writes to sessionStorage; completion writes to localStorage. When Layer 5 lands, swap the persistence layer; UX doesn't change.

The dev skip button means QA never has to suffer through the flow during testing.
