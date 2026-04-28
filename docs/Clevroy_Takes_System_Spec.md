# Creative Bet — Takes as a First-Class Concept

Companion to `docs/Clevroy_Competitor_Research.md`. The deepest creative differentiation Clevroy can pursue: turning each refinement into a literal **Take** — a parallel attempt at a scene, comparable side-by-side with the original, pickable as the canonical version.

This is the bet that nobody else in the AI video category has made. Filmmaking is takes. Generative AI tools currently use "regenerate," "rerun," "iterate" — administrative verbs. Clevroy already says "Reshoot." The next step is making takes a structural concept, not just a verb.

---

## 1. Why this bet

### 1.1 The category baseline
Every competitor treats refinement as **replacement**:
- Runway: regenerate the shot, the new version overwrites the old.
- LTX Studio: re-render the shot, you can see history but it's a list, not a comparison.
- Pika: regenerate from the same prompt with different seed, results are siblings without context.
- Sora: each generation is a separate database row.

The user's mental model in all of these is "try again until you get something good." That's not how filmmaking works. **Filmmaking is takes** — you shoot a scene three or four times, you compare, you pick. Each take has context (what was different about it), each is preserved, and the chosen take becomes the canonical scene.

### 1.2 The Clevroy advantage
Clevroy already has the right primitive: the chat thread as persistent history. Every reshoot already lives in the thread as a sequence. What's missing is:
- **Structural awareness** — the system knows take 3 is a take of scene 2, not a separate scene.
- **Side-by-side comparison** — the user can see all takes of a scene together.
- **A canonical pick** — one take is "the keeper," used in the final cut.
- **Vocabulary that respects the metaphor** — "Take 2," "Print this take," "Pick a take."

This isn't a UX flourish. It's a **structural rethink** of how generative video iteration works, packaged in a brand-coherent metaphor.

### 1.3 What it earns Clevroy
- **Iteration without anxiety.** Users can try variations without fear of "losing" the previous attempt. Every take is preserved.
- **A defensible category position.** "The AI film studio with takes" becomes the one-line description.
- **Brand-vocabulary fit.** "Take 1" is already in `ChatSurface.tsx`. Promote it from cosmetic to structural.
- **A shareable mechanic.** Twitter screenshot of "Take 1 / Take 2 / Take 3" of the same scene is a viral artifact.

---

## 2. The mental model

### 2.1 Definitions
- **Scene** — a logical position in the film (scene 1, scene 2, ...). Stable; ordered by the script.
- **Take** — one rendered attempt at a scene. A scene has at least 1 take; can have many.
- **Canonical take** — the take currently treated as "the scene" for purposes of the final cut. Pickable; replaceable.
- **Reshoot** — the verb for creating a new take of an existing scene. Already in the brand vocabulary.

### 2.2 State shape
Every `scene_image` and `scene_playback` asset message gets a new metadata field:

```ts
type ThreadMessageMetadata = {
  // ...existing fields...
  sceneId: string;          // already exists; the stable scene identifier
  sceneNumber: number;      // already exists
  takeNumber?: number;      // NEW — 1-indexed; 1 for the original, 2+ for reshoots
  isCanonical?: boolean;    // NEW — true for the take currently treated as "the scene"
  reshootReason?: string;   // NEW — short label for what was different ("low key lighting")
};
```

Constraints:
- Take 1 is always the original. `takeNumber: 1, isCanonical: true` on first creation.
- New takes default to `isCanonical: false`. The user explicitly picks.
- When a new take is marked canonical, the previous canonical is unmarked (`isCanonical: false`). Exactly one take per scene is canonical at any moment.

### 2.3 Where takes live in the data model
**Today**: `useMessages(filmId)` returns a flat list. Every reshoot adds a new asset message; nothing distinguishes it from a fresh scene.

**With takes**: same flat list, but `takeNumber` and `isCanonical` distinguish takes from scenes. A new selector hook `useTakesForScene(filmId, sceneId)` returns all takes ordered by `takeNumber`, identifying the canonical one.

The flat-list shape is preserved so Layer 5 / backend `thread_messages` schema doesn't change. Layer 4 (LLM tool router) emits new asset messages with the right `takeNumber` set.

---

## 3. UX surfaces

### 3.1 The thread renderer
**Today**: each scene asset renders as a single card.

**With takes**: a scene with multiple takes renders as a **stack** — the canonical take in front, with a small numeric indicator at the corner ("3 takes"). The stack reads as one logical scene, not three loose cards.

Click the stack → opens a Take Picker (see 3.2).

The non-canonical takes don't render inline in the thread. The thread shows the canonical version of each scene. This is the key insight: **takes are a private workspace, not a public feed.** The thread is the cut; takes are the dailies.

### 3.2 The Take Picker
A side panel (same shadcn `<Sheet>` infrastructure as `Clevroy_Scene_Manipulation_Prompt.md`).

