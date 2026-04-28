# Clevroy Chat Surface — Specification

The /create page and the /films/[id] page are the same surface: a persistent chat thread bound to a single film. The thread is the film's birth and the film's home. This document is the implementation contract for that surface.

This doc supersedes the form-based /create design in `Clevroy_UI_Design_System.md §7.4` and reframes the centralized-generation experience in `§8` as in-thread message types instead of a takeover screen. Roy's six-phase narrative arc lives inside the thread.

---

## 0. Locked decisions (from the 2026-04-25 design discussion)

| # | Decision | Status |
|---|---|---|
| D1 | `/films/[id]` is the same thread, post-completion. The thread persists. | Locked |
| D2 | Roy's Phase 4 cinematic moment renders as an autoplay-muted 16:9 scene-with-audio message card — not a fullscreen takeover. | Locked |
| D3 | On mobile, BottomTabBar hides while inside the chat surface. The chat input owns the bottom edge. | Locked |
| D4 | Architecture is Vercel AI SDK v6 — `useChat` + data-stream protocol + tools + custom message metadata + DB-backed persistence. | Locked |
| D5 | Empty-thread onboarding shows 2–3 starter prompt cards above the input. | Locked |
| D6 | Narration is templated (from `src/lib/copy.ts`). LLM is invoked only for refinement-router intent parsing + a one-line confirmation in Clevroy voice. | Locked |
| D7 | LLM provider for refinement: `anthropic/claude-haiku-4-5` via Vercel AI Gateway. | Locked |
| D8 | Tools execute server-side, calling Stratum's API client. Browser never holds mutation surfaces. | Locked |
| D9 | One thread per film. New film = new thread, new URL, new message history. | Locked |

Risks in flight tracked at `docs/Clevroy_Chat_Surface_Risks.md`.

---

## 1. Architecture overview

```
Client                                     Server
──────                                     ────────────────────────
useChat({                                  app/api/chat/[filmId]/route.ts
  api: '/api/chat/[filmId]',
  initialMessages: hydrateFromDB,           1. Load thread_messages where film_id = :filmId
  onToolCall: server-side only              2. Subscribe to Supabase Realtime film:id=eq.{filmId}
})                                            and scenes:film_id=eq.{filmId}
  │                                         3. On user POST: route to streamText with tools
  │ POST { role: 'user', content }            tools: { reshoot_scene, cancel_generation,
  ├────────────────────────────────────►       add_scene, change_music_style, ... }
  │                                         4. As Realtime events arrive, writer.writeData
  │ data stream                                ({ type, metadata }) for each
  ◄────────────────────────────────────── 5. Persist every finalized message to thread_messages
  │
  │ Custom message renderer                  Backend dependencies (separate repo):
  │ dispatches on metadata.type              - thread_messages table
  │ → text bubble                            - GET /api/films/{id}/messages?since={iso} for catch-up
  │ → SceneAssetCard                         - POST /api/films/{id}/scenes/{sid}/reshoot accepts
  │ → CharacterRefCard                         optional prompt_addition string
  │ → FinalFilmCard                          - Per-scene playback URL when image+voice+music ready
  │ → ActivityLogEntry                       - scene_playback_ready Realtime event
  │ → SystemMessage
```

Two data sources merge into one stream: Supabase Realtime backend events become `data` parts; LLM responses become `text` parts. Both flow through the AI SDK message list. The client doesn't know or care which source produced a given message.

---

## 2. Message types

Five types only. Anything that doesn't fit one of these doesn't belong in the thread.

### 2.1 `user`

User-authored text from the chat input. Right-aligned, `bg-primary-soft`, `text-foreground`, Inter. 12px panel radius. Maximum width 70% of message column. Appears in the thread the moment the user hits send (optimistic), reconciled when the server persists.

### 2.2 `narration` (Clevroy serif voice)

Templated phase-state copy from `src/lib/copy.ts` `phaseNarration` table. Left-aligned, no bubble, Fraunces italic, `text-muted-foreground` first paint then settles to `text-foreground` once anchored. No timestamp visible. One line per message. This is the Roy-narration tier — quiet, cinematic, restrained.

