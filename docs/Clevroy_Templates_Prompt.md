# Prompt — `/templates` page

Self-contained prompt for one of two parallel sessions. Pairs with `docs/Clevroy_Library_Prompt.md`.

This task is **parallel-safe** with the `/library` prompt — both edit `src/lib/copy.ts` and the nav files but in separately-labeled sections. If both run simultaneously, the user merges manually after.

---

## Where we are

Repo: `C:\Users\javar\Desktop\clevroy-frontend`. Branch: `main`. Single-developer layered build (`CLAUDE.md`). Layers 0–3 + State Management have shipped. Layer 4 + 5 are not started — this work runs on fixtures.

This task ships a new route at `/templates`: a curated browse-and-use gallery of starting-point film templates. Public to all users; content owned by the Clevroy team (community submissions are post-v1).

**Read these before writing code:**
- `CLAUDE.md` — ground rules.
- `docs/Clevroy_Competitor_Research.md` Section 3.10 — pattern lessons from Pika, Captions, Sora.
- `app/(app)/projects/page.tsx` — `<FilmCard>` pattern that informs `<TemplateCard>` style.
- `src/components/chat/ChatSurface.tsx` — `clevroy:home:prefill` mechanism for "Use this template."
- `src/components/chat/messages/ScenePlaybackCard.tsx` — the autoplay-muted-with-unmute primitive that powers preview clips.
- `src/lib/copy.ts` — copy registry; `navLinks` lives here.
- `src/components/nav/Sidebar.tsx` and `BottomTabBar.tsx` — nav rendering.

---

## Design context

### Why this page exists

The competitive research called out a missing surface (gap 5.5): Pika has Pikaffects, Captions has hundreds of templates with thumbnails, Sora has curated Explore. New users on Clevroy face a blank textarea with 12 rotating prompt cards. Most users want to *modify* an existing thing, not write from scratch.

Templates is the public-facing browse surface — curated starting points where users see what's possible and click "Use" to begin a film with a proven script.

### What this page is NOT

Templates ≠ Library ≠ Projects. Each has a job:

| Surface | Content owner | Public/private | Primary action |
|---|---|---|---|
| `/templates` | Clevroy team | Public to all users | Use a template → start a film |
| `/library` | The user | Private to the user | Find something saved → reuse |
| `/projects` | The user | Private to the user | Open a finished film → watch / refine |

Don't merge these. Templates is **inspiration + starting points**. Library is **personal vault**. Projects is **finished work**.

### The job

"Show me what's possible. Let me start from one of these."

- Curated by the Clevroy team (community-submitted templates are post-v1).
- 12–18 templates at launch, grouped by category (Drama, Comedy, Documentary, Horror, Romance, Trailer, Short, Music Video).
- Each template = a complete bundle: title, description, category, duration, default style, default aspect, script, poster art, sample preview clip.
- Action: "Use this template" → fills the chat input with the script, routes to `/home`, pre-applies style + aspect.
- Action: "Save" → adds to user's Library tab "Saved templates."
- Visual hierarchy: **poster-art-first**. Each template is a film poster, not a card.

### Top-tier moves

1. **Poster-art-first layout.** Don't render templates as cards with thumbnails on top. Render them as posters that *happen* to have metadata below. The poster IS the template.
2. **Hover-autoplay previews** desktop. Mobile: tap-to-preview in card before opening sheet.
3. **Featured row at the top.** Curated 2–3, fresh weekly. Establishes that templates are alive, not a static catalogue.
4. **Use-this-template prefill.** Same `clevroy:home:prefill` mechanism the onboarding uses. Templates land users with a script already typed.
5. **Save-to-library is one-tap.** No confirmation, no modal — a heart icon flips state, toast confirms.

---

## What this work ships

- A `/templates` route with a featured row, category filter strip, search, and a poster-art grid.
- A `<TemplateDetailSheet>` side panel that opens on card click — sample clip, full script preview, "Use" + "Save" CTAs.
- A new `<TemplateCard>` component reused by both `/templates` and (later) `/library`'s "Saved templates" tab.
- 12–18 fixture templates spanning 6+ categories, with placeholder posters and sample clips.
- New nav entry "Templates" in the sidebar + bottom tab bar.
- "Use this template" pipes into the existing `clevroy:home:prefill` sessionStorage handoff.

