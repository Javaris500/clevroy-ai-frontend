# Clevroy Chat Surface — Risk Register

Captured during the chat-surface architecture discussion on 2026-04-25. The decisions locked at the top of that conversation:

- **Decision 1:** `/films/[id]` is the same thread, post-completion. The thread is the film's artifact.
- **Decision 2:** Roy's Phase 4 cinematic moment renders as a special message type (autoplay-muted 16:9 scene-with-audio card) — not a fullscreen takeover.
- **Decision 3:** On mobile, BottomTabBar hides while inside `/create` so the chat input owns the bottom edge.
- **Decision 4:** Architecture uses Vercel AI SDK v6 — `useChat` + data-stream protocol + tools + generative UI / custom message metadata + DB-backed persistence.
- **Decision 5:** Empty-chat onboarding shows 2–3 starter prompt cards above the input.

These six risks need owners and mitigations *before* `/create` ships as a chat surface. They are not the same as the 30 layout enhancements — they are product/architecture risks unique to the chat model.

---

## Risk 1 — Brand voice slip in chat messages

**The risk.** Chat surfaces drift toward casual AI-bot voice (`"Sure! I'd love to help! 🎬"`, `"Got it! Let me dive in..."`, `"Awesome choice!"`). Clevroy's voice (`Brand_Guide §6.3`) is cinematic, restrained, serif-narrated. Every message Clevroy emits in the thread is a brand-voice surface, multiplied by every film. A single tone slip compounds across thousands of films.

**Why it matters.** The chat replaces the previous static-narration surface (`Design_System §8.3` phase-copy table). That table is brand-audited and locked. The moment narration shifts from templated copy to LLM-generated text, every output becomes an unaudited brand decision.

**Mitigation.**
1. **Narration is templated, not LLM-generated.** The 9 phase-state copy entries in `src/lib/copy.ts` (`phaseNarration`, `headlineForState`) are emitted server-side as data messages. Haiku is *only* invoked for refinement-router parsing + a one-line confirmation in Clevroy voice.
2. **Refinement-router system prompt locks voice.** System prompt explicitly forbids: exclamation marks, emoji, the words `Oops / magical / seamless / unleash / simply / AI-powered / generate / awesome / great choice`, and any greeting/sign-off. Caps every assistant text response at 12 words.
3. **Extend Ghost's G1 ESLint copy-audit rule** to also lint runtime LLM output: a server-side filter that rejects any assistant message matching the banned-word regex and substitutes a neutral fallback (`"Reshooting scene 3."`). Lint fires at runtime, not just at build time, because LLM output isn't in the source tree.
4. **Brand-voice eval suite.** ~30 test prompts piped through the refinement router; assert outputs pass the lint regex. Run in CI; fail the build on regression.

**Measurable check.** Zero banned-word matches in 1000 sampled production assistant messages per week. Track via Stratum's existing API client error-mapping layer extended to log `voice_filter_triggered` events.

**Owner.** Ghost (copy lint owner) + Stratum (LLM router server-side filter).

---

## Risk 2 — Long-generation gaps make the thread feel dead

**The risk.** A 15-minute film generation produces ~6 narration messages and ~4 asset messages — that's one message every 90 seconds on average, with bursts and silences. A chat surface with a 90-second silence reads as broken. Users assume the system stalled and refresh, kill the tab, or cancel.

**Why it matters.** The chat model removes the user's mental anchor that "progress = a moving bar." Without that visible signal, *any* gap becomes anxiety. This is the structural cost of the chat model versus the progress-screen model.