Examples (already in the copy module):
- `parsing` → "Reading your script."
- `cie_building` → "Casting your characters."
- `scene_images_pending` → "Directing your scenes."
- `voice_synthesis` → "Recording the voices."
- `music_composition` → "Scoring the film."
- `final_concat` → "Cutting the final."
- `complete` → "Ready when you are."

### 2.3 `asset`

The product's defining message tier. Full-width inside the message column, no bubble, 12px radius. Subtypes via `metadata.assetKind`:

- `scene_image` — A still scene render. 16:9 aspect via shadcn `AspectRatio`. Subtle ken-burns animation under `prefers-reduced-motion: no-preference`. Caption beneath: scene number + brief title in Inter `text-sm`.
- `scene_playback` — **Roy's Phase 4 moment.** A 16:9 video card that autoplays muted on first paint, exposes an unmute affordance (top-right corner Volume icon, 44px touch target). First unmute in a session shows a Fraunces tooltip: "Click to hear your film." Once unmuted, all subsequent `scene_playback` messages in the same thread autoplay unmuted. Source URL comes from the per-scene playback URL the backend mints when image+voice+music are co-located. **This is the single biggest emotional moment in the product** — design it accordingly.
- `character_refs` — A horizontal grid of character portraits. Each portrait fades in stagger-style as it arrives (50ms per item, capped at 8 visible — beyond that they snap in). Names beneath each in `text-sm`.
- `final_film` — The complete film poster. 2:3 aspect. Title in Fraunces. A single `<Button size="lg">Watch your film</Button>` beneath. Tapping opens the player (route to `/films/[id]?play=true` or modal — TBD).
- `assembly_preview` — Phase 5 surprise. A composing animation of the title sequence or poster being built. Save-the-surprise rule (from Roy's risk #5) means this is the user's first sight of these assets. Don't show the title card before this phase.

All asset cards expose a three-dot overflow menu (44px hit area) with type-specific actions: scene cards → "Reshoot this scene" / "View characters"; final film → "Take it home" / "Keep it" / "Delete it." Brand verbs only.

### 2.4 `activity`

Quiet log entries. Left-aligned, no bubble, single line, JetBrains Mono timestamp + Inter `text-sm text-muted-foreground` body. Examples: "Voice synthesized for Maya.", "Color grading scene 3.". Throttled to one DOM message per 3 seconds (CC-5) regardless of source rate; rapid bursts collapse into a count summary ("5 scenes color-graded.").

### 2.5 `system`

Centered, badge-style, used sparingly. Examples: "Stopped. 0.2 films refunded to your balance.", "Reconnected.", "This film hit a problem. We saved what finished." Never `Oops`. Never `Something went wrong`.

---

## 3. The narrative arc — Roy's six phases as message sequences

The 12-state backend enum collapses into 6 user-facing phases. Each phase has a strict message-emission contract.

| Phase | Backend states | Messages emitted | Anti-empty-stage rule |
|---|---|---|---|
| 1. Reading | `parsing` | One `narration`: "Reading your script." | n/a — phase is < 30s |
| 2. Casting | `cie_building`, `character_refs` | One `narration`: "Casting your characters." Then one `asset/character_refs` message when the grid is ready, with stagger-fade portraits. | If > 60s elapsed without progress, emit one templated `activity`: "Sketching faces." |
| 3. Directing | `scene_images_pending` | One `narration`: "Directing your scenes." Then one `asset/scene_image` per scene completion. Throttled `activity` messages between scenes. | If > 90s without a new scene, emit a templated `activity` from a small pool ("Lighting scene N.", "Composing scene N."). Never repeat the same line twice in a row. |
| 4. Scoring | `voice_synthesis`, `music_composition` | One `narration`: "Recording the voices." Then one `narration`: "Scoring the film." As each scene goes voice+music+image-complete, emit one `asset/scene_playback` for that scene. **First `scene_playback` is the autoplay-muted-with-unmute-tooltip moment.** | Cycle the most-recent `scene_playback` card if no new one arrives in 20s — keep the stage alive. |
| 5. Cutting | `scene_assembly`, `final_concat` | One `narration`: "Cutting the final." Then one `asset/assembly_preview` showing something the user has not seen yet (title sequence being composited, or final color grade). **Save-the-surprise rule:** never show the title card before this phase. | n/a |
| 6. Ready | `complete` | One `narration`: "Ready when you are." Then one `asset/final_film` with the play button. | n/a |

Error path: any state transition to `error` emits one `system` message ("This film hit a problem. We saved what finished.") plus an `asset/scene_image` for the last successful scene with an error badge in the corner (`Design_System §8.4` error-state component, repurposed as a message card).

Cancel path: user-triggered cancel emits one `system` message ("Stopped. {X.X} films refunded to your balance.") and freezes the thread in read-only-ish refinement-only mode.

---

## 4. Chat input contract

Bottom-anchored. `position: sticky bottom-0` on desktop, keyboard-aware on mobile (Capacitor Keyboard plugin + `visualViewport` — same pattern as `iyo.11` for BottomTabBar).

### 4.1 Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  [Cost preview chip] ≈ 1 film for this reshoot             │ ← above the input
├─────────────────────────────────────────────────────────────┤
│  shadcn Textarea, auto-grow, max-height 50vh                │
│  Placeholder: "Tell me about your film." (empty state)      │
│              "Refine, reshoot, or ask." (active state)      │
│  Char counter bottom-right (text-xs text-muted-foreground)  │
│                                                  [Send →]   │
└─────────────────────────────────────────────────────────────┘
```

- Textarea: shadcn `<Textarea>` with `aria-describedby` pointing to a help line. Auto-grows from 2 rows up to 50vh, then scrolls. Char counter visible at all times. (`fantem.13` survives the chat pivot — this is exactly that task.)
- Cost preview chip: NUMERIC(8,2) string formatter. "≈ 1 film" / "≈ 0.4 films for this reshoot." Reads from Stratum's balance store. (`fantem.12` survives — moves above the input.)
- Send button: shadcn `<Button>`, disabled until the textarea has ≥ 1 non-whitespace character. 44px touch target. Cmd-Enter submits.

### 4.2 Empty-state onboarding (D5)

When `messages.length === 0`, render 2–3 starter prompt cards above the input as shadcn `<Card>` components. Click → fills the textarea but doesn't auto-send (gives the user a chance to edit). Cards disappear once the user has typed a character.

Starter prompts (rotate from a small pool — keep the empty state from feeling templated):
- "A 90-second noir about a detective who finds a film camera in a junkyard."
- "Birthday message for Mom set to her favorite song."
- "Trailer for a fake horror movie about a haunted thrift store."

### 4.3 Active-state hint message

First-paint hint above the input, persists until first message: "Try: Reshoot scene 3 with more contrast. Make scene 5 daytime. Cancel this film." Three concrete examples set the boundary of what the system can do. Disappears after the user's first refinement.

### 4.4 Completion-state mode

Once `film.state === 'complete'`, the input switches to refinement-only mode. Placeholder copy: "Refine, reshoot, or ask." New-film prompts get redirected by the LLM router: a `clarify_intent` tool call emits a `system` message "Starting a new film." plus a route push to `/create` (which mints a fresh `film_id`).

---

## 5. Tools — the refinement router

### 5.1 Provider + model

`anthropic/claude-haiku-4-5` via Vercel AI Gateway. Plain provider/model string through `@ai-sdk/gateway` — do not import provider-specific packages (`@ai-sdk/anthropic` etc.) without explicit reason. Gateway gives failover, observability, and zero data retention by default.

### 5.2 System prompt

```
You are Clevroy. You parse user messages into structured tool calls
that refine an in-progress film. You do not write narration or
respond conversationally.

Voice rules (strict):
- Never use exclamation marks.
- Never use emoji.
- Never use these words: Oops, Something went wrong, Error, magical,
  seamless, unleash, simply, AI-powered, generate, awesome, great,
  amazing, excited, happy.
- Never greet, sign off, or refer to yourself.
- Maximum 12 words in any text response.

When the user's intent is clear, call exactly one tool. When ambiguous,
call clarify_intent with a one-line follow-up question.

If the user wants to start a new film, call clarify_intent with the
message "Starting a new film." — never extend the current film.
```

### 5.3 Tools (Zod schemas)

```ts
// src/lib/chat/tools.ts
import { z } from 'zod';
import { tool } from 'ai';

export const reshootScene = tool({
  description: "Reshoot a single scene with optional prompt additions.",
  parameters: z.object({
    scene_id: z.string().uuid(),
    prompt_addition: z.string().max(200).optional(),
    reason: z.enum(['user_initiated', 'generation_failure'])
            .default('user_initiated'),
  }),
});

export const cancelGeneration = tool({
  description: "Stop the current generation and refund unused films.",
  parameters: z.object({
    confirm: z.boolean(),
  }),
});

export const addScene = tool({
  description: "Add a new scene to the end of the film.",
  parameters: z.object({
    prompt: z.string().min(10).max(500),
  }),
});

export const changeMusicStyle = tool({
  description: "Change the music style of the film.",
  parameters: z.object({
    style: z.enum(['cinematic', 'noir', 'electronic', 'orchestral',
                   'ambient', 'percussive']),
  }),
});

export const changeVoiceForCharacter = tool({
  description: "Change the voice assigned to a character.",
  parameters: z.object({
    character_id: z.string().uuid(),
    voice_id: z.string(),
  }),
});

export const clarifyIntent = tool({
  description: "Ask the user a one-line clarifying question or " +
               "redirect them to a new film.",
  parameters: z.object({
    message: z.string().max(80),
  }),
});
```

Each tool's server-side execution calls Stratum's API client (`src/lib/api/client.ts`). The browser never holds these mutation surfaces (D8).

### 5.4 Tool execution trace

Every tool call emits one `narration`-tier message before the tool fires (sets expectations) and one `system`-tier message after (confirms outcome). Examples:

| User input | Pre-tool narration | Tool call | Post-tool system |
|---|---|---|---|
| "Make scene 3 darker" | "Reshooting scene 3 with darker tones." | `reshoot_scene(3, "darker mood, lower key lighting")` | "Scene 3 reshoot in flight." |
| "Stop this" | "Stopping." | `cancel_generation(true)` | "Stopped. 0.4 films refunded." |
| "Use a different voice for Maya" | "Which voice would you like for Maya?" | `clarify_intent("Which voice would you like for Maya?")` | (no system message — user replies normally) |

---

## 6. Persistence

### 6.1 Schema (backend ask — separate repo)

```sql
CREATE TABLE thread_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id     uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user','assistant','system')),
  type        text NOT NULL CHECK (type IN ('user','narration','asset',
                                            'activity','system')),
  content_text text,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON thread_messages (film_id, created_at);
```

The `metadata` jsonb holds asset-specific data: `{ assetKind, sceneId, playbackUrl, posterUrl, characterRefs, ... }`.

### 6.2 Hydration

Server-side at `app/(app)/films/[id]/page.tsx`:

```ts
const messages = await db.threadMessages.findMany({
  where: { filmId: params.id },
  orderBy: { createdAt: 'asc' },
});
const uiMessages = messages.map(toUIMessage);
return <ChatThread filmId={params.id} initialMessages={uiMessages} />;
```

Client-side `useChat({ initialMessages })` accepts the array. Same render path for live and resumed threads.

### 6.3 Catch-up on reconnect

Stratum's `useFilmRealtime` already does REST catch-up after reconnect (task `stratum.7`). Extend it: also fetch `GET /api/films/{film_id}/messages?since={iso_timestamp}` for any messages created during the offline window. Idempotent message IDs prevent duplicates.

---

## 7. Realtime + LLM merge — the data stream

### 7.1 Server route shape

```ts
// app/api/chat/[filmId]/route.ts
import { streamText, createUIMessageStream } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { tools } from '@/lib/chat/tools';

export async function POST(req, { params }) {
  const { messages } = await req.json();
  const filmId = params.filmId;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // 1. LLM stream for refinement intent
      const result = streamText({
        model: gateway('anthropic/claude-haiku-4-5'),
        messages,
        tools,
        system: SYSTEM_PROMPT,
        onFinish: persistAssistantMessages(filmId),
      });
      result.mergeIntoDataStream(writer);

      // 2. Realtime subscription for backend events
      const sub = subscribeToFilm(filmId, (event) => {
        const msg = mapRealtimeEventToUIMessage(event);
        writer.writeData(msg);
        persistMessage(filmId, msg);
      });
      req.signal.addEventListener('abort', () => sub.unsubscribe());
    },
  });

  return stream.toResponse();
}
```

### 7.2 Mapping Realtime events to UI messages

```ts
function mapRealtimeEventToUIMessage(event) {
  switch (event.type) {
    case 'film_state_changed':
      return narrationMessage(event.newState); // from copy.ts phaseNarration
    case 'scene_image_ready':
      return assetMessage('scene_image', { sceneId, imageUrl });
    case 'scene_playback_ready':
      return assetMessage('scene_playback', { sceneId, playbackUrl });
    case 'character_refs_ready':
      return assetMessage('character_refs', { characters });
    case 'film_complete':
      return assetMessage('final_film', { posterUrl, playbackUrl });
    case 'voice_synthesized':
      return activityMessage(`Voice synthesized for ${event.character}.`);
    case 'film_error':
      return systemMessage("This film hit a problem. We saved what finished.");
    case 'film_cancelled':
      return systemMessage(`Stopped. ${event.refund} films refunded.`);
  }
}
```

---

## 8. Mobile considerations

- **Keyboard handling.** Same pattern as `iyo.11` (Capacitor `Keyboard.addListener` + `visualViewport`). Chat input rises with the keyboard; doesn't get covered.
- **BottomTabBar hidden** on the chat surface entirely (D3). Wire via `BottomTabBar.hidden` prop from the layout (`leia.14`).
- **Autoplay fallback.** On mobile (matchMedia(<md)), `asset/scene_playback` cards render as still images of the scene with a centered "Tap to preview" play overlay rather than autoplaying. Tapping enters fullscreen video. Desktop autoplays muted by default.
- **Haptics.** Capacitor Haptics. Light buzz on `asset/character_refs` arrival. Medium buzz on first `asset/scene_playback` (the wow moment). Success-pattern on `asset/final_film`. Skip under `prefers-reduced-motion` and on web.

---

## 9. Multi-film state machine (D9)

- **New film** → `/create` route → mints a draft `film_id` server-side → redirects to `/films/[id]` with empty thread.
- **Active film** → `/films/[id]` → live thread, generation in flight.
- **Completed film** → same `/films/[id]` URL → thread is read-only-ish, refinement-only mode.
- **Cancelled film** → same URL → thread is frozen, no input.
- **Deleted film (soft)** → `/films/[id]` shows `<FilmRestore />` (Leon's component) instead of the thread. Restore returns to active or completed state.
- **Cross-thread navigation** lives in the sidebar Recent group (`iyo.8`). The chat surface itself has no "back to other films" affordance — sidebar is the only way out.

---

## 10. Brand voice guardrails

Every Clevroy-authored message (narration, system, tool-execution-trace) passes through a runtime filter before emission:

```ts
// src/lib/chat/voice-filter.ts
const BANNED = /\b(oops|something went wrong|error|magical|seamless|
  unleash|simply|ai-powered|generate|awesome|great|amazing)\b/i;