## Decisions locked

1. **Layout**: 3-col grid desktop (≥md), 4-col xl, 1-col mobile. Featured row above grid renders 2–3 templates at 1.5× scale.
2. **Card shape is poster-first** (2:3 aspect, full-width-of-card poster). Title + meta below the poster, not overlaid.
3. **Detail open is a Sheet** (right-side, 520px desktop, full-width mobile). Not a separate route.
4. **"Use this template"** pipes through `clevroy:home:prefill` — same handoff used by onboarding step 5.
5. **"Save to Library"** writes to a new Zustand store `library-store.ts` — but the `/library` page itself is built by the parallel session. This prompt creates the store with the saved-templates slice; the `/library` prompt extends it.
6. **Hover-autoplay previews** on desktop using `<video autoPlay muted playsInline>` swapped on hover. Mobile: poster only, click reveals preview in detail sheet.
7. **Categories**: `drama`, `comedy`, `documentary`, `horror`, `romance`, `trailer`, `short`, `music`. Eight chips plus an "All."
8. **Fixture URLs**: `picsum.photos` for posters, `https://www.w3schools.com/html/mov_bbb.mp4` for sample clips (consistent with phase-walker fixtures). Layer 5 swaps for real CDN URLs.

## File-by-file work order

### 1. Fixture data

Create `src/lib/templates/data.ts`:

```ts
export type TemplateCategory =
  | "drama" | "comedy" | "documentary" | "horror"
  | "romance" | "trailer" | "short" | "music";

export interface Template {
  id: string;
  title: string;
  description: string;       // 2-3 sentences, brand voice
  category: TemplateCategory;
  duration_seconds: number;  // approximate output length
  style: StylePreset;        // from create-options-store
  aspect: Aspect;            // from create-options-store
  script: string;            // the prompt that fills the chat input
  poster_url: string;
  preview_url: string;       // 5-10s sample clip
  featured?: boolean;        // shows in the featured row
  created_at: string;
}

export const TEMPLATES: ReadonlyArray<Template> = [/* 12-18 entries */];
```

Hand-write 12–18 templates spanning all 8 categories. Each script ~30–80 words. Each description in brand voice (no banned words). Mark 2–3 as `featured: true`.

Templates should feel like real curated picks, not lorem ipsum. Examples:
- "Letters from a lighthouse keeper" (drama, noir style, 90s)
- "My grandmother's recipe" (documentary, cinematic, 60s)
- "The 4 a.m. coffee" (romance, cinematic, 45s)
- "Trailer for a film that doesn't exist" (trailer, cinematic, 30s)
- etc.

### 2. Library store (templates slice only)

Create `src/stores/library-store.ts` with the saved-templates slice:

```ts
type LibraryStore = {
  savedTemplateIds: string[];
  saveTemplate: (id: string) => void;
  unsaveTemplate: (id: string) => void;
  isSaved: (id: string) => boolean;
};
```

Persist to localStorage via `zustand/middleware persist`, key `clevroy:library:v1`. Cap at 50 saved templates (drop oldest on overflow).

The `/library` parallel prompt will extend this store with characters/styles/references/drafts slices. Use a single store object (not separate stores) so the persist middleware writes one key. Either:
- Define the type with optional fields the library prompt fills in, or
- Leave the type extensible (`type LibraryStore = TemplatesSlice & Partial<...>;`).

Document the contract in a top-of-file comment so the library prompt knows what's safe to add.

### 3. Page route

Create `app/(app)/templates/page.tsx`:

```tsx
"use client";

export default function TemplatesPage() {
  return (
    <PagePanel
      title={templates.pageTitle}
      subline={templates.subline}
    >
      <FeaturedRow />
      <CategoryFilterStrip />
      <TemplatesGrid />
      <TemplateDetailSheet />  // controlled state
    </PagePanel>
  );
}
```

### 4. Components

Create under `src/components/templates/`:

#### 4a. `<TemplateCard>`

