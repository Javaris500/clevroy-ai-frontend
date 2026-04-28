# Prompt — `/library` page

Self-contained prompt for one of two parallel sessions. Pairs with `docs/Clevroy_Templates_Prompt.md`.

This task is **parallel-safe** with the `/templates` prompt — both edit `src/lib/copy.ts` and the nav files but in separately-labeled sections. If both run simultaneously, the user merges manually after.

---

## Where we are

Repo: `C:\Users\javar\Desktop\clevroy-frontend`. Branch: `main`. Single-developer layered build (`CLAUDE.md`). Layers 0–3 + State Management have shipped. Layer 4 + 5 are not started — this work runs on fixtures.

This task ships `/library` — the user's private vault of saved ingredients across five tabs: Saved templates, Characters, Styles, References, Drafts. Tab navigation via sub-routes; deep-linkable.

**Read these before writing code:**
- `CLAUDE.md` — ground rules.
- `app/(app)/settings/layout.tsx` — Tabs strip + sub-route routing pattern to mirror.
- `src/components/providers/profile-provider.tsx` — `useProfile()` reads voice/face status; characters tab uses this for the "You" tile.
- `src/stores/library-store.ts` — exists if the templates session has merged; otherwise create with all five slices below.
- `src/components/templates/TemplateCard.tsx` — the templates session creates this; library's saved tab reuses it. If the templates session hasn't merged, stub a placeholder card and integrate later.
- `src/lib/copy.ts` — copy registry; `navLinks` lives here.
- `src/components/nav/Sidebar.tsx` and `BottomTabBar.tsx` — nav rendering.

---

## Design context

### Why this page exists

The competitive research called out two missing surfaces (gaps 5.3 + 5.6): no discovery, no character-consistency surface during generation. Discovery (community feed) is post-v1 — out of scope here. What we *can* ship today is **personal discovery**: "things I've saved, characters I've built, drafts I haven't sent."

Library is the user's private vault. Where the user keeps ingredients before/after films — distinct from `/projects` (finished films) and `/templates` (public starting points).

### What this page is NOT

Templates ≠ Library ≠ Projects. Each has a job:

| Surface | Content owner | Public/private | Primary action |
|---|---|---|---|
| `/templates` | Clevroy team | Public to all users | Use a template → start a film |
| `/library` | The user | Private to the user | Find something saved → reuse |
| `/projects` | The user | Private to the user | Open a finished film → watch / refine |

Don't merge. Library is **personal vault**. Projects is **finished work**.

### The job

"Help me find something I made or kept. Get me back to it fast."

Five tabs:

1. **Saved templates** — bookmarks from `/templates`.
2. **Characters** — AI Twin variants. The user's primary voice + face is one character; named variants are others ("Maya," "Detective Reyes" — a specific face + voice + style combo for a recurring role).
3. **Styles** — saved style presets beyond the default 4 (Cinematic / Documentary / Noir / Animated). User-named, prompt-fragment-based.
4. **References** — uploaded images the user wants the AI to see (mood boards, location refs).
5. **Drafts** — incomplete scripts saved from the chat input that didn't get sent to mint.

### Top-tier moves

1. **Characters as a first-class concept.** The "You" tile + named characters surface AI Twin's value across films. Most competitors require BYO LoRA; you have first-party variants.
2. **Style fragments are remixable.** Style tiles aren't black boxes — the user sees the prompt fragments and can edit them. Demystifies "what does Cinematic mean?"
3. **Drafts as a list, not a grid.** Drafts are text-first. Don't force them into card shapes.
4. **One-click "Use in next film" everywhere.** Every library item has a primary verb: use this character, use this style, open this draft. Library is for *using*, not just looking.
5. **Empty states with calls-to-action that route elsewhere.** "Save templates from /templates" / "Drop images here" / "Save drafts from /home." Library admits when it's empty and shows the user where to go fill it.

---

## What this work ships

- A `/library` route group with a tabs layout and five tab routes:
  - `/library` (redirects to `/library/templates`)
  - `/library/templates`
  - `/library/characters`
  - `/library/styles`
  - `/library/references`
  - `/library/drafts`