export function voiceFilter(message: string): string {
  if (BANNED.test(message) || message.includes('!') ||
      message.split(/\s+/).length > 12) {
    logVoiceFilterTriggered(message);
    return null; // caller emits a neutral fallback
  }
  return message;
}
```

When the filter fires (LLM produced unsafe output), substitute a neutral templated fallback ("Reshoot in flight." / "Stopped.") and log to the existing API client error layer for offline review. This is `Risk 1` mitigation #3 from the risks doc.

The G1 ESLint copy-audit rule (Ghost task 1) is the build-time half. The voice filter is the runtime half. Both run.

---

## 13. `/home` as a chat surface entry point

Added 2026-04-25 after the `/home` audit (`docs/Clevroy_Home_Audit_2026-04-25.md`). The user picked Shape B: `/home` is not a dashboard — it is the chat-surface entry point.

### 13.1 Surface contract

`/home` renders the chat shell in an empty pre-thread state. Specifically:

- **Center column.** `<PagePanel>` with no H1 (the H1 is replaced by a Fraunces italic narration line — see §13.2). Inside the panel, the chat input is the hero. It sits centered both vertically and horizontally for the first paint, then anchors to the bottom once the user starts a thread.
- **Above the input.** A single Fraunces italic line: "Welcome back, {first_name}. What's the next film?" If `first_name` is unavailable, fall back to "Welcome back. What's the next film?" The line uses the `text-phase` utility from Leia's type scale.
- **Below the input.** The 2–3 starter prompt cards from §4.2. Same component, same rotation pool. Click → fills the input, does not auto-send.
- **No films-left chip on `/home`.** The cost chip from §4.1 sits above the input as on `/create` and reads from the balance store.
- **No Recent films row on `/home`.** Recent films live exclusively in the sidebar Recent group (`iyo.8`). This removes the duplicate-affordance problem the dashboard design had.
- **No CenterStage placement on `/home`.** The in-progress film, if any, surfaces as a single message-style card just above the chat input ("You have a film in flight. Take me there." → routes to `/films/[id]`). Otherwise it doesn't render. This replaces `leon.8`'s page-level CenterStage.

### 13.2 Submit lifecycle

When the user submits the first message on `/home`:

1. Stratum's API client mints a draft `film_id` server-side via `POST /api/films` (existing endpoint per Backend_Handoff §8.3).
2. The user message is persisted to `thread_messages` with `film_id = <new>`.
3. Client `router.replace(\`/films/${newFilmId}\`)` — the user lands on the thread page, the message is already in the hydrated history.
4. Generation kicks off automatically in the background — the user does not need a separate "Start your film" button. The first message IS the start.

Subsequent navigation back to `/home` (sidebar Home click) returns to the empty pre-thread state. There is no concept of a "current draft" stuck on `/home`; every send promotes to a real `film_id` immediately.

### 13.3 Shape A artifacts that are cancelled

The following layout-enhancement tasks are cancelled by Shape B and should be marked done with a "cancelled — Shape B" note in `tasks.json`:

- `leon.5` (Implement /home page per §7.2 dashboard layout) — the page body becomes the chat surface, not the dashboard.
- `leon.8` (Place <CenterStage /> above-the-fold on /home) — no page-level CenterStage on /home.
- `leon.9` (<ActivityFeed /> rail on /home) — no rail layout on /home.
- `leon.14` (Home cleanup — Button asChild + PagePanel) — superseded by the chat surface page rewrite.

The Recent group (`iyo.8`) survives unchanged; the films-left badge in the sidebar (`iyo.3`) survives unchanged; the in-progress indicator (`iyo.4`) survives but extends to render the redirect-to-thread card on /home.

### 13.4 Mobile

Same surface contract on mobile. The sidebar collapses to the hamburger top header (`leia.13`); BottomTabBar is suppressed (`leia.14` already plumbed); the chat input owns the bottom edge with keyboard-aware translation (`iyo.11`). The Fraunces italic welcome line stacks above the input with shorter line lengths. Starter prompt cards stack vertically on mobile.

### 13.5 Vertical flow (the chat thread is naturally vertical)

The user asked whether a "vertical generation flow" is possible. Yes — the chat surface IS that. Each phase of generation produces a downward stack of messages: narration → asset → activity → narration → asset → … The user scrolls down through the production of the film. Newest message anchored to bottom; auto-scroll while the user is at bottom; "Jump to latest" pill when scrolled up >40px (§3 anti-empty-stage rules apply). The vertical flow is the chat-surface contract, not a special mode.

The implication for `/home` specifically: when the user sends their first message, the page transitions to `/films/[id]` and the thread begins growing downward from the welcome state. The same DOM continues — the welcome line fades out, the user message appears, the first narration message appears below it, and the thread expands. There is no jarring page transition because the surface is the same `useChat({ initialMessages })` instance.

---

## 11. Out of scope for v1

These came up during the discussion and are deliberately not in this spec:

- **Cross-device LLM-router conversational state.** Per-thread persistence is the limit; the LLM doesn't carry memory across devices in v1.
- **Thread search.** Once a user has 50 films, finding "the noir one" needs search. Park until v1.1.
- **Thread export to PDF/Markdown.** Bundled under "Take it home" in a later release.
- **Multi-user threads / shared films.** Single-tenant for the foreseeable future.
- **Voice input on the chat input.** Mic button is reserved real estate but not wired.
- **Streaming token-by-token narration.** Narration is templated; nothing to stream. If the LLM ever writes narration directly, revisit.
- **Inline scene editing on the asset cards.** Trim/crop/replace happens via natural-language refinement only in v1; direct manipulation is post-v1.

---

## 12. Implementation sequence — layered

Updated 2026-04-28. The previous agent-by-agent sequence (Stratum → Fantem → Ghost → Iyo → Roy) is dropped along with the multi-agent build model. The new sequence is six sequential layers; each is a complete floor on top of the last.

**Layer 0 — Shell foundation.** ✅ Shipped. Edge-to-edge `RoundedShell` (no cream frame, no 12px inset, no rounded panels), `--shell-frame` and `--spacing-shell-gap` tokens removed, `mx-auto max-w-7xl` wrapper dropped from `app/(app)/layout.tsx`. Pages opt into their own width.

**Layer 1 — Chat surface scaffold (visual only).** ✅ Shipped. `ai@^6.0.168` installed. AI Elements components installed via `npx ai-elements@latest add prompt-input suggestion` → `src/components/ai-elements/prompt-input.tsx` + `suggestion.tsx`. `src/components/chat/ChatSurface.tsx` composes `PromptInputProvider` → `PromptInput` (textarea + footer with cost chip + submit) + `Suggestions` (3 starter prompts). `app/(app)/home/page.tsx` renders `<ChatSurface mode="empty" onSubmit={console.log} />`. `mode==="thread"` returns `null`; Layer 3 owns it.

**Layer 2 — Unify `/home` + `/create` + `/films/[id]` onto ChatSurface.** Open work. Decisions to lock before code:
- (A) Shared layout via route group `app/(app)/(chat)/layout.tsx` so the surface survives the `/home` → `/films/[id]` redirect (delivers §13.5's "same DOM continues" promise) — vs. per-page mount with optimistic-message handoff via store.
- (B) `/create` becomes `redirect('/home')`, or stays as a parallel mount, or is deleted entirely.
- (C) `onSubmit` lifecycle: optimistic user-message render → fixture mint of `film_id` → `router.replace('/films/${id}')`. Real mint deferred to Layer 5; Layer 2 ships a stub at `src/lib/chat/mint-film.ts` that returns `{ film_id: crypto.randomUUID() }` after a 250ms delay.
- (D) Minimal `mode="thread"`: bottom-anchored `PromptInput` + scrollable area that renders just the optimistic user message. No real message types yet (those are Layer 3).

**Layer 3 — Message-type components from fixtures.** `mode==="thread"` renders the eight message types — `UserMessage`, `NarrationMessage`, `SceneImageCard`, `ScenePlaybackCard`, `CharacterRefCard`, `FinalFilmCard`, `ActivityMessage`, `SystemMessage` (spec §2). Driven by a fixture message-array that walks Roy's six-phase arc (spec §3). No real streaming yet. Anti-empty-stage rules (§3 final column) come online here. Capacitor keyboard handler + haptics wire to the chat input in this layer too.

**Layer 4 — `useChat` + AI Gateway wiring (real streaming).** Server route at `app/api/chat/[filmId]/route.ts` per §7.1. `streamText` against `anthropic/claude-haiku-4-5` via Vercel AI Gateway (no provider-specific package). `src/lib/chat/tools.ts` ships the six Zod tool schemas from §5.3. `src/lib/chat/voice-filter.ts` ships the runtime brand-voice filter from §10. Client switches from fixture message-array to `useChat({ api: '/api/chat/[filmId]' })`. Realtime is still mocked at this layer; the merge with backend events is Layer 5.

**Layer 5 — Backend integration.** Backend asks land first: `thread_messages` table + `GET /api/films/{id}/messages?since={iso}` catch-up + per-scene playback URL minting + `scene_playback_ready` Realtime event + semantic `prompt_addition` on reshoot. Then on the frontend: `useFilmRealtime` extends with `since` catch-up (Risk 6); the Realtime → UI message mapping from §7.2 fires inside the API route's `createUIMessageStream` writer; `useChat({ initialMessages })` hydrates from server-rendered `thread_messages`.

Each layer ends with a verification step (browser walk-through of the surface), not a CI gate. Move to the next layer only after the previous one is visibly correct.