- 2:3 poster (use shadcn `<AspectRatio>` if available, else manual padding-bottom).
- Hover desktop: poster swaps to autoplay-muted preview clip.
- Below poster: Fraunces title (1 line, truncate), mono caption with category + duration.
- "Use" CTA pill bottom-right of card.
- Save heart icon top-right, 44×44 touch target. Filled when saved.
- Click anywhere on card body → opens detail sheet.
- Click Save → toggles save state, fires Sonner toast.
- Reduced-motion: skip the autoplay-on-hover; keep poster static.

Variants: pass a `size` prop (`"md"` default, `"lg"` for featured row).

#### 4b. `<FeaturedRow>`

Renders 2–3 cards from `TEMPLATES.filter(t => t.featured)` at `size="lg"`. Eyebrow "Editor's picks" mono small caps above. Hide if no featured.

#### 4c. `<CategoryFilterStrip>`

Sticky-top under page header. shadcn `<ToggleGroup>` of category chips. Each chip shows a count ("Drama · 4") computed from filtered set. "All" chip default-selected.

Mobile: horizontal scroll with snap. Search input renders here on mobile (above strip); on desktop, search input renders in the page header right side.

State: local URL search params (`?cat=drama&q=lighthouse`). Use `useSearchParams` and `useRouter` to update.

#### 4d. `<TemplatesGrid>`

Renders the filtered template list. 3-col desktop, 4-col xl, 1-col mobile. `<TemplateCard>` per item.

Empty states:
- No search results: "No templates match." + "Clear search" link.
- No category match: "No templates in this category yet." (rare given fixtures).

#### 4e. `<TemplateDetailSheet>`

Right-side `<Sheet>`, 520px desktop / full-width mobile.

