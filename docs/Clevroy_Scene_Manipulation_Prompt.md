# Layer 3.5 — Scene Strip + Direct Manipulation Panel

Companion to `docs/Clevroy_Competitor_Research.md`. Closes gaps 5.2 (no direct manipulation) and 5.4 (no scene-strip view) on `/films/[id]`.

This is a **single self-contained prompt** for the next session. Layer 3.5 because it sits between Layer 3 (message components, shipped) and Layer 4 (LLM wiring) — it's purely additive UI on top of the existing thread.

---

## Where we are

Repo: `C:\Users\javar\Desktop\clevroy-frontend`. Branch: `main`. Single-developer layered build (`CLAUDE.md`). Layers 0–3 + State Management have shipped. Layer 4 + 5 are not started.

This task adds two complementary surfaces to `/films/[id]`:

1. **A horizontal scene strip** sticky at the top of the thread, showing every scene asset in one row. Click to scroll-to-asset in the thread.
2. **A direct-manipulation side panel** that opens when the user clicks any asset card or a strip thumbnail. Knobs (lighting, color, framing, motion) translate to refinement prompts that pre-fill the chat input.

The thread stays as the hero. These two are complements, not replacements. Pure-chat refinement is still the bet; this is the safety net.

**Read these before writing code:**
- `CLAUDE.md` — ground rules.
- `docs/Clevroy_Chat_Surface.md` §2 (message types) and §13 (home contract).
- `docs/Clevroy_Competitor_Research.md` — gaps 5.2 and 5.4 motivate this work.
- `app/(app)/(chat)/films/[id]/page.tsx` and `app/(app)/(chat)/layout.tsx` — current thread mounting.
- `src/components/chat/ChatSurface.tsx` `ThreadView` and `ThreadMessages` — current renderer.
- `src/components/chat/messages/*` — leaf renderers.
- `src/components/scene-strip/SceneStrip.tsx` — existing horizontal strip (built but unused on /films).
- `src/stores/chat-store.ts` — `useMessages(filmId)`.

## What this layer ships

A `/films/[id]` page that combines:
- The vertical chat thread (existing — unchanged).
- A horizontal scene strip docked sticky-top, hidden until at least one scene asset has landed.
- A direct-manipulation side panel that slides in from the right when an asset card is clicked. Knobs build a refinement prompt; clicking "Apply" pre-fills the chat input (does not auto-submit).

## Decisions locked

1. **Scene strip is sticky-top of the thread, not the page.** Inside the scrollable `<ThreadMessages>` area, anchored to the top of the visible region. Scrolls with the thread initially, then sticks once it would scroll out of view. Mirrors GitHub's sticky file headers.
2. **Strip shows scene assets only** — `scene_image` and `scene_playback` types. Not `character_refs`, not `assembly_preview`, not `final_film`. Just the scenes.
3. **Click strip thumbnail → smooth-scroll-to-asset in the thread.** Doesn't open the manipulation panel; that's a separate gesture.
4. **Click an asset card body → open manipulation panel.** Click anywhere except the existing AssetOverflow menu. The whole card becomes interactive; the overflow menu retains its existing behavior.
5. **Manipulation panel is a side sheet** (right-side, ~400px desktop, full-width mobile). Built from shadcn `<Sheet>`. Closes on Escape, click-outside, or the close button.
6. **Knobs build a prompt; clicking "Apply" pre-fills the chat input (does not auto-submit).** User reviews and hits Roll. Reasoning: chat is the canonical refinement path; the panel is a generator-of-prompts, not a parallel surface.
7. **Knobs are scene-type aware.** Scene image cards expose lighting + color grade + framing + style. Scene playback cards add motion + camera move + duration. Different subsets per asset type.
8. **No real backend mutations.** This layer ships the UI; Layer 4 wires the actual reshoot through the LLM tool router.

## File-by-file work order

### 1. Adapt `<SceneStrip>` for thread use

`src/components/scene-strip/SceneStrip.tsx` exists. Read it. It may already be filmstrip-shaped; if not, refactor.

The version this layer needs:
- Horizontal scrollable row, snap-x.
- Each cell is a thumbnail (~64px tall × 16:9) of a scene's image or playback poster.
- Cells labeled with scene number ("01", "02", "03") in mono caption beneath.
- Active cell (the one the user has scrolled to in the thread) gets a 2px primary border.
- Empty state: hidden entirely until the first scene asset lands.

If SceneStrip is currently coupled to FilmStateSnapshot or other heavy data shapes, create a new `src/components/chat/ThreadSceneStrip.tsx` that takes a slim `Array<{ sceneNumber, posterUrl, sceneId, type: 'image' | 'playback' }>` instead. Keep the old SceneStrip as-is for legacy callers (Layer 5 may revive it).

