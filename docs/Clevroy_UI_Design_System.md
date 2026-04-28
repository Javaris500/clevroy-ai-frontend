# Clevroy UI Design System

**Document purpose:** The canonical design spec for Clevroy's product UI. Inherits all color, typography, and copy decisions from `Clevroy_Brand_Guide.md` and turns them into concrete layout rules, component patterns, page blueprints, and phasing calls for the build.

**Audience:** Frontend engineers implementing the app, designers iterating on screens, and QA writing test plans against the intended behavior.

**Status:** V1 — locked for MVP. The centralized generation screen (section 8) is the product's defining surface and the highest-fidelity spec in this doc.

**Inheritance:** This doc does not redefine brand tokens. Color hex values, font choices, and copy voice live in `Clevroy_Brand_Guide.md`. If a value appears in both places and they disagree, the Brand Guide wins and this doc gets updated.

---

## 1. Design Principles

The system is built on five principles. They are the tiebreakers for every design decision below.

**1. The generation is the product.** The centralized generation screen is not a loading state — it is the main event. Every other surface exists to feed into or reflect back from that screen. Sidebar, settings, projects list, regen flow — they all support the act of watching a film come together live.

**2. Dark surround, bright subject.** The app interior defaults to dark mode because video and image content look better against a dark page. Light mode exists, works everywhere, and is the default for landing, the book export, and documentation — but users spend most of their time in dark.

**3. Rounded shell, flat panels.** Clevroy's signature layout is an outer near-black frame with floating rounded-corner panels inside it. The shell feels like a screening-room frame; the panels feel like windows cut into it. No drop shadows, no gradients, no frosted glass — radius and negative space do the work.

**4. Calm motion, no confetti.** Motion is used to clarify state change (a new scene appearing, a panel expanding, the phase narrative advancing), never to celebrate or decorate. Reduced-motion users get instant state changes with cross-fades; everyone else gets 200–300ms cubic-bezier transitions. No bouncing, no spring physics on UI chrome.

**5. Mobile is first-class, not a shrink.** The mobile app is not a scaled-down website. It has its own bottom tab bar, its own Create button in the center slot, its own safe-area handling for notched phones, and its own generation screen layout that reshuffles the center-stage for portrait orientation. Capacitor v7 wraps the Next.js app, so the same components render on both — but mobile-specific layout logic is explicit, not inherited by accident.

---

## 2. Token System (Tailwind v4 `@theme`)

Tokens map 1:1 to the values locked in the Brand Guide. The list below is what gets pasted into `app/globals.css` inside a `@theme` block so Tailwind v4 exposes them as utility classes (`bg-primary`, `text-foreground`, `border-border`, etc.).

### 2.1 Color tokens

Both themes are declared in `:root` for light and `.dark` for dark, with the dark variant applied as a class on `<html>` controlled by the user's mode preference and persisted in Zustand.

```css
@theme {
  /* Dark mode (default for app interior) */
  --color-background:              #0D0D0D;
  --color-foreground:              #F5EFE6;
  --color-card:                    #161616;
  --color-card-foreground:         #F5EFE6;
  --color-popover:                 #1F1F1F;
  --color-popover-foreground:      #F5EFE6;
  --color-primary:                 #C1272D;
  --color-primary-foreground:      #F5EFE6;
  --color-secondary:               #1F1F1F;
  --color-secondary-foreground:    #F5EFE6;
  --color-muted:                   #161616;
  --color-muted-foreground:        #9A9A9A;
  --color-accent:                  #1F1F1F;
  --color-accent-foreground:       #F5EFE6;
  --color-destructive:             #C1272D;
  --color-destructive-foreground:  #F5EFE6;
  --color-border:                  #262626;
  --color-input:                   #262626;
  --color-ring:                    #C1272D;

  /* Clevroy-specific extensions */
  --color-shell:                   #050505;
  --color-panel-elev:              #1F1F1F;
  --color-primary-hover:           #8F1D22;
  --color-primary-soft:            rgba(193, 39, 45, 0.15);
  --color-success:                 #2F7D5C;
  --color-warning:                 #C88A2C;
}

:root.light {
  --color-background:              #F5EFE6;
  --color-foreground:              #1A1A1A;
  --color-card:                    #FBF7F0;
  --color-card-foreground:         #1A1A1A;
  --color-popover:                 #FFFFFF;
  --color-popover-foreground:      #1A1A1A;
  --color-primary:                 #C1272D;
  --color-primary-foreground:      #F5EFE6;
  --color-secondary:               #EAE2D4;
  --color-secondary-foreground:    #1A1A1A;
  --color-muted:                   #EAE2D4;
  --color-muted-foreground:        #6A6359;
  --color-accent:                  #EAE2D4;
  --color-accent-foreground:       #1A1A1A;
  --color-destructive:             #C1272D;
  --color-destructive-foreground:  #F5EFE6;
  --color-border:                  #D9D2C4;
  --color-input:                   #D9D2C4;
  --color-ring:                    #C1272D;

  --color-shell:                   #EAE2D4;
  --color-panel-elev:              #FFFFFF;
  --color-primary-hover:           #8F1D22;
  --color-primary-soft:            rgba(193, 39, 45, 0.10);
}
```

### 2.2 Radius tokens

Rounded corners are a signature of the system. The rounded shell pattern (section 4) uses specific radii that should not be deviated from.

```css
@theme {
  --radius-sm:   6px;    /* inputs, small badges */
  --radius-md:   10px;   /* buttons, inline chips */
  --radius-lg:   12px;   /* panels, cards — the signature value */
  --radius-xl:   16px;   /* the outer shell frame */
  --radius-2xl:  24px;   /* hero cards on landing, book export cover */
  --radius-full: 9999px; /* avatars, the center Create button, pill badges */
}
```

The **12px (lg)** value is the Clevroy signature radius for every floating panel in the rounded shell layout. Do not use 8px or 16px for panels without explicit design review.

### 2.3 Spacing tokens