Sections:
1. **Hero**: 16:9 sample clip with autoplay-muted + unmute toggle (44×44). Reuse the unmute primitive from `<ScenePlaybackCard>` (extract if helpful, but don't refactor that file).
2. **Title + meta**: Fraunces title, mono caption "Drama · 90 seconds · Cinematic · 16:9."
3. **Description**: 2–3 sentences in body type.
4. **Script preview**: monospace script in a `<pre>` block with `max-h-[40vh] overflow-y-auto`. "Show full script" expansion if truncated above 200 lines.
5. **What's included**: bullet list. Style preset, default aspect, suggested approach.
6. **Actions** sticky at the bottom:
   - Primary CTA: "Use this template." Click → write template's `script` to `clevroy:home:prefill` sessionStorage AND write template's `style` and `aspect` to `create-options-store` AND `router.push('/home')`.
   - Secondary: "Save to Library." Toggles save state; toast confirms.
   - Tertiary: Close.

State: opening the sheet stores the open-template-id in local state on the page. Closing clears it.

### 5. Nav additions

Add a Templates entry to `navLinks` in `src/lib/copy.ts`. Insertion section:

```ts
// --- Templates additions (parallel-safe) ---
templates: { label: "Templates", href: "/templates" },
// --- End Templates additions ---
```

In `src/components/nav/Sidebar.tsx` `NAV_ITEMS`, add `{ key: "templates", ...navLinks.templates, icon: LibraryBig }` between Projects and Create. (`LibraryBig` from `lucide-react` — read like "shelf of templates.")

In `src/components/nav/BottomTabBar.tsx` `TAB_ORDER`, add the same entry. Note: bottom tab bar maxes at 5 slots; if both this prompt and the library prompt run, the user will need to demote one item. Add a comment flagging this:

```ts
// TODO(nav): bottom tab bar at 6 slots; user may need to demote AI Twin
// or Settings to a profile menu.
```

### 6. Copy registry

Add to `src/lib/copy.ts`:

```ts
export const templates = {
  pageTitle: "Templates",
  subline: "Start from something we've shot.",
  featured: { eyebrow: "Editor's picks" },
  filter: {
    all: "All",
    drama: "Drama",
    comedy: "Comedy",
    documentary: "Documentary",
    horror: "Horror",
    romance: "Romance",
    trailer: "Trailer",
    short: "Short",
    music: "Music video",
  },
  searchPlaceholder: "Search templates",
  card: {
    useCta: "Use",
    saveAria: "Save to Library",
    unsaveAria: "Remove from Library",
  },
  detail: {
    sectionDescription: "About this template",
    sectionScript: "Script",
    sectionIncluded: "What's included",
    showFullScript: "Show full script",
    useCta: "Use this template",
    saveCta: "Save to Library",
    saveAgainCta: "Saved",
    close: "Close",
  },
  emptyResults: "No templates match.",
  emptyCategory: "No templates in this category yet.",
  clearSearch: "Clear search",
  savedToast: "Saved to Library.",
  unsavedToast: "Removed from Library.",
} as const;
```

### 7. `/home` prefill enhancement

Modify `src/components/chat/ChatSurface.tsx` `EmptyView` (or wherever the prefill-on-mount logic lives — onboarding may have already added it):

- Existing prefill mechanism reads `clevroy:home:prefill` and sets the textarea.
- **Extend**: also read `clevroy:home:prefill-style` and `clevroy:home:prefill-aspect` if present, and apply via `useSetStyle` and `useSetAspect`.
- Templates write all three keys when "Use this template" is clicked.
- Keys are read-and-clear: consume on first mount.

### 8. Page metadata

Set the page metadata in `app/(app)/templates/page.tsx`:
```tsx
export const metadata = { title: "Templates · Clevroy" };
```

## Don't do (out of scope)

- Real backend templates fetch — Layer 5 swaps fixtures.
- Community-submitted templates — post-v1.
- The `/library` page or any of its tabs other than the saved-templates store slice — separate prompt.
- Editing or deleting templates (read-only catalogue for v1).
- Pricing / tier-locking templates.
- Sharing / share-link generation.
- Anything outside `app/(app)/templates/`, `src/components/templates/`, `src/lib/templates/`, `src/stores/library-store.ts`, `src/lib/copy.ts` (templates section), `src/components/nav/Sidebar.tsx` (templates entry), `src/components/nav/BottomTabBar.tsx` (templates entry), and the `/home` prefill extension in `ChatSurface.tsx`.

## Constraints reminder

- shadcn-first / AI Elements-first.
- 12px panel radius for sections, 16px for soft surfaces.
- Color tokens only.
- 44×44 touch targets. Respect `prefers-reduced-motion`.
- "films" surface language; banned: Oops, Something went wrong, Generate, Magical, Seamless, Simply, AI-powered, emoji.
- Inter / Fraunces / JetBrains Mono.
- Work directly on `main`. Read-only git only — don't commit.
- TypeScript strict mode passes (`npx tsc --noEmit`).

## Verification (user runs in browser)

1. **`/templates` route renders** with page header, featured row, filter chips, grid.
2. **Filter** — click "Drama" chip; grid filters; URL becomes `/templates?cat=drama`.
3. **Search** — type "lighthouse"; grid filters live (no debounce needed for fixture); URL becomes `?q=lighthouse`.
4. **Card hover desktop** — poster swaps to autoplay preview.
5. **Card hover with reduced motion** — poster stays static.
6. **Click card** — detail sheet slides in from right.
7. **Detail sheet sections** — hero clip plays, title + meta render, script preview scrolls, "What's included" bullets visible.
8. **Use this template** — click; URL flips to `/home`; chat input has the template's script pre-typed; aspect + style set to template's defaults; pressing Roll mints a film with this script.
9. **Save toggle** — click heart on a card; toast "Saved to Library." Click again; toast "Removed from Library." LocalStorage `clevroy:library:v1` updates.
10. **Saved persists** — refresh; saved hearts still filled.
11. **Mobile** — grid is 1-col, filter chips horizontal-scroll, search above filters, detail sheet full-width.
12. **Keyboard** — Tab through cards, Enter opens detail, Esc closes sheet.
13. **Sidebar nav** — Templates item visible between Projects and Create; clicking lands on `/templates`.
14. **Bottom tab bar** — Templates appears (with TODO comment about overflow).
15. `npx tsc --noEmit` passes.

Ship this. Templates becomes the discovery front door for new users.