- Per-tab grid/list views, empty states, and overflow actions.
- Extension of `library-store.ts` with characters, styles, references, drafts slices.
- A character creation sheet, a style creation sheet, and a draft-list view with open/delete actions.
- New nav entry "Library" in the sidebar + bottom tab bar.
- A "Save as draft" affordance in `/home`'s chat input (overflow menu).

## Decisions locked

1. **Tabs are sub-routes**, not client-side state. Same pattern as `/settings/*`. Each tab is a separate page.
2. **All persistence is localStorage today** via `zustand/middleware persist`. Layer 5 swaps for backend.
3. **Saved templates tab reuses `<TemplateCard>`** from the templates session. If templates hasn't merged, render a placeholder list.
4. **Characters: "You" tile is the primary AI Twin** from `useProfile()` — non-deletable, editable name.
5. **Style fragments are visible**, not opaque — show prompt fragments as comma-separated chips on style tiles.
6. **References storage cap**: 20 references per user (storage cost).
7. **Drafts storage cap**: 30 drafts per user (oldest auto-pruned with toast warning).
8. **All "Use" actions** route to `/home` with appropriate `clevroy:home:prefill*` sessionStorage keys set.

## File-by-file work order

### 1. Library store extension

Modify or create `src/stores/library-store.ts`:

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// --- Saved templates (may already exist if templates session has merged) ---
type SavedTemplatesSlice = {
  savedTemplateIds: string[];
  saveTemplate: (id: string) => void;
  unsaveTemplate: (id: string) => void;
  isSaved: (id: string) => boolean;
};

// --- Characters ---
export interface Character {
  id: string;
  name: string;
  faceDataUrl: string | null;       // null = uses primary AI Twin face
  voiceDataUrl: string | null;      // null = uses primary AI Twin voice
  styleNotes: string;               // 200-char prompt fragment
  isPrimary: boolean;               // true for "You" — undeletable
  createdAt: string;
}

type CharactersSlice = {
  characters: Character[];
  addCharacter: (c: Omit<Character, "id" | "createdAt" | "isPrimary">) => string;
  renameCharacter: (id: string, name: string) => void;
  deleteCharacter: (id: string) => void;
};

// --- Styles ---
export interface SavedStyle {
  id: string;
  name: string;
  basedOn: StylePreset | null;
  fragments: string[];     // ["warm grade", "low contrast", "35mm film"]
  thumbnailUrl: string;    // fixture
  createdAt: string;
}

type StylesSlice = {
  savedStyles: SavedStyle[];
  addStyle: (s: Omit<SavedStyle, "id" | "createdAt">) => string;
  renameStyle: (id: string, name: string) => void;
  deleteStyle: (id: string) => void;
  duplicateStyle: (id: string) => string;
};

// --- References ---
export interface Reference {
  id: string;
  title: string;
  imageDataUrl: string;
  createdAt: string;
}

type ReferencesSlice = {
  references: Reference[];
  addReference: (r: Omit<Reference, "id" | "createdAt">) => string;
  renameReference: (id: string, title: string) => void;
  deleteReference: (id: string) => void;
};

// --- Drafts ---
export interface Draft {
  id: string;
  title: string;          // auto-derived from first 8 words; user can rename
  script: string;
  style: StylePreset | null;
  aspect: Aspect;
  lastEditedAt: string;
}

type DraftsSlice = {
  drafts: Draft[];
  addDraft: (d: Omit<Draft, "id" | "lastEditedAt">) => string;
  updateDraft: (id: string, patch: Partial<Omit<Draft, "id">>) => void;
  renameDraft: (id: string, title: string) => void;
  deleteDraft: (id: string) => void;
};

type LibraryStore = SavedTemplatesSlice
  & CharactersSlice
  & StylesSlice
  & ReferencesSlice
  & DraftsSlice;