Tailwind v4's default 4px-based spacing scale is kept. Custom spacing is added only for the shell frame gap and the safe-area insets:

```css
@theme {
  --spacing-shell-gap:  12px;   /* gap between shell frame edge and inner panels */
  --spacing-safe-top:   env(safe-area-inset-top, 0px);
  --spacing-safe-bottom:env(safe-area-inset-bottom, 0px);
  --spacing-safe-left:  env(safe-area-inset-left, 0px);
  --spacing-safe-right: env(safe-area-inset-right, 0px);
}
```

### 2.4 Shadow tokens

The system does not use drop shadows for elevation in dark mode — depth is expressed through hairline borders and color shifts (`--color-card` vs `--color-popover`). Light mode uses shadows sparingly.

```css
@theme {
  /* Light-mode only — never applied in dark mode */
  --shadow-panel:  0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04);
  --shadow-popover:0 4px 12px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06);
}
```

In dark mode, substitute shadows with a 1px `border border-border` on panels and a 1px `border-panel-elev` on popovers.

### 2.5 Motion tokens

```css
@theme {
  --duration-fast:    150ms;  /* hover, focus */
  --duration-base:    200ms;  /* button press, small transitions */
  --duration-slow:    300ms;  /* panel expand/collapse, page transitions */
  --duration-phase:   450ms;  /* phase narrative text crossfade on generation screen */

  --ease-out:         cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:      cubic-bezier(0.65, 0, 0.35, 1);
}
```

When `prefers-reduced-motion: reduce` is set, all durations collapse to 0ms except `--duration-phase` which stays at 150ms as a simple crossfade — the phase narration shouldn't pop instantly, it should still feel like it changed on purpose.

---

## 3. Typography Scale

All UI text is Inter (weights 400/500/600/700). Editorial serif is Fraunces, used only for hero display text on landing, the book export chapter titles, and the phase narrative copy on the generation screen. Mono is JetBrains Mono for IDs, error codes, developer settings.

| Role | Token class | Size / Line / Weight | Family | Used for |
|---|---|---|---|---|
| Display XL | `text-display-xl` | 72 / 80 / 600 | Fraunces | Landing hero (desktop only) |
| Display L | `text-display-lg` | 56 / 64 / 600 | Fraunces | Landing hero (tablet) |
| Display M | `text-display-md` | 48 / 56 / 600 | Fraunces | Landing section titles, book chapter titles |
| H1 | `text-h1` | 32 / 40 / 600 | Inter | Page titles ("Your Films," "Create") |
| H2 | `text-h2` | 24 / 32 / 600 | Inter | Section titles inside a page |
| H3 | `text-h3` | 20 / 28 / 600 | Inter | Card titles, modal titles |
| Body L | `text-body-lg` | 18 / 28 / 400 | Inter | Landing body, marketing |
| Body | `text-body` | 16 / 24 / 400 | Inter | Default product body |
| Body M | `text-body-md` | 15 / 22 / 400 | Inter | Dense UI (sidebar items, form helpers) |
| Small | `text-small` | 14 / 20 / 400 | Inter | Metadata, secondary info |
| Caption | `text-caption` | 12 / 16 / 500 | Inter | Uppercase tracked labels (+50 tracking) |
| Mono | `text-mono` | 13 / 20 / 400 | JetBrains Mono | IDs, errors, debug strings |
| Phase narration | `text-phase` | 28 / 36 / 500 | Fraunces italic | Center-stage phase copy only |

Line-height is expressed as a px value so it's unambiguous at each size. Weight overrides are available via Tailwind's `font-*` utilities — but if a design proposes bold body text, the correct move is usually to use `text-h3` instead.

**Letterspacing defaults:**

- Display and H1: `tracking-tight` (-0.01em)
- H2/H3: `tracking-normal` (0)
- Body: `tracking-normal` (0)
- Caption (labels): `tracking-wider uppercase` (+0.08em)

---

## 4. Layout: The Rounded Shell Pattern

The rounded shell is Clevroy's core layout container. It appears on every authenticated surface.

### 4.1 Anatomy

```
┌──────────────────────────────────────────────────────┐
│  (shell frame — #050505 dark / #EAE2D4 light)        │
│   ┌─ sidebar ──┐  ┌─ main content panel ──────────┐  │
│   │            │  │                                │  │
│   │  #161616   │  │   #161616 (dark)               │  │
│   │  rounded   │  │   #FBF7F0 (light)              │  │
│   │  12px      │  │   rounded 12px                 │  │
│   │            │  │                                │  │
│   │            │  │                                │  │
│   └────────────┘  └────────────────────────────────┘  │
│   ← 12px gap →    ← 12px gap between panels          │
└──────────────────────────────────────────────────────┘
  ↑ 12px shell-gap inset on all sides
```

- Shell frame fills the viewport using `--color-shell`. This is the darkest surface in dark mode, one step deeper than the page background, which creates the "frame around a screen" feel.
- 12px `--spacing-shell-gap` inset on all four sides, plus 12px between sidebar and main panel.
- Sidebar and main panel each have `--radius-lg` (12px) corners on all four corners — they float inside the shell.
- On desktop (≥1024px) the sidebar is pinned. On tablet (768–1023px) the sidebar collapses to an icon rail. On mobile (≤767px) the sidebar is replaced by the bottom tab bar and the shell gap drops to 0 so the main panel goes edge-to-edge.

### 4.2 Why 12px for the panel radius

Large enough to read as "rounded" at a glance; small enough to feel architectural rather than soft. 8px reads as a modern form control, not a panel. 16px starts to feel playful. 12px hits the screening-room-monitor feel the brand direction calls for.

### 4.3 When the shell changes

- **Landing / marketing pages:** No shell. Full-bleed dark or light canvas, because marketing is not the app.
- **Auth screens (sign in / sign up):** No shell. Centered card with `--radius-2xl` on a plain `--color-background`.
- **Onboarding modal:** Shell is visible behind a fullscreen overlay with a darkened scrim.
- **Mobile:** Shell collapses to zero shell-gap. The bottom tab bar floats above the main panel with 8px gap from the panel bottom edge and 8px from the viewport bottom (respecting safe-area-inset-bottom).