### 2. Mount the strip in `<ThreadView>`

Modify `src/components/chat/ChatSurface.tsx` `ThreadView`:

- Compute the slim scene list from `useMessages(filmId)` — filter to `m.type === "asset"` AND `m.metadata?.assetKind === "scene_image" || "scene_playback"`. Map to the slim shape.
- Mount `<ThreadSceneStrip>` at the top of `<ThreadMessages>`, inside the scrollable area, with `sticky top-0 z-10`.
- Hide if `sceneList.length === 0`.
- Click handler: scroll the corresponding `<MessageRenderer>` element into view via `scrollIntoView({ block: "center", behavior: "smooth" })`. Each message needs a stable id attribute (`data-message-id={m.id}`) for the lookup.

### 3. Track active scene from scroll position

Add an `IntersectionObserver` in `<ThreadMessages>` that watches each scene asset's container. The most-visible scene becomes "active" — passed to `<ThreadSceneStrip activeSceneId={…}>`. Visual: 2px primary border on the active cell.

Reduced-motion: disable the `behavior: "smooth"` scroll, jump instantly.

### 4. Manipulation panel — `<SceneRefinePanel>`

Create `src/components/chat/SceneRefinePanel.tsx`. Composition:

```tsx
<Sheet open={openSceneId !== null} onOpenChange={(open) => !open && setOpenSceneId(null)}>
  <SheetContent side="right" className="w-full sm:max-w-md">
    <SheetHeader>
      <SheetTitle>Reshoot scene {sceneNumber}</SheetTitle>
    </SheetHeader>
    <div className="grid gap-6 py-4">
      {/* Knob clusters per scene type */}
    </div>
    <SheetFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onApply}>Apply to chat</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

Knob clusters:

#### 4a. Lighting (image + playback)
Segmented control: `Auto / Low key / High key / Golden hour / Blue hour / Practical`.
Maps to prompt fragments:
- Low key → "low-key lighting, deep shadows"
- High key → "high-key lighting, bright and even"
- Golden hour → "golden hour, warm low sun"
- Blue hour → "blue hour, cool dusk light"
- Practical → "practical lighting from the scene's own sources"

#### 4b. Color grade (image + playback)
Segmented control: `Auto / Warm / Cool / Teal+orange / Desaturated / High contrast / Pastel`.
Maps to prompt fragments accordingly.

#### 4c. Framing (image + playback)
Segmented control: `Auto / Wide / Medium / Close-up / Extreme close-up / Low angle / High angle / Dutch tilt`.

#### 4d. Style intensity (image + playback)
Slider 0–100. Caption: "How strongly to apply the chosen style."
Maps to prompt fragments at 25/50/75/100 thresholds.

#### 4e. Motion (playback only)
Segmented control: `Static / Subtle / Pronounced / Dynamic`.
Maps to "subtle handheld motion" / "noticeable camera movement" / "energetic camera work."

#### 4f. Camera move (playback only)
Segmented control of the cinematography vocabulary chips:
`None / Dolly in / Dolly out / Pan left / Pan right / Tilt up / Tilt down / Crane up / Whip pan / Push in / Pull back`.
(See `docs/Clevroy_Cinematography_Vocabulary_Spec.md` for the broader vocabulary surface — these are the subset relevant per-scene.)

#### 4g. Duration (playback only)
Segmented control: `Same / Shorter / Longer`. Maps to "trimmed by 25%" or "extended by 25%."

### 5. Prompt builder

`src/lib/chat/build-refinement-prompt.ts` — pure function, no React.

```ts
type RefinementOptions = {
  sceneNumber: number;
  lighting?: string;
  colorGrade?: string;
  framing?: string;
  styleIntensity?: number;
  motion?: string;
  cameraMove?: string;
  duration?: 'shorter' | 'longer';
};