export const useLibraryStore = create<LibraryStore>()(
  persist(/* ... */, {
    name: "clevroy:library:v1",
    /* ... */
  }),
);
```

Caps: 50 templates, 20 references, 30 drafts. Drop-oldest with a Sonner toast on overflow.

If the templates session has already created the file with the saved-templates slice, merge into it without losing the existing keys. Don't change the persist key.

### 2. Tabs layout

Create `app/(app)/library/layout.tsx`. Same pattern as `app/(app)/settings/layout.tsx`:

- PagePanel with title "Library" and subline "Your saved ingredients."
- shadcn `<Tabs>` with `Link` triggers → sub-routes.
- Active tab from `usePathname()`.
- Each tab trigger shows a count badge.
- Mobile: horizontal scroll on the tabs strip.

```tsx
const TABS = [
  { href: "/library/templates", labelKey: "templates" },
  { href: "/library/characters", labelKey: "characters" },
  { href: "/library/styles", labelKey: "styles" },
  { href: "/library/references", labelKey: "references" },
  { href: "/library/drafts", labelKey: "drafts" },
] as const;
```

### 3. Index redirect

Create `app/(app)/library/page.tsx` with `redirect('/library/templates')`.

### 4. Tab pages

Create one `page.tsx` per tab under `app/(app)/library/`.

#### 4a. `/library/templates/page.tsx`

- Read `savedTemplateIds` from `library-store`.
- Look up the template objects from `TEMPLATES` in `src/lib/templates/data.ts` (created by templates session).
- Render with the same grid as `/templates`, using `<TemplateCard>`.
- Each card: same actions, but the "Save" toggle un-saves (since they're already saved).
- Empty state: "Save templates from /templates to find them here." with a "Browse templates" link.
- Search input top right (filters titles).

If `<TemplateCard>` doesn't exist yet (templates session hasn't merged), render a placeholder list with title + remove button.

#### 4b. `/library/characters/page.tsx`

- Read `characters` from `library-store` (may be empty).
- Always render the "You" tile first — built from `useProfile()` data:
  - Portrait from `profile.face_twin_key` (fixture image if present).
  - Name "You."
  - Mono caption: voice status + face status from `profile.voice_twin_status` / `profile.face_twin_status`.
  - Overflow: Edit (routes to `/settings/ai-twin`).
  - Cannot delete.
- Then render all entries from `characters[]` as cards:
  - Square portrait (from `faceDataUrl` or fall back to `profile.face_twin_key`).
  - Name (Fraunces).
  - Mono caption: brief style notes.
  - Overflow:
    - "Use in next film" → writes character details to `clevroy:home:character` sessionStorage key + routes to `/home`. The chat surface reads this and pre-pends the character's `styleNotes` to the prompt. (Layer 4 will properly route this through the LLM tools.)
    - Rename → opens an inline rename input.
    - Delete → ConfirmDialog `confirmVerbPairs.delete`.
- "+ New character" tile at the end of the grid → opens `<CharacterCreateSheet>`.

Empty state: just the "You" tile + the "+ New character" tile.

#### 4c. `/library/styles/page.tsx`

- Read `savedStyles` from `library-store`.
- Grid of style tiles:
  - Thumbnail at the top (fixture image — `picsum.photos/seed/${styleId}/...`).
  - Name (Fraunces).
  - Fragments rendered as small mono chips (`text-[10px] uppercase tracking-[0.18em]`).
  - "Based on: Cinematic" mono caption if `basedOn` set.
  - Overflow:
    - "Use as default" → updates `create-options-store.style` to use this preset (extends the store to accept saved styles, not just defaults).
    - Rename, Delete, Duplicate.
- "+ New style" tile → opens `<StyleCreateSheet>`.
- Empty state: "Build a style with prompt fragments. Use it across your films."

#### 4d. `/library/references/page.tsx`

- Read `references` from `library-store`.
- Grid of square thumbnails.
- Each with overflow: View · Rename · Delete · Use in next film.
- "+ Upload" tile → opens a file picker; reads the selected image as data URL; writes to `library-store.references`.
- Empty state: drag-drop zone "Drop images here for the AI to see." Drag-drop works on the empty state itself.

For v1: storage is local (data URLs). 5MB cap per reference; warn if exceeded.

#### 4e. `/library/drafts/page.tsx`

- Read `drafts` from `library-store`.
- **List view, not grid.** Each row:
  - Title (auto-derived; renameable).
  - First 2 lines of `script` (muted, truncated).
  - Mono caption: "Last edited 2h ago."
  - Right-side actions: Open · Delete.
- "Open" → writes draft's script + style + aspect to `clevroy:home:prefill*` sessionStorage keys → routes to `/home`.
- Empty state: "Save drafts from /home when you're not ready to mint yet." with link.

### 5. Creation sheets

Create under `src/components/library/`:

#### 5a. `<CharacterCreateSheet>`

- Right-side `<Sheet>`, 480px desktop / full-width mobile.
- Form fields:
  - Name (required, 2–32 chars).
  - Face source: radio "Use my AI Twin face" / "Upload new." Upload uses file picker; preview after upload.
  - Voice source: radio "Use my AI Twin voice" / "Record new." Record uses `MediaRecorder` (same primitive as onboarding voice step); 30-second cap.
  - Style notes: textarea, 200-char limit, helper "Describe how this character looks and sounds."
- Actions: Save · Cancel.
- Save → calls `addCharacter` and closes the sheet.

#### 5b. `<StyleCreateSheet>`

- Right-side `<Sheet>`.
- Form fields:
  - Name (required).
  - Based on: dropdown of the 4 default presets + "Custom."
  - Prompt fragments: a tag input — type a fragment, press Enter to add as a chip; click a chip's X to remove.
  - Sample prompt preview: live-rendered concatenation of fragments, comma-separated, mono.
- Actions: Save · Cancel.

### 6. Save-as-draft from `/home`

Modify `src/components/chat/ChatSurface.tsx` `SubmitConsumer`:

- Add an overflow menu next to the Roll button (small chevron-down icon button, 44×44).
- Menu items:
  - "Save as draft" — captures current textarea value + style + aspect, writes to `library-store.addDraft`. Sonner toast: "Saved to drafts."
  - Optional: "Clear input" — secondary action.
- Disabled if textarea is empty.

### 7. Nav additions

Add a Library entry to `navLinks` in `src/lib/copy.ts`. Insertion section:

```ts
// --- Library additions (parallel-safe) ---
library: { label: "Library", href: "/library" },
// --- End Library additions ---
```

In `src/components/nav/Sidebar.tsx` `NAV_ITEMS`, add `{ key: "library", ...navLinks.library, icon: BookmarkIcon }` between Projects and AI Twin. (`BookmarkIcon` from `lucide-react`.)

In `src/components/nav/BottomTabBar.tsx`, add the same entry. Note: bottom tab bar maxes at 5 slots; if both this prompt and the templates prompt run, the user will need to demote one. Add a comment:

```ts
// TODO(nav): bottom tab bar at 6+ slots; demote AI Twin or Settings to a profile menu.
```

### 8. Copy registry

Add to `src/lib/copy.ts`:

```ts
export const library = {
  pageTitle: "Library",
  subline: "Your saved ingredients.",
  tabs: {
    templates: "Saved templates",
    characters: "Characters",
    styles: "Styles",
    references: "References",
    drafts: "Drafts",
  },
  templates: {
    empty: "Save templates from Templates to find them here.",
    browseLink: "Browse templates",
    searchPlaceholder: "Search saved templates",
  },
  characters: {
    primaryName: "You",
    primaryHelper: (status: string) => `Voice: ${status}`,
    addNew: "+ New character",
    empty: "Build your first recurring character.",
    nameLabel: "Name",
    nameHelper: "How you'll refer to this character.",
    faceSource: "Face",
    faceUseTwin: "Use my AI Twin face",
    faceUpload: "Upload new",
    voiceSource: "Voice",
    voiceUseTwin: "Use my AI Twin voice",
    voiceRecord: "Record new",
    notesLabel: "Style notes",
    notesHelper: "Describe how this character looks and sounds.",
    save: "Save character",
    cancel: "Cancel",
    useInFilm: "Use in next film",
    rename: "Rename",
    delete: "Delete",
  },
  styles: {
    addNew: "+ New style",
    empty: "Build a style with prompt fragments. Use it across your films.",
    nameLabel: "Name",
    basedOnLabel: "Based on",
    basedOnCustom: "Custom",
    fragmentsLabel: "Prompt fragments",
    fragmentsPlaceholder: "warm grade, low contrast, 35mm film…",
    fragmentsHelper: "Press Enter to add each fragment.",
    samplePromptLabel: "Sample prompt",
    save: "Save style",
    useAsDefault: "Use as default",
    duplicate: "Duplicate",
  },
  references: {
    addNew: "+ Upload",
    empty: "Drop images here for the AI to see.",
    dropZoneIdle: "Drag images here, or click to upload.",
    use: "Use in next film",
  },
  drafts: {
    empty: "Save drafts from Home when you're not ready to mint yet.",
    homeLink: "Go to Home",
    open: "Open",
    delete: "Delete",
    lastEdited: (rel: string) => `Last edited ${rel}`,
    saveAsDraft: "Save as draft",
    savedToast: "Saved to drafts.",
  },
} as const;
```

### 9. Page metadata

Set per tab:
```tsx
export const metadata = { title: "Library · Clevroy" };
```

## Don't do (out of scope)

- Real backend persistence — Layer 5.
- Editing characters/styles inline (only via creation sheet) — full editor is post-v1.
- Cross-character voice cloning UI (sharing voice across characters with attribution).
- Reference image vector embeddings or AI-tag generation.
- Real R2 upload for face/voice/reference data — fixture data URLs only.
- Anything outside `app/(app)/library/`, `src/components/library/`, `src/stores/library-store.ts`, `src/lib/copy.ts` (library section), `src/components/nav/Sidebar.tsx` (library entry), `src/components/nav/BottomTabBar.tsx` (library entry), and the save-as-draft addition in `ChatSurface.tsx`.
- The `/templates` page or its components — separate prompt.
- The Templates copy section in `copy.ts` — separate session owns it.

## Constraints reminder

- shadcn-first / AI Elements-first.
- 12px panel radius, 16px soft surfaces, color tokens only.
- 44×44 touch targets. Respect `prefers-reduced-motion`.
- "films" surface language; banned: Oops, Something went wrong, Generate, Magical, Seamless, Simply, AI-powered, emoji.
- Inter / Fraunces / JetBrains Mono.
- Work directly on `main`. Read-only git only — don't commit.
- TypeScript strict mode passes (`npx tsc --noEmit`).

## Verification (user runs in browser)

1. **`/library` redirects to `/library/templates`** on first visit.
2. **Tabs strip** renders five tabs with counts. Active tab matches URL.
3. **Templates tab empty** — empty state with "Browse templates" link routing to `/templates`.
4. **Templates tab populated** — after saving a template via `/templates`, it appears here. Removing un-saves.
5. **Characters tab** — "You" tile appears at top from fixture profile. "+ New character" opens creation sheet. Saving a character adds a tile. Rename / delete work via overflow.
6. **Character "Use in next film"** — sets `clevroy:home:character` sessionStorage; navigating to `/home` shows the character's notes pre-applied.
7. **Styles tab** — empty state. Create a style "Sun-bleached western" with fragments ["warm grade", "wide angle", "70mm film"]. Tile renders with fragments as chips.
8. **Style "Use as default"** — `create-options-store.style` updates to use this saved style.
9. **References tab** — empty state with drag-drop zone. Drag in a JPG; it appears as a thumbnail.
10. **Drafts tab** — go to `/home`, type "A noir about a missing dog," click "Save as draft" via the new overflow menu, toast confirms. Visit `/library/drafts`; the draft renders with title auto-derived. Click "Open" → routes to `/home` with the script in the input.
11. **Storage caps** — saving a 51st template, 21st reference, 31st draft surfaces a toast warning and drops the oldest.
12. **Mobile** — tabs scroll; per-tab content stacks; creation sheets full-width.
13. **Sidebar nav** — Library item visible; clicking lands on `/library/templates`.
14. **Bottom tab bar** — Library appears (with TODO comment about overflow).
15. **Persistence** — refresh; saved characters/styles/references/drafts/templates all survive.
16. `npx tsc --noEmit` passes.

Ship this. Library becomes the workbench where users build recurring characters, custom styles, and rescued drafts — the surface that compounds over time.