---

## 5. Sidebar Architecture

The sidebar has **5 primary links**, in this exact order:

1. **Home** — dashboard with recent films and a prompt to start a new one
2. **Projects** — grid of all films the user has created
3. **Create** — the entry point for starting a new film
4. **AI Twin** — the user's personalized voice/likeness management
5. **Settings** — account, billing, preferences, developer tools

Below the five links, pinned to the bottom of the sidebar:

- **Films balance badge** — shows "3 films left" (uses the locked "films" surface language)
- **Profile chip** — avatar + display name, opens a popover menu with Sign out, Switch theme, Help
- **Clevroy wordmark** — small, muted, clickable returns to Home (acts as the brand return-to-root)

### 5.1 States

- **Expanded** (desktop default): 240px wide. Each item shows icon + label. Active item has a `--color-primary-soft` background fill and `--color-primary` text.
- **Collapsed** (tablet default or user-toggled): 64px wide. Icons only. Labels appear as tooltips on hover. Active item has the same red-soft fill.
- **Hidden** (mobile): Sidebar is replaced entirely by the bottom tab bar (section 6).

### 5.2 Icons

Use `lucide-react` icons, 20px size, 1.5px stroke:

- Home: `Home`
- Projects: `FolderOpen`
- Create: `Clapperboard`
- AI Twin: `UserSquare`
- Settings: `Settings`

### 5.3 Hover / focus

Every sidebar item gets `hover:bg-accent` (subtle surface lift) and a 2px `--color-ring` focus outline offset 2px. Keyboard navigation is arrow-key traversable — Up/Down moves focus, Enter activates.

---

## 6. Mobile Bottom Tab Bar