**Mitigation.**
1. **Phase narration cadence.** Roy's 6-phase arc (`Design_System §8.4` extension) becomes the heartbeat — a Clevroy narration message at every phase entry, plus typing indicators (`<PhaseNarration />` repurposed as in-thread indicator) between phases.
2. **Sub-phase ticks during long phases.** Phase 3 (scene generation, 10–15 min) gets a Clevroy narration message every 90s if no new scene completes — `"Still directing scene 4."` / `"Compositing the lighting on scene 5."` Templated, not LLM-generated. Pulled from a small pool to avoid repetition.
3. **Activity-log messages run continuously.** Even between scene completions, smaller events (`"Voice synthesized for character Maya."`, `"Color grading scene 3."`) flow as muted activity messages. The thread always has *something* arriving.
4. **Anti-empty-stage auto-cycle (from Roy's idea).** When nothing new in 20s, the most recent scene asset card cycles to play a different completed scene. Stage is never dead.
5. **Heartbeat indicator, not a progress bar.** A subtle dot pulse next to "Clevroy" in the thread header — visible signal that the connection is live even when no message is arriving. Different from a progress bar; different mental model.

**Measurable check.** Maximum gap between any two messages in a successful 15-min generation thread is < 60 seconds. Verified via synthetic generation runs and production sampling.

**Owner.** Fantem (chat thread cadence) + Stratum (Realtime activity event coverage).

---

## Risk 3 — Natural-language refinement doesn't actually work

**The risk.** "Reshoot scene 3 with darker tones" is a chat-shaped affordance. If the backend can't actually interpret and execute that refinement — if the only thing it accepts is a structured `{ scene_id, reason }` mutation with no semantic input — then the chat is *fake*. Users type what they want; the system does something they didn't ask for.

**Why it matters.** This is the single largest "fake affordance" risk in the chat model. Users assume chat = the system understands me. Once trust breaks, the entire surface reads as a worse version of the form-based design.

**Mitigation.**
1. **Tool-shaped refinement layer.** AI SDK tools are defined as Zod schemas mapped to backend mutations. Haiku 4.5 (via Vercel AI Gateway, `anthropic/claude-haiku-4-5`) parses user intent into the appropriate tool call. Tools include `reshoot_scene`, `cancel_generation`, `add_scene`, `change_music_style`, `change_voice_for_character`, plus a fallback `clarify_intent` tool for ambiguous requests.
2. **Backend must accept semantic prompt additions.** This is a **backend ask**: `POST /api/films/{film_id}/scenes/{scene_id}/reshoot` needs to accept an optional `prompt_addition` string passed through to the scene-image generator. Without this, "darker tones" loses semantic content at the API boundary.
3. **Constrain the affordance honestly.** First-paint hint message above the input: `"Try: Reshoot scene 3 with more contrast. Make scene 5 daytime. Cancel this film."` Three concrete examples set the boundary. Users learn what the system can do by example, not by trial-and-error.
4. **Graceful clarify path.** When Haiku's confidence is low, it calls `clarify_intent` with a one-line follow-up (`"Which scene did you want to change?"`) instead of guessing. Better to ask than to misfire.
5. **Visible tool-execution trace.** When the LLM routes a refinement, the assistant message shows the action being taken (`"Reshooting scene 3 with darker tones."`) — explicit, in Clevroy voice, before the actual reshoot runs. Sets expectations + builds trust.

**Measurable check.** Of 100 sampled production refinement requests, ≥85% execute the user's intended action correctly (verified via post-completion survey or human review). Ambiguous-intent requests resolve via `clarify_intent` rather than misfiring.

**Owner.** Stratum (AI SDK tools + LLM router) + backend team (semantic prompt-addition support).

---

## Risk 4 — Bottom-anchored chat input + mobile keyboard

**The risk.** Chat input is `position: sticky bottom-0` on mobile. iOS keyboard opens, viewport reflows, the input either: (a) gets covered by the keyboard, (b) jumps outside the visible viewport, (c) stutters during the keyboard animation. Users can't see what they're typing.

**Why it matters.** This is a basic mobile chat-surface failure mode. Every consumer messaging app has solved it; if Clevroy doesn't, the chat reads as broken before the user has finished their first sentence.

**Mitigation.**
1. **Capacitor `Keyboard` plugin handles native iOS/Android.** `Keyboard.addListener('keyboardWillShow', e => offset = e.keyboardHeight)`; translate the chat input by that offset. Same pattern Iyo is using for `iyo.11` (B.18 BottomTabBar keyboard hide) — extend the same listener registration to the chat input.
2. **`visualViewport` API on web.** When Capacitor isn't present, `window.visualViewport` provides keyboard-aware layout offsets. Subscribe to `resize` and `scroll` on `visualViewport`, transform the chat input accordingly.
3. **`safe-area-inset-bottom` baseline.** Even without keyboard handling, the input must respect the home-indicator safe area. Already declared in `app/globals.css` — just consume it.
4. **`scrollIntoView` on focus.** When a user taps the input, scroll the input into view if the keyboard is opening. Standard pattern; ~5 lines.
5. **Test matrix.** iOS Safari + iOS Chrome + Android Chrome + iPad Safari with hardware/software keyboards toggled. Capacitor builds tested on at least one physical device per platform. Manual smoke test before every release that touches the input.

**Measurable check.** On every supported device, the chat input remains 100% visible above the keyboard from `keyboardWillShow` start through `keyboardDidShow` end. No layout shift > 4px during the animation.

**Owner.** Fantem (chat input component) + Iyo (Capacitor keyboard listener — already owns `iyo.11`).

---

## Risk 5 — Multi-film management is undefined

**The risk.** If `/create` is a thread, what happens when the user wants to start a second film? Does the new film append to the same thread (Discord-style)? Or is it a new thread (iMessage-style)? Today the answer is undefined; the moment a user finishes their first film, the product has no clear entry point for the second.

**Why it matters.** Repeat usage is the entire monetization path. If the second-film entry point is unclear, users churn after one film. The chat model accidentally hides the "create another" affordance unless we design for it explicitly.

**Mitigation.**
1. **One thread per film.** New film = new thread. Same model as iMessage conversations or Slack DMs — each film has its own URL (`/films/[id]`), its own message history, its own state. No conflation.
2. **Sidebar `New film` link is the entry point.** Sidebar's existing Create item routes to a fresh `/create` URL that mints a new draft `film_id` and redirects to `/films/[id]` as soon as the first message is sent. Drafts are a backend concept (`films` table, `state = 'draft'`) — already supported.
3. **Recent threads in sidebar.** `iyo.8` (A.1 Recent Projects) becomes the Recent Threads list — the 5 most recent active or completed films, named by their generated title. One click resumes any thread.
4. **No "continue this conversation."** The chat is bound to a single film, period. If a user types `"now make another one about a cat"` after the first film completes, Clevroy responds with `"Starting a new film."` and routes them to a new thread. This is enforced at the LLM-tool level — there is no `extend_film` tool.
5. **Thread completion state.** Once `state === 'complete'`, the chat input switches to refinement-only mode (reshoot, change music, etc.). New-film prompts get redirected. The completed film thread is read-only-ish — refinements still work, but the thread is no longer "live" in the generation sense.

**Measurable check.** Of 100 users who complete their first film, ≥70% start a second film within 7 days using a discoverable entry point (sidebar `New film` or `Recent` list), not the URL bar.

**Owner.** Iyo (sidebar entry points) + Fantem (chat surface state machine) + Stratum (draft `film_id` minting).

---

## Risk 6 — Leave-and-come-back state restoration

**The risk.** A user starts a film, sees four scenes complete, closes the tab, comes back 8 minutes later. They need to land back in *that* thread, with all messages preserved, generation continuing live, no missed events. If state isn't fully restored — if even one Realtime event was missed during the offline window — the thread's narrative has a hole.

**Why it matters.** Chat threads are stateful. The chat model promises continuity. If the user comes back and the thread is empty, or the scenes don't show up, or the activity log is incomplete, the surface fails its core promise.

**Mitigation.**
1. **Server-persisted message log (`thread_messages` table).** Every message that flows through the AI SDK data stream is persisted on the server before it's emitted to the client. Schema: `thread_messages(id, film_id, role, type, content_text, metadata_jsonb, created_at)`. Indexed on `film_id`.
2. **`initialMessages` hydration on thread load.** AI SDK v6's `useChat({ initialMessages })` accepts a server-fetched array. Server-side: load all `thread_messages` for the `film_id`, deserialize into AI SDK `UIMessage[]`, pass to client. **Same render path for live and resumed threads.**
3. **Realtime catch-up on reconnect.** Stratum's `useFilmRealtime` (`stratum.7`) already plans REST catch-up via `/api/films/{id}/state` after reconnect — extend this to also re-fetch any `thread_messages` created during the offline window. Backend exposes a `since` query param: `GET /api/films/{film_id}/messages?since={iso_timestamp}`.
4. **Idempotent message IDs.** Every message has a stable server-generated UUID. Client deduplicates on ID before appending. Prevents duplicate scenes from appearing if the same event is delivered via both the catch-up REST call and the resumed Realtime channel.
5. **Optimistic local cache (optional).** If perceived load time matters, cache the last-rendered message list in `localStorage` keyed by `film_id`. On reload, paint from cache immediately, then reconcile against server. AI SDK v6 supports this pattern. Skip for v1 if it adds complexity; the server-side hydration is fast enough.
6. **Incomplete-generation resume.** If the user comes back during an active generation, the Realtime subscription resumes from the current state. Backend events from the offline window are caught up via REST. The thread looks identical to a user who never left. **This is the architectural unlock for Decision 1 (`/films/[id]` = same thread).**

**Measurable check.** A user closing and reopening a thread within 10 minutes of an active generation sees zero missing messages compared to a user who stayed on the page the whole time. Verified via dual-tab synthetic test in CI.

**Owner.** Stratum (Realtime catch-up + REST `since` endpoint integration) + backend team (`thread_messages` schema + `since` endpoint).

---

## Risks not yet mitigated

The following risks were considered during the discussion but do not yet have owners or specific mitigations. They need product-level decisions before they can be assigned:

- **Cross-device handoff.** User starts a film on desktop, checks on mobile. Does the mobile thread reflect the same state in real time? Yes if Realtime is per-`film_id` (it is). But the LLM-router conversational state (recent tool calls, partial inputs) may not transfer cleanly. Decide if conversational state is per-thread (transfers) or per-session (doesn't).
- **Refinement quotas.** If a user can type "reshoot scene 3" infinitely, the cost model breaks. Each reshoot costs films. Decide: does the chat input show a live cost preview before the reshoot tool fires? (Probably yes, mirroring `fantem.12` cost preview chip — but moved into the chat input.)
- **Failed refinement recovery.** If `reshoot_scene` succeeds at the LLM-router level but fails at the backend (provider error, quota hit, content moderation), how does the failure surface in the thread? As a Clevroy message in the existing error-state copy pattern — but the message must be honest about what failed *and* leave the original scene untouched. The "graceful failure" message vocabulary doesn't exist yet in `src/lib/copy.ts`.
- **Thread search.** Once a user has 50 completed films, finding "the noir one" requires search. Out of scope for v1 but worth flagging — the chat model makes search more important than the form model did.
- **Export of the thread itself.** Users may want to keep a record of the thread as part of "Take it home." PDF or Markdown export of the message log + asset stills. Out of scope for v1.

---

## Decisions still open after the discussion

| # | Question | Suggested default |
|---|---|---|
| Q1 | LLM provider for refinement router | `anthropic/claude-haiku-4-5` via Vercel AI Gateway |
| Q2 | Narration source — templated or LLM-generated | **Templated.** LLM only for refinement responses. |
| Q3 | Streaming endpoint shape | Per-film: `/api/chat/[filmId]/route.ts` |
| Q4 | Tool execution boundary | **Server-side only.** Tools call Stratum's API client. |
| Q5 | `thread_messages` schema | `(id uuid, film_id uuid, role, type, content_text, metadata_jsonb, created_at)` |
| Q6 | Whose voice writes the narration messages | Templated copy from `src/lib/copy.ts` `phaseNarration` table |
| Q7 | Cost preview for chat-driven refinements | Inline above the chat input, mirrors `fantem.12` chip |

These should be locked in `docs/Clevroy_Chat_Surface.md` (the spec doc to be drafted next) before any `/create` chat code lands.