Layout:
- Header: "Scene 3 takes"
- A horizontal row of take thumbnails — Take 1, Take 2, Take 3 (in chronological order, oldest left).
- Each thumbnail labeled with mono "TAKE 01" / "TAKE 02" caption + the reshoot reason ("low-key lighting") in italic Fraunces if present.
- The canonical take has a primary-color border + "Printed" badge.
- Body: the currently selected take rendered at full size (16:9 video for playback, image for stills).
- Footer:
  - "Print this take" button — promotes the selected take to canonical. Disabled if already canonical.
  - "Reshoot another take" link — opens the Manipulation Panel (from `Clevroy_Scene_Manipulation_Prompt.md`) pre-filled for this scene.
  - "Close" button.

### 3.3 The reshoot lifecycle
When the user reshoots a scene (via chat or the manipulation panel):

1. The LLM router calls the `reshoot_scene` tool with `{ scene_id, prompt_addition, take_number: <next> }`. The frontend computes `take_number` as `max(existing takes) + 1`.
2. A `narration` message lands: "Reshooting scene 3."
3. A new `scene_image` (and eventually `scene_playback`) message lands with `takeNumber: N, isCanonical: false`.
4. The thread renderer updates the scene's stack indicator: "3 takes."
5. **Auto-print rule**: if this is the user's first reshoot of the scene AND the manipulation panel was used (knob-driven), auto-promote the new take to canonical (`isCanonical: true`, demote the old). User explicitly chose to "Apply" — they intended the change.
6. **Manual-print rule**: if reshoot came from natural-language chat, the new take is **not** canonical by default. The user must open the picker and click "Print this take." Reasoning: chat refinements are exploratory; explicit application is committal.

### 3.4 The slate
The "Take 1" slate that already exists in `ChatSurface.tsx` (`PromptInputHeader` of the empty chat) becomes context-aware:

- **On `/home`** (empty mode): always "Take 1" (the user is starting fresh).
- **On `/films/[id]`** when the input is in refinement mode: "Take {N}" where N = (count of total messages in the thread / 5) — a rough heuristic that scales with iteration. Or, more honestly: count of `reshoot_scene` calls + 1.
- **On `/films/[id]`** when the user has clicked a scene's manipulation panel: "Take {N+1} of scene {sceneNumber}" — explicit context.

The slate becomes a **diegetic affordance** — the user feels which take they're directing.

### 3.5 The "compare" surface
A power-user view inside the Take Picker:

- A toggle at the top of the picker: "Compare side-by-side."
- When enabled, two takes render simultaneously, scrubbing in sync (for playback).
- Useful for "Which one looks better?" decisions.
- Mobile: defaults off; toggle exists but the layout falls back to stacked.

### 3.6 The "Print" affordance
Promoting a take to canonical is a deliberate, visible action.

When the user clicks "Print this take":
- Visual: a brief Fraunces toast — "Scene 3, Take 2 printed."
- The thread renderer updates the canonical scene to show this take.
- Optional ceremony (designer call): a 600ms Polaroid-shake animation on the thumbnail. Reduced-motion: skip.
- Audio (post-v1): a soft camera-shutter sound effect. Off by default; opt-in.

The verb "Print" is filmmaking-correct (a printed take is the one used in the cut) and avoids generic "Save" / "Use this" language.

### 3.7 The Take Counter in `/projects`
Each FilmCard on `/projects` could surface take statistics:

- "12 scenes · 19 takes" mono caption.
- Shows iteration depth without exposing failures or attempts.

Optional. Cosmetic but shows the user's investment in the film.

---

## 4. The vocabulary