The mobile navigation is a 5-slot tab bar pinned to the bottom, with Create as the center emphasized slot.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                 (main content area)                 │
│                                                     │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [Home]  [Projects]  ( + )  [AI Twin]  [Settings] │
│                        ↑                            │
│                    red circle                       │
│                    64px, raised 12px                │
└─────────────────────────────────────────────────────┘
```

### 6.1 Tab bar spec

- Height: 72px + `safe-area-inset-bottom`
- Background: `--color-card` with a 1px top border in `--color-border`
- Four side slots: icon (20px) + label (11px, tracking-wider uppercase) stacked vertically
- Center Create slot: 64px × 64px circular button in `--color-primary`, raised 12px above the bar baseline so it breaks the top edge, plus icon 28px in `--color-primary-foreground`
- Active side slot: icon and label switch to `--color-primary`; no background fill (the center button is already red, so filling a side tab would compete)

### 6.2 Center Create button behavior

- Tapping opens the Create flow directly (not a menu, not a modal — straight to the Create page)
- Holds visual primacy because the whole product is about starting a film; the center slot elevation signals that
- Haptic feedback (light impact) on tap when running in Capacitor

### 6.3 When the tab bar is hidden

- During the centralized generation screen (section 8), the tab bar is replaced by the scene strip for the duration of generation
- In fullscreen video playback
- In the book export preview

---

## 7. Page-by-Page Breakdown

Each page lists its purpose, layout, primary components, empty states, and any page-specific edge cases. Cross-cutting edge cases are in `Clevroy_UX_Edge_Cases.md`.

### 7.1 Landing page (unauthenticated)

**Purpose:** Convert visitors. Communicate the centralized-generation differentiator in under 8 seconds.

**Layout:** Full-bleed dark canvas. No shell. Top nav is the horizontal logo lockup on the left + a single "Sign in" link + a "Start your film" primary button on the right.

**Above the fold:**
- Hero headline in `text-display-xl` (Fraunces): **"Your script. On screen. Now."** (the locked spine slogan)
- Sub-headline in `text-body-lg`: One of the hero taglines from the Brand Guide (default: "Watch your story shoot itself.")
- Primary CTA: "Start your film"
- Background: The centralized generation screen rendered live on loop — muted, dimmed to 60% opacity, shown at scale so the viewer sees scenes appearing one by one on a center-stage screen. This is the ad for the product.

**Below the fold:**
- "How it works" — 3 steps: Write → Watch → Take it home
- "The center-stage difference" — a side-by-side mock showing competitor queue UI vs Clevroy's live center-stage screen
- Sample film showcase — 3–4 embedded sample films users can play
- Footer: minimal, wordmark + legal links

### 7.2 Home (authenticated)

**Purpose:** Help the user pick back up. Push them toward Create if they have credits, toward upgrade if they don't.

**Layout:** Rounded shell + sidebar + main panel.

**Main panel content:**
- Page title: `H1` "Welcome back, [first name]"
- Sub-line: "You have **3 films left.**" with "Buy more films" link
- Primary CTA card at top: "Start a new film" — full-width card, `--color-primary` background, `H2` text, clapperboard icon
- Recent films: horizontal scrollable row of film cards (cover image + title + created date). Click opens that film's Results screen. Max 8 cards shown, with "View all" linking to Projects.

**Empty state** (no films yet):
- Card showing: "No films yet. Paste a script and we'll start shooting." + "Start your first film" button
- Small text below: "You have 5 free films to start. No credit card needed."

### 7.3 Projects

**Purpose:** Browse, search, and manage all films.

**Layout:** Rounded shell + sidebar + main panel.

**Main panel content:**
- Page title: `H1` "Your Films"
- Toolbar: search input (left) + sort dropdown (right) + "New film" button (far right)
- Grid: 4 columns on desktop, 3 on tablet, 2 on mobile, 1 on narrow mobile. Each card shows cover image, title, scene count, created date, and a three-dot overflow menu (Rename, Duplicate, Delete)
- Pagination: infinite scroll with TanStack Query cursor-based pagination

**Delete confirmation:**
- Modal: "Delete this film? It can't be recovered." with [Keep it] [Delete it] — matches the do/don't from Brand Guide §7.5

**Empty state:** Same copy and CTA as Home empty state.

### 7.4 Create

**Purpose:** The script-in, film-out entry point. This page has two phases: **input** and **generation**. The generation phase is the centralized generation screen (section 8) — it's the same route (`/create`) but the UI swaps when generation starts.

**Input phase layout:**
- Page title: `H1` "Start your film"
- Script textarea (full width on desktop, `--color-card` background, 12px radius, min-height 400px). Placeholder: "Paste a script or tell us your story. A paragraph, a page, or a full screenplay — we'll read it and figure out the scenes."
- Style options below the textarea: a row of preset cards (Cinematic, Animated, Documentary, Noir, etc.) — single-select, picking one tints the card with `--color-primary-soft` and bolds the label
- Credits reminder: below the style row, small text "This will use 1 film from your balance. You have 3 films left."
- Primary CTA at the bottom: "Start your film" (disabled until there's at least 50 characters of script)

**Generation phase layout:** See section 8 (the centralized generation screen). This replaces the input phase in-place when the user hits Start.

### 7.5 Results

**Purpose:** Let the user review, regenerate, and export the finished film.

**Layout:** Rounded shell + sidebar + main panel, but the main panel has a distinct three-zone structure.

**Zone 1 — Hero player (top):**
- Full-width video player with the final assembled film
- Below the player: film title (editable on click), scene count, duration, "Created [date]"
- Right side of that row: export actions — "Take it home" (opens export menu with MP4 / Book PDF / Website ZIP)

**Zone 2 — Scene strip (middle):**
- Horizontal row of scene thumbnails, each with scene number, duration, and a three-dot menu (Reshoot this scene, View characters, Export scene)
- Click a thumbnail scrubs the hero player to that scene
- Reshoot opens a confirmation: "Reshoot this scene? It will use 0.2 films from your balance." with [Cancel] [Reshoot]

**Zone 3 — Details panel (bottom):**
- Tabbed: "Script" | "Characters" | "Voice & Music" | "Metadata"
- Script tab shows the parsed script with scene breaks highlighted
- Characters tab shows the character reference portraits (Pass 1 outputs) in a grid
- Voice & Music shows the voices assigned and the soundtrack selection
- Metadata shows generation timestamps, provider call log (collapsed by default), credit cost breakdown

### 7.6 AI Twin

**Purpose:** Let the user create and manage a personalized voice clone and/or face reference that can be used in their films.

**Layout:** Rounded shell + sidebar + main panel.

**Main panel content:**
- Page title: `H1` "AI Twin"
- Sub-line: "Train a voice and a face that Clevroy can use in your films."
- Two big cards side-by-side (stacked on mobile):
  - **Voice twin card:** status (Not trained / Training / Ready), "Record new samples" button, sample playback if trained, delete option
  - **Face twin card:** status, upload zone (drag-drop 5–10 reference photos), preview of the generated reference portrait if trained, delete option
- Below both cards: "How your twin is used" explainer — short text clarifying that the twin is only applied when the user explicitly selects "Use my voice" or "Use my likeness" on a new film

### 7.7 Settings

**Purpose:** Account management, billing, preferences, developer tools.

**Layout:** Rounded shell + sidebar + main panel. Main panel has a secondary left-rail with subsection navigation.

**Subsections:**
- **Account:** name, email, password change, delete account
- **Billing:** film balance, purchase history, buy more films, subscription (if on a plan)
- **Preferences:** theme toggle (Light / Dark / System), reduced-motion toggle (auto-detects but can be forced), language (English only for MVP)
- **Notifications:** email preferences for generation-complete, marketing opt-in
- **Developer:** API access if applicable (MVP: hidden behind a feature flag), recent generation logs with raw provider response IDs, export data (JSON download of all films metadata)
- **About:** version, credits page, terms, privacy, help link

**Delete account flow:**
- Confirm by typing "delete" into an input field
- Warning: "This deletes all your films permanently. Films can't be recovered."
- Actual deletion is a 30-day soft delete; the user is notified of the hold period in the confirmation

---

## 8. The Centralized Generation Screen

This is the product's defining surface. Every design decision elsewhere serves to get the user here and back out. The brief: **the user watches their film come together live, on a center-stage screen, with narration from Clevroy about what's happening.** No progress bar. No queue card. No "you'll get an email when it's done."

### 8.1 Layout (desktop, ≥1024px)

```
┌─ shell frame ──────────────────────────────────────────────────┐
│ ┌─ sidebar ──┐  ┌─ main generation panel ─────────────────────┐│
│ │            │  │                                              ││
│ │   (same    │  │   ┌─ center stage ─────────────────────┐    ││
│ │   sidebar  │  │   │                                    │    ││
│ │   as rest  │  │   │   (video/image/waveform            │    ││
│ │   of app,  │  │   │    for current phase)              │    ││
│ │   but all  │  │   │                                    │    ││
│ │   items    │  │   │                                    │    ││
│ │   dimmed   │  │   │                                    │    ││
│ │   except   │  │   └────────────────────────────────────┘    ││
│ │   Create   │  │                                              ││
│ │   which is │  │   "Blocking the scenes…"       ← phase copy ││
│ │   active)  │  │    Working on scene 3 of 7     ← sub copy   ││
│ │            │  │                                              ││
│ │            │  │   ┌─ scene strip ─────────────────────┐     ││
│ │            │  │   │ [1✓] [2✓] [3●] [4 ] [5 ] [6 ] [7 ]│     ││
│ │            │  │   └───────────────────────────────────┘     ││
│ │            │  │                                              ││
│ │            │  │   ┌─ activity feed ───────────────────┐     ││
│ │            │  │   │ 14:32:04 Script parsed (7 scenes) │     ││
│ │            │  │   │ 14:32:09 Character refs rendered  │     ││
│ │            │  │   │ 14:32:41 Scene 1 image ready      │     ││
│ │            │  │   │ 14:32:55 Scene 2 image ready      │     ││
│ │            │  │   │ 14:33:12 ● Rendering scene 3…     │     ││
│ │            │  │   └───────────────────────────────────┘     ││
│ └────────────┘  └──────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Three zones in the main panel, top to bottom:**