export function buildRefinementPrompt(opts: RefinementOptions): string;
```

Produces a natural-language prompt like:
> "Reshoot scene 3 with low-key lighting, deep shadows, a teal-and-orange grade, framed as a close-up. Add a dolly-in camera move."

Discipline:
- "Reshoot scene N" prefix always.
- Comma-separated clauses.
- Skip clauses where the option is "Auto" or default.
- Maximum one camera move per prompt (multiple is incoherent).
- Output ≤ 25 words. If exceeded, drop the lowest-priority clauses (style intensity → motion → duration).

### 6. Apply lifecycle

When the user clicks "Apply to chat" in the panel:
1. Call `buildRefinementPrompt(opts)` → string.
2. Use `usePromptInputController().textInput.setInput(generatedPrompt)`.
3. Close the panel.
4. The chat input now contains the prompt. User can edit, then hit Roll.
5. **Do not auto-submit.** That's a deliberate UX call — the chat is the canonical refinement path.

### 7. Asset card click handler

Modify the asset card components to make the card body clickable:
- `src/components/chat/messages/SceneImageCard.tsx`
- `src/components/chat/messages/ScenePlaybackCard.tsx`

Add an `onClick` to the figure/wrapper element that calls `onOpenRefinePanel(message.id, sceneId, sceneNumber)`. The AssetOverflow menu still works (clicking the overflow trigger doesn't propagate to the card body — `e.stopPropagation()`).

The click target excludes interactive elements within the card (existing buttons like the unmute toggle on ScenePlaybackCard). Use a wrapper `<button>` with all the visual styling.

### 8. State plumbing

The "currently open scene" is local UI state on the ThreadView. Keep it simple:

```tsx
const [openRefineFor, setOpenRefineFor] = React.useState<{
  messageId: string;
  sceneId: string | undefined;
  sceneNumber: number | null;
} | null>(null);
```

Pass `onOpenRefinePanel` down through `<ThreadMessages>` → `<MessageRenderer>` → asset cards. Same prop pattern as the existing action handlers (`onReshootScene`, etc.).

### 9. Empty + edge states

- **Strip is empty:** hide entirely. No "no scenes yet" message.
- **Refine panel opens for a scene with no playback URL:** the playback-only knobs (motion, camera, duration) are disabled with helper text "Available after the scene plays back."
- **User clicks a card on a thread that has no `usePhaseWalker` running:** the panel still opens. Refinement is generic (the user types something, hits Roll, Layer 4 routes it).
- **Mobile:** Sheet renders full-width. The bottom-anchored chat input remains accessible — the Sheet doesn't cover it.

### 10. Accessibility

- Strip cells: `<button>` elements, `aria-label="Scene 3, click to scroll to asset"`. Keyboard: Tab through, Enter to scroll.
- Asset card click: `aria-label="Refine scene 3"`. Keyboard: Tab to card body, Enter to open panel.
- Panel: shadcn Sheet handles focus trap + Escape + ARIA roles. Ensure the first focusable element is sensible (the first segmented control trigger).
- Reduced-motion: disable smooth scroll, disable Sheet entrance animation under `prefers-reduced-motion`.

## Don't do (out of scope)

- Real reshoot mutation — Layer 4.
- Per-scene character editing (changing who's in the scene) — Layer 4 + character-consistency surface.
- Direct-pixel painting on the asset (motion brush) — Layer 5 if ever.
- Camera-move presets gallery as a standalone page — that's `Cinematography_Vocabulary_Spec`.
- Editing other message types (narration text, system messages).
- A panel for the AssemblyPreviewCard or FinalFilmCard — those are read-only by design.

## Constraints reminder

- shadcn `<Sheet>` for the panel; shadcn `<ToggleGroup>` for segmented controls; shadcn `<Slider>` for style intensity.
- 12px panel radius for sections inside the Sheet, 16px for the Sheet itself.
- 44×44 touch targets for every clickable cell, knob, and button.
- Color tokens only.
- Banned copy: Oops, Something went wrong, Generate, Magical, Seamless, Simply, AI-powered, no emoji.
- Reduced-motion respected throughout.
- Brand verbs: "Reshoot scene N," "Apply to chat," "Cancel."
- TypeScript strict mode passes.

## Verification (user runs in browser)

1. **Empty thread on `/films/[id]`** — no scene strip visible.
2. **First scene_image lands** — strip appears at top of thread with 1 thumbnail, sticky as user scrolls.
3. **Multiple scenes** — strip shows all of them; active cell updates as user scrolls past each scene asset.
4. **Click strip cell** — thread smooth-scrolls to that scene asset.
5. **Click asset card body** — Sheet slides in from right with knobs.
6. **Open scene_image panel** — lighting, color grade, framing, style intensity. No motion/camera/duration knobs.
7. **Open scene_playback panel** — all knobs visible.
8. **Configure knobs + Apply** — Sheet closes, chat input populated with a natural-language prompt. User can edit, hits Roll.
9. **Cancel** — Sheet closes, chat input untouched.
10. **AssetOverflow menu still works** — clicking the three-dot doesn't open the panel; existing menu items render.
11. **Mobile** — Sheet full-width, chat input still accessible.
12. **Keyboard navigation** — Tab through strip cells, Enter scrolls. Tab to a card, Enter opens panel.
13. **Reduced motion** — no smooth scroll, no Sheet entrance animation.
14. `npx tsc --noEmit` passes.

Ship this. The thread stays the hero; this is the safety net + power-user surface that competitors will measure us against.