| Concept | Brand verb | Anti-pattern (don't use) |
|---|---|---|
| Create another attempt | Reshoot | Regenerate, rerun, iterate, redo |
| Promote a take to canonical | Print this take | Save, use, select, accept, choose |
| The chosen take | Printed | Selected, current, active |
| Discard non-canonical takes | Strike (post-v1) | Delete, remove, prune |
| All takes for a scene | Dailies (post-v1, in some surfaces) | Versions, history, attempts |
| One specific take | Take {N} | Variant, version |

The "Strike" verb (filmmaking term for clearing the set) is reserved for v1.5+ when storage cost matters; for v1, all takes persist.

---

## 5. Implementation surface

This is **not** for Layer 3.5 (Scene Manipulation Panel). Takes is a Layer 4 + 5 concept that requires:

### 5.1 Layer 4 dependencies
- `reshoot_scene` tool schema needs to know about takes — the LLM router accepts a `scene_id`, the server-side handler determines `take_number` and emits the right asset metadata.
- Voice filter unchanged.

### 5.2 Layer 5 dependencies
- `thread_messages` schema gets the new metadata fields (no schema change, just the JSON shape).
- Backend reshoot mutation accepts and stores `take_number` and `is_canonical`.
- Backend "print take" mutation: `POST /api/films/{film_id}/scenes/{scene_id}/print-take` with `{ take_number }` payload. Updates the canonical flag in the database.
- The final-render pipeline reads `is_canonical` to decide which take to use in the cut.

### 5.3 Frontend-only ship for v1.5
A minimal version can ship as **frontend-only** before Layer 5:

- The store tracks `isCanonical` per take.
- "Print" is a frontend-only toggle (writes to localStorage via the chat-store).
- On `/films/[id]`, the canonical take is the one rendered.
- When Layer 5 ships, the same UI maps to the backend mutation.

This lets the takes UX validate without backend cost. Same pattern Clevroy used for everything else (fixtures first, real data later).

---

## 6. Why this beats the alternatives

### 6.1 vs "version history"
Notion-style version history exists in some products. It treats every change as a snapshot — boring, administrative, no narrative.

Takes are **named, contextual, finite** (you don't have take 47). They're a creative metaphor, not a backup mechanism.

### 6.2 vs "remix"
Remix (Sora, Runway community) is forking someone else's work. Takes are forking your own scene within a film. Different scope; complementary.

### 6.3 vs "regenerate"
Regenerate is a button. Takes are a structure. Once the user has used the takes UX once, they understand the model and use it deliberately.

### 6.4 vs nothing (Clevroy today)
Today every reshoot replaces the previous scene visually (the new asset card overwrites the user's mental model of "the scene"). Takes preserve all attempts, exposing the iteration as a creative process — not a debug log.

---

## 7. Design risks

### 7.1 Take proliferation
A user reshoots the same scene 12 times. The Take Picker becomes unwieldy. **Mitigation**: cap at 10 visible takes, scroll horizontally beyond that. Cap at 20 stored takes per scene; older takes auto-strike (with confirm).

### 7.2 Cognitive load on first-time users
"What's a take?" question on first use. **Mitigation**: the first reshoot triggers a one-time tooltip — "Each reshoot becomes a new take of this scene. You can compare them and print the keeper." Fraunces italic, dismisses on click. Same one-time mechanism as the first-unmute Fraunces tooltip.

### 7.3 Cost confusion
Each take costs a film. The user may not realize "Reshoot another take" is a billable action. **Mitigation**: the "Reshoot" CTA in the Take Picker shows the cost preview ("≈ 0.5 films") inline.

### 7.4 Mobile crowding
The Take Picker on mobile has limited horizontal space for thumbnails. **Mitigation**: vertical stack on `<sm`, horizontal on `≥sm`. Same shadcn Sheet, different content layout.

### 7.5 Brand-vocabulary fatigue
"Print," "Take," "Reshoot," "Slate" — the metaphor density is intense. Risk of seeming twee. **Mitigation**: the words appear in context (Take Picker, slate caption, reshoot button); tooltips and helper text use plain language ("This is the version used in your final film.").

---

## 8. Verification (when shipped)

1. **Empty state** — fresh film, scene 3 lands. Single asset card; no take indicator.
2. **First reshoot via chat** — second take lands with `takeNumber: 2`, not canonical. Thread renders the original (canonical); a "2 takes" indicator appears in the corner.
3. **First reshoot via manipulation panel** — second take lands and is auto-printed (canonical).
4. **Open Take Picker** — both takes visible; canonical has Printed badge.
5. **Print Take 2** — canonical swaps; thread re-renders with Take 2 visible.
6. **Compare mode** — toggle on; two videos play in sync.
7. **Slate context-aware** — on `/home` always "Take 1"; on `/films/[id]` reflects iteration count.
8. **Take counter on `/projects`** — film card shows "N scenes · M takes."
9. **First-time tooltip** — appears on first reshoot, dismisses on click, never returns.
10. **Mobile Take Picker** — stacks vertically; canonical pickable with single tap.

---

## 9. Build sequencing

This bet doesn't ship in isolation. Sequence:

1. **Layer 3.5** — Scene Strip + Manipulation Panel (`Clevroy_Scene_Manipulation_Prompt.md`) ships first. The manipulation panel becomes the natural entry point to the takes flow.
2. **Layer 4** — LLM tool router. `reshoot_scene` accepts `take_number` parameter; voice filter unchanged.
3. **Takes UX (frontend-only)** — store + UI for takes. Can ship before backend (v1.5 mode).
4. **Layer 5** — backend persistence of takes + canonical flag. Same UX, real data.

Each step is independently testable. The takes UX can ship as a frontend experiment to validate the metaphor before backend cost is paid.

---

## 10. The closing argument

Clevroy is already the only AI video tool with a **filmmaker's vocabulary** as its core brand. Takes is the structural extension of that vocabulary. It turns "Reshoot" from a button into a system. It turns iteration from anxiety-inducing replacement into curated production.

**This is the differentiation move that defines the category.** Once Clevroy has takes and competitors don't, the category description becomes "the one with takes." Sora can add storyboards; Runway can add Director Mode; Higgsfield can add 50 camera presets — none of those replicate the takes structure without rebuilding their entire data model around scenes-as-stable-positions and attempts-as-takes.

It's also the move that's most coherent with everything Clevroy is already building. The chat thread as artifact, the scene strip as overview, the manipulation panel as power-user surface — all three converge naturally on the takes mental model. This isn't a new feature; it's the **synthesis** of features Clevroy is already shipping.

The frontend can prototype it in 1–2 sessions. The backend cost is incremental on Layer 5. The marketing payoff is "the AI film studio with takes" — a one-line category-definer.

Worth doing.