**Center stage (60% of panel height):**
- Rounded 12px panel, `--color-panel-elev` background, 1px `--color-border` border
- Aspect ratio: 16:9 default, switches to match the film's configured aspect ratio as soon as the parse phase completes
- Content varies by phase (section 8.3)

**Phase narration block (immediately below center stage, 16% height):**
- Phase copy: `text-phase` (Fraunces italic 28px) in `--color-foreground`
- Sub copy: `text-body` in `--color-muted-foreground`
- Both centered horizontally. Crossfade 450ms when phase advances.

**Scene strip (8% height):**
- Horizontal row of scene pills, one per scene
- Pill states: `empty` (outline), `pending` (outline + pulsing border), `ready` (filled background with thumbnail), `active` (red border, the one currently being rendered)
- Clicking a ready pill previews that scene in the center stage without changing the generation flow
- Auto-scrolls horizontally to keep the active pill visible

**Activity feed (16% height, scrollable):**
- Timestamped log of backend events streamed over Supabase Realtime
- Text: `text-mono` 13px, timestamps in `--color-muted-foreground`, current event in `--color-foreground` with a red dot prefix
- Auto-scrolls to the latest entry; user can scroll up to read history without losing follow mode. If user scrolls up, a "Jump to latest" pill appears at the bottom.

### 8.2 Layout (mobile, ≤767px)

Mobile reshuffles vertically:

```
┌─────────────────────────────────┐
│ ← back    "Your film"           │  ← top bar, 56px
├─────────────────────────────────┤
│                                 │
│      ┌─ center stage ─┐         │  ← 40% of viewport
│      │                │         │
│      │                │         │
│      └────────────────┘         │
│                                 │
│   "Blocking the scenes…"        │  ← phase copy, 14% of viewport
│    Working on scene 3 of 7      │
│                                 │
│   [1✓][2✓][3●][4][5][6][7]      │  ← scene strip, 10%
│                                 │
│   14:33:12 ● Rendering scene 3… │  ← activity feed, 22%
│   14:32:55 Scene 2 image ready  │
│   14:32:41 Scene 1 image ready  │
│   ...                           │
│                                 │
├─────────────────────────────────┤
│                                 │
│  (bottom tab bar HIDDEN —       │  ← replaced by a single "Cancel"
│   replaced by Cancel button)    │     bar during generation
└─────────────────────────────────┘
```

- Bottom tab bar is hidden during generation. Replaced by a single 48px-tall bar with "Cancel generation" on the right and a subtle "Running in background" indicator on the left. The user can still leave the screen; generation continues via the worker.
- Back arrow in the top-left returns to the previous screen without canceling — an info chip briefly says "Your film is still being shot."

### 8.3 Phase narrative (the on-screen copy)

This is the scripted sequence of phase copy that displays in the narration block as generation proceeds. Each phase has a headline (Fraunces italic) and a subline (Inter regular, muted). Phase transitions happen on backend state changes, not on timers, so a phase can last anywhere from 2 seconds to 3 minutes depending on script complexity and provider latency.

| # | Backend state | Phase headline (Fraunces italic) | Subline (Inter) | Center stage shows |
|---|---|---|---|---|
| 1 | `parsing` | Reading your script… | Understanding your story, scene by scene. | Script text auto-scrolling with highlighted scene break markers appearing as parser output streams in |
| 2 | `cie_building` | Assembling the cast… | Figuring out who's in your film. | Placeholder character cards appearing, one per character detected, with "Generating portrait…" labels |
| 3 | `character_refs` | Casting portraits… | Generating reference portraits so faces stay consistent across scenes. | Character portrait cards populating with images as they finish (Pass 1 outputs) |
| 4 | `scene_images_pending` | Blocking the scenes… | Working on scene {n} of {total}. | The current scene's image, full-bleed in the center stage, with a soft ken-burns zoom while it renders |
| 5 | `voice_synthesis` | Finding voices… | Recording dialogue lines with {provider}. | Waveform visualization of the current voice line being synthesized, overlaid on the scene image |
| 6 | `music_composition` | Scoring the film… | Composing a soundtrack in the {style} style. | Full-width animated waveform with the music style label, scene images cycling behind it at 40% opacity |
| 7 | `scene_assembly` | Cutting scene {n}… | Putting picture, voice, and score together. | Scene video previewing in the center stage, played through once |
| 8 | `final_concat` | Final cut… | Stitching your film into one take. | The full timeline of scene thumbnails advancing left-to-right with a playhead |
| 9 | `complete` | Your film is ready. | Take a look. | First frame of the finished film, poster-style, with a "Play film" button overlaid |
| E | `error` | We missed a shot. | {specific scene or step} didn't render. You can reshoot it without losing progress. | The last successful scene frozen in the center stage with a red corner badge |

**Phase copy rules:**
- Always present-tense, always first-person from Clevroy ("Reading your script" not "Script is being read")
- Never say "generating," "processing," "loading," or "AI"
- Never include technical identifiers (provider names, model names, queue positions) in the main phase copy — those live in the activity feed if the user wants them
- Subline is where specific detail goes ("scene {n} of {total}", provider name, style choice)

### 8.4 Center stage content by phase

The center stage is not a video player in every phase. It's a content surface that changes per phase to give the user something specific to watch:

- **Parsing:** The script text itself, auto-scrolling line by line as Gemini's parser returns scenes. Scene break markers (`[Scene 3]`) appear inline as they're detected, highlighted in `--color-primary`. This tells the user "we're reading your words" better than any abstract loading animation.
- **CIE building + character refs:** A grid of character cards — placeholder → portrait. Each card has the character name in `H3`, their one-line description below in `text-small`, and the portrait image once Pass 1 is done. The grid animates in with a 100ms stagger per card.
- **Scene images:** The current scene's generated image shown full-bleed with a 6-second ken-burns zoom loop. When the next scene finishes, crossfade 300ms to that one. The scene number is shown in the bottom-left corner as `[03 / 07]` in caption style.
- **Voice synthesis:** The current scene image stays as background at 60% opacity. An animated waveform overlays it horizontally across the middle, with the dialogue line being spoken shown as a subtitle in the lower third. This gives the user a sense of "the voice is being laid over this image" — the actual assembly they'd see on a film set.
- **Music composition:** A wider animated waveform spans the full center stage. Behind it, all the scene images cycle through at 40% opacity on a 1.5-second per-image rotation, so the user sees their whole film scrolling past while the music is written.
- **Scene assembly:** The assembled scene plays in the center stage, muted, once. Then holds on the final frame until the next scene is ready.
- **Final concat:** Horizontal strip of scene thumbnails scrolling with a playhead moving across them. Signals "we're stitching all of these together."
- **Complete:** First frame as poster, red play button centered, subtitle "Your film is ready to watch."
- **Error:** Last successful scene holds as still frame. A red toast anchored to the bottom of the center stage explains what failed and offers "Reshoot this scene" as the primary action and "Continue without it" as secondary.

### 8.5 Scene strip spec

Each scene pill:
- 56px × 56px (desktop) or 44px × 44px (mobile — meets 44px touch target minimum)
- 10px corner radius (slightly tighter than panel radius so pills read as pills, not mini-panels)
- Gap between pills: 8px
- States:
  - **Empty:** `--color-muted` background, scene number in `text-caption` centered
  - **Pending:** `--color-muted` background with 2px `--color-primary` border pulsing at 1.2s cycle
  - **Ready:** Thumbnail image filling the pill, scene number overlaid in the bottom-right corner on a small dark scrim
  - **Active:** Thumbnail (or muted background if no image yet) with a 2px solid `--color-primary` border, plus a small red dot in the top-right corner
- Scroll: horizontal, momentum-scroll on mobile, shift+scroll on desktop. The active pill auto-centers in view when it changes.

### 8.6 Activity feed spec

- Auto-scrolls to latest entry as long as the user is at or near the bottom
- If the user scrolls up more than ~40px from the bottom, auto-scroll disengages and a "Jump to latest" pill appears anchored to the bottom-right of the feed. Tapping it re-engages auto-scroll and scrolls to the latest entry.
- Entries added via Supabase Realtime channel subscription
- Timestamp format: `HH:MM:SS` in local time
- Entry format: `{timestamp} {icon} {message}` — icon is `●` (active), `✓` (complete), `!` (warning), `✕` (error)
- Error entries have `--color-destructive` text and do not auto-dismiss

### 8.7 Backgrounding and reconnection

The generation screen must survive: tab switches, app backgrounding (mobile), laptop sleep, network drops. All of these are handled as real scenarios in `Clevroy_UX_Edge_Cases.md` — this section states the UI behavior the tests expect.

- **Tab unfocused / app backgrounded:** Realtime channel stays open. When the user returns, the UI catches up to the current state (not the state at the time of leaving). No "welcome back" prompt — just the current phase, as if they'd been watching the whole time.
- **Network drop:** A subtle connection-lost banner appears at the top of the panel: "Lost connection. Reconnecting…" in `--color-warning` text. Generation continues on the backend. When the socket reconnects, the UI requests the latest state via REST and catches up. The banner fades after 2 seconds post-reconnect.
- **Device switch:** If the user opens the app on another device mid-generation, that device's generation screen shows the current state (not stale progress). Switching devices is a first-class path.
- **Generation completes while unfocused:** No browser notification (we don't ask for notification permission in MVP). If the user returns after completion, the UI is already on the `complete` phase with the play button ready. If the user navigates away entirely, Home shows the finished film in the "Recent films" row with a small "New" badge until clicked.

### 8.8 Cancel generation

- Cancel is available throughout all phases as a secondary action (text link bottom-right of the panel, or the mobile bottom bar "Cancel generation" button)
- Confirmation modal: "Stop this generation? You'll get back any unused films." with [Keep going] [Stop]
- On confirm: backend cancels the running Celery chain, any credits not yet consumed are refunded, the user returns to the Create input phase with their script preserved

---

## 9. Component Phasing (shadcn/ui)

Not every shadcn component belongs in the MVP. This list splits components into three phases so the build stays focused.

### 9.1 Essential (install for MVP)

These are required for the page-by-page spec above to work:

- `button` — all CTAs, primary/secondary/ghost/destructive variants
- `input` — script textarea, forms, settings fields
- `textarea` — the script input on Create
- `card` — film cards on Projects, character cards on the generation screen
- `dialog` — confirmation modals (Delete, Cancel generation, Reshoot)
- `dropdown-menu` — three-dot overflow menus on film cards, profile chip menu
- `tooltip` — collapsed sidebar icon labels, icon-only buttons
- `toast` (via `sonner`) — connection-lost, reshoot-complete, error notifications
- `tabs` — the Results page detail panel (Script / Characters / Voice & Music / Metadata)
- `avatar` — user profile chip, character cards, voice twin card
- `badge` — "New" film tag, "Ready" / "Pending" scene states in listings, "films left" counter
- `separator` — hairline dividers in settings and sidebar

### 9.2 Important (install when the specific surface is built)

Add these as their corresponding pages are built — not on day one:

- `sheet` — mobile sidebar drawer (used only during the transitional weeks if sidebar-on-mobile is kept before the bottom tab bar replaces it)
- `popover` — the balance info popover on the sidebar, color picker for theme preview
- `select` — sort dropdown on Projects, language selection in Settings
- `slider` — style strength sliders if introduced post-MVP
- `switch` — theme toggle, notification toggles, reduced-motion toggle in Settings
- `command` — search across Projects (bind to `⌘K`) — can be deferred to v1.1
- `accordion` — FAQ on landing, collapsible metadata section on Results
- `progress` — NOT used during generation (the generation screen is the progress indicator). Only used in Settings > Billing for purchase progress bars or upload progress on AI Twin face training
- `skeleton` — loading states for film grid, character cards pre-generation

### 9.3 Skip for MVP (do not install)

These tempt designers and waste install weight for beta:

- `calendar` / `date-picker` — nothing in Clevroy uses date selection in the user flow
- `carousel` — the scene strip is custom (horizontal scroll with state-specific styling); a generic carousel doesn't fit
- `hover-card` — a nice-to-have; tooltip covers MVP needs
- `navigation-menu` — we have one sidebar and one bottom bar, not a menu system
- `pagination` — infinite scroll via TanStack Query replaces classic pagination
- `resizable` — the shell layout is fixed for MVP
- `scroll-area` — most places native scroll is fine; only install if a specific scroll surface needs custom scrollbar styling
- `table` — nothing in MVP uses a data table; generation metadata is shown as a list, not a table
- `context-menu` — right-click menus aren't mobile-friendly; dropdown-menu on three-dot buttons covers all cases
- `menubar` — desktop-app metaphor, not a web product metaphor
- `toggle-group` — replaceable with styled buttons; adds complexity without much payoff

### 9.4 Custom components (not shadcn)

These are Clevroy-specific and must be built from scratch (do not try to force-fit a shadcn component):

- `<CenterStage />` — the phase-aware content area in section 8
- `<SceneStrip />` — the horizontal scene pill row with its four states
- `<ActivityFeed />` — the timestamped log with auto-scroll and jump-to-latest
- `<PhaseNarration />` — the crossfading headline + subline block
- `<FilmBalanceBadge />` — the "3 films left" indicator with click-to-upgrade
- `<RoundedShell />` — the outer frame + panel layout wrapper
- `<BottomTabBar />` — the mobile 5-slot nav with elevated center button

---

## 10. Mobile-First Principles

Mobile is the Capacitor v7 target, so the same React components run inside a native shell. Design rules that make mobile excellent (and don't hurt desktop) are the defaults.

### 10.1 Breakpoints

```css
/* Tailwind v4 default breakpoints, kept intentionally */
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

But the layout behavior pivots on these specific thresholds:

- **320px** — minimum supported width (iPhone SE, older small Android). Nothing below this is guaranteed to work; everything at 320px must.
- **768px** — the sidebar-to-bottom-bar breakpoint. At ≤767px we're mobile; at ≥768px we're tablet/desktop.
- **1024px** — sidebar pins open at ≥1024px. Between 768 and 1023 it's collapsed by default.
- **1440px** — the reference design width for the centralized generation screen. Above this, the center stage max-width caps at 1200px centered to prevent the content from floating too far apart.

### 10.2 Touch targets

- **Minimum 44×44 px** for any tappable element on mobile. Non-negotiable.
- Scene strip pills: 44×44 px on mobile, 56×56 px on desktop
- Bottom tab bar side slots: 56 px wide × 72 px tall each
- Center Create button: 64×64 px (exceeds minimum, which is correct — it's the primary action)
- Three-dot overflow buttons: 40px visible icon with 44×44 px hit area extended via padding
- Links in body copy: inline links get a 4px vertical hit area extension on mobile via negative margin padding trick

### 10.3 Safe area handling

All full-bleed surfaces respect the notch and home indicator:

- Top bar uses `padding-top: max(12px, env(safe-area-inset-top))`
- Bottom tab bar uses `padding-bottom: env(safe-area-inset-bottom)` — the 72px nominal height becomes 72 + inset on iPhone notched models
- The generation screen's center stage on mobile uses `max-height: calc(100dvh - [top bar] - [narration] - [scene strip] - [feed] - [cancel bar] - [safe areas])` so it adapts to any device
- `100dvh` (dynamic viewport) is used instead of `100vh` so mobile browsers with collapsing address bars don't cause layout shift

### 10.4 Keyboard handling (mobile)

- On the Create page, when the script textarea is focused, the rest of the page scrolls away so the textarea stays visible above the keyboard. The "Start your film" button docks to just above the keyboard via a `position: sticky` bottom anchor.
- Input fields in forms scroll into view with `scrollIntoView({ block: 'center', behavior: 'smooth' })` on focus
- Escape key (external keyboard) dismisses modals and closes popovers
- iOS: the keyboard "Done" button dismisses by blurring the input; no custom handling needed

### 10.5 Gesture conventions

- Horizontal swipe on the scene strip scrolls it
- Vertical swipe in the activity feed scrolls it
- Swipe-to-dismiss is **not** used on modals (accessibility: users with motor control issues can't always execute precise swipes)
- Pull-to-refresh: only on the Projects grid and Home recent films row
- Long-press on a scene thumbnail opens the scene overflow menu (same menu as the three-dot button)

### 10.6 Orientation

- Portrait is primary. All pages lay out correctly in portrait.
- Landscape is supported but not optimized. The centralized generation screen in landscape mobile uses a more desktop-like two-column layout (center stage left, feed/strip right) because horizontal space is available.
- Rotating during generation does not cancel or reset anything; the Realtime subscription and state persist.

---

## 11. Accessibility Baseline

Clevroy targets **WCAG 2.2 AA** compliance for the MVP. This isn't just about compliance — visually impaired filmmakers exist, and the product is worse when accessibility is an afterthought.

### 11.1 Keyboard navigation

- Every interactive element is focusable with Tab
- Focus visible indicator: 2px `--color-ring` outline, 2px offset, never removed globally
- Focus order matches visual order on every page
- Skip-to-content link at the top of every page (visually hidden until focused)
- Escape closes modals, popovers, and dropdowns
- Arrow keys navigate within radio groups, menus, and the sidebar item list

### 11.2 Screen reader

- All interactive elements have accessible names (button text, aria-label where icon-only)
- The generation screen phase narration is announced to screen readers via `aria-live="polite"` on the narration block; the activity feed is `aria-live="polite"` with a limit of 1 announcement per 3 seconds to avoid overwhelming the user
- Scene strip pills have `aria-label="Scene {n}, {status}"` with status being one of Pending, Rendering, Complete, Active
- Form inputs have associated `<label>` elements; error messages are tied via `aria-describedby`
- Decorative icons (the clapperboard on empty states, illustrations) have `aria-hidden="true"`

### 11.3 Color and contrast

All AA contrast ratios were verified in the Brand Guide. Additionally:

- No information is conveyed by color alone. The scene strip's "active" state uses both a red border AND a red dot icon. Error states use both red text AND an exclamation icon.
- Red-green colorblind users should never need to distinguish `--color-success` from `--color-destructive` without another signal; success has a check icon, errors have an exclamation icon.

### 11.4 Reduced motion

- Detect `@media (prefers-reduced-motion: reduce)` and apply the reduced-motion rule set
- All transitions ≤0ms except phase narration crossfade (150ms to avoid jarring pops)
- The ken-burns zoom on scene images is disabled; static images shown instead
- The scene strip pulsing border for "pending" state becomes a static filled state
- Setting override: Settings > Preferences has a "Reduce motion" toggle that forces reduced-motion regardless of system preference

### 11.5 Zoom and text resizing

- All layouts function correctly at 200% browser zoom
- Custom font sizes (user-set in browser) respected — use `rem` for all sizes in the typography scale, not `px` (the px values shown in section 3 are the rem outputs at 16px root)
- No horizontal scroll at 320px width + 200% zoom

### 11.6 Motor accessibility

- 44×44 px minimum touch targets (section 10.2)
- No action requires double-click; single-tap or keyboard activation for everything
- Drag interactions (AI Twin face upload) always have a click-based fallback ("Choose files" button alongside the drop zone)

---

## 12. Error, Empty, and Loading States

Patterns that apply across every page.

### 12.1 Error states (full-page)

Full-page errors happen when an entire route fails to load (network error, 500, etc.):

- Centered card, `text-h2` headline, `text-body` description, primary CTA "Try again"
- Headline format: "{Something specific} didn't load." (not "Oops!" — see Brand Guide §6)
- Examples:
  - "Your films didn't load. Check your connection and try again."
  - "We couldn't open that film. It may have been deleted."

### 12.2 Error states (inline)

Inline errors appear when a specific action fails (form validation, generation failure for one scene, etc.):

- Red hairline left border, `--color-primary-soft` background, `text-small` description
- Action link on the right: "Reshoot" / "Try again" / "Dismiss"
- Never blocks the rest of the UI

### 12.3 Empty states

- `text-h2` headline + `text-body` description + primary CTA
- Headline frames the absence as an invitation, not a lack: "No films yet. Paste a script and we'll start shooting."
- Paired with a subtle illustration or an empty rounded panel — not stock art

### 12.4 Loading states

- Pages with data fetches use `skeleton` for the initial load (not spinners)
- Skeletons match the layout shape of the real content (card shapes, row counts, etc.)
- Duration: if loading exceeds 3 seconds, swap skeleton for a more specific message ("Still loading your films…") to reassure the user
- **Generation is never a loading state.** The generation screen is its own full UI as specified in section 8. Do not show a spinner or a progress bar during film generation anywhere in the app.

---

## 13. Iconography

- Library: `lucide-react` (already pulled in by shadcn/ui)
- Stroke width: 1.5px globally
- Sizes: 16 / 20 / 24 px only — no arbitrary sizes
- Color: inherits from parent text color via `currentColor`
- Never fill icons; all icons are stroked
- Custom icons (if needed for the aperture mark in-UI): hand-drawn SVG in `components/icons/` directory, same 1.5px stroke convention

---

## 14. Motion Patterns

All animation uses the tokens from section 2.5. Specific patterns:

- **Panel enter:** fade in + 8px translateY, 200ms `ease-out`
- **Panel exit:** fade out + 8px translateY, 150ms `ease-out`
- **Modal:** backdrop fades in 200ms, modal scales from 96% to 100% with fade over 200ms `ease-out`
- **Button press:** scale to 98% over 100ms, return on release
- **Phase transition (generation screen):** outgoing phase text fades to 0 over 200ms, incoming fades in over 450ms `ease-out`, offset by 100ms (brief overlap)
- **Scene strip pill state change:** 200ms color/border crossfade
- **Activity feed new entry:** slides up from bottom over 200ms + 4px translateY
- **Sidebar collapse/expand:** 300ms width transition `ease-in-out`, icons crossfade
- **Theme toggle:** no animation — instant flip of `.dark` class, because animating hundreds of color variables at once looks bad

Framer Motion handles the generation screen's phase narration and scene strip transitions. Everything else uses native CSS transitions via Tailwind utilities.

---

## 15. Cross-Reference Notes

- **Color tokens** — sourced from `Clevroy_Brand_Guide.md` §2. This doc expands them into Tailwind `@theme` syntax; hex values must stay in sync.
- **Copy surface language** — all user-facing strings in the page blueprints (Home, Projects, Create, Results, etc.) follow the moderate copy swap policy from Brand Guide §5.4. "Films" not "credits." "Reshoot" not "retry." "Start your film" not "Generate."
- **Edge cases** — the generation screen's survival behaviors (backgrounding, network drops, device switch) in §8.7 are the happy-path spec. Full edge cases with stress test scenarios live in `Clevroy_UX_Edge_Cases.md`.
- **Component list** — the shadcn phasing in §9 should match what gets installed in the frontend repo. If `Clevroy_Frontend_Audit.md` has a different installed list, reconcile by checking which components are actually used in the page blueprints (§7 and §8) and removing anything unreferenced.
- **Generation phase state names** — the backend state identifiers in §8.3 (`parsing`, `cie_building`, `character_refs`, `scene_images_pending`, `voice_synthesis`, `music_composition`, `scene_assembly`, `final_concat`, `complete`, `error`) need to match the actual state enum in the backend. `Clevroy_Backend_Handoff.md` will define the canonical enum; this doc should be updated to match if the backend doc uses different names.

---

**Design System version: V1 — April 2026.** Any change to the rounded shell radius, the sidebar's 5 primary links, the phase narrative sequence, or the bottom tab bar pattern must be reviewed against the centralized generation vision before merging.
