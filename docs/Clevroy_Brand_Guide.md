# Clevroy Brand Guide

**Document purpose:** Single source of truth for the Clevroy visual and verbal identity. This doc unblocks logo commissioning, UI theming, marketing copy, and anything else that needs to look or sound like Clevroy.

**Audience:** Designers, copywriters, developers implementing theme tokens, and anyone briefing a third-party vendor.

**Status:** V1 — locked for beta launch. Any change to color hex codes, logo lockups, or primary slogan must be reviewed against `Clevroy_UI_Design_System.md` before merging, because those values are referenced directly in Tailwind tokens and landing copy.

---

## 1. Brand Positioning

### 1.1 One-line positioning

Clevroy turns your script into a finished short film you can watch, export, and share — live, on one screen, with nothing to assemble yourself.

### 1.2 What Clevroy is not

Clevroy is not a prompt-to-clip toy. It is not a storyboard tool. It is not a queue-based batch generator where users submit a job and come back later. The centralized, visible-while-generating experience is the product — competitors hide generation behind a progress bar; Clevroy makes it the show.

### 1.3 Core differentiator (say this in every pitch deck, landing page hero, and onboarding)

**"Watch your film come together like dailies from set."** Every other AI film tool hides the work. Clevroy shows it — on a center-stage screen, in real time, phase by phase, so the user feels like a director reviewing footage instead of a customer waiting for an export.

### 1.4 Audience

Primary: screenwriters, indie filmmakers, and storytellers (amateur to semi-pro) who have scripts or ideas but no budget for production. Secondary: educators, marketers, and hobbyists who want to prototype a story visually.

The brand should feel like it belongs to a real filmmaking practice — not a SaaS dashboard, not a consumer toy.

---

## 2. Color Palette

### 2.1 Primary palette

| Role | Name | Hex | Use |
|------|------|-----|-----|
| Primary accent | Cinematic Red | `#C1272D` | CTAs, the center Create button, live-activity indicators, error-recovery highlights, logo mark |
| Primary surface (light) | Off-White Paper | `#F5EFE6` | Light-mode page background, book export paper stock |
| Primary surface (dark) | Near Black | `#0D0D0D` | Dark-mode page background, outer shell frame, landing hero background |
| Ink (light mode) | Ink Charcoal | `#1A1A1A` | Body text on light backgrounds |
| Ink (dark mode) | Paper | `#F5EFE6` | Body text on dark backgrounds (reuses the off-white) |

**Why this palette:** Red + off-white + near-black is the color language of cinema — marquee lights, film leader, letterpress posters, black-box theaters. It also happens to be functionally strong: red is culturally unambiguous for "active / live / now," off-white is warmer and more premium than pure white, and near-black is easier on the eyes in long generation sessions than true `#000000`.

### 2.2 Extended palette (supporting tokens)

These are derived from the primary palette and used for secondary UI states. Do not introduce new base hues without updating this document.

| Token | Hex | Use |
|-------|-----|-----|
| Red Deep | `#8F1D22` | Red button pressed/hover-down state, destructive confirm, book export cover accent |
| Red Soft | `#E8B5B8` | Red tint on hover for subtle hovers, error toast backgrounds in light mode |
| Paper Warm | `#EAE2D4` | Secondary surface in light mode (card on page) |
| Paper Cool | `#FBF7F0` | Elevated card or modal in light mode |
| Shell Frame | `#050505` | Outer rounded shell frame in dark mode (one shade deeper than Near Black to create a "frame around a screen" feel) |
| Panel Dark | `#161616` | Floating rounded panel on dark mode |
| Panel Dark Elevated | `#1F1F1F` | Modals, popovers, and hovered panels in dark mode |
| Divider Dark | `#262626` | Hairline dividers in dark mode |
| Divider Light | `#D9D2C4` | Hairline dividers in light mode |
| Muted Ink Dark | `#9A9A9A` | Secondary text in dark mode |
| Muted Ink Light | `#6A6359` | Secondary text in light mode |
| Success | `#2F7D5C` | Generation success, credit refund confirmations |
| Warning | `#C88A2C` | Soft caveats (low credits, slow provider, rate limit approaching) |
| Danger | `#C1272D` | Reuses Cinematic Red — Clevroy does not have a separate "error red" to avoid palette sprawl |

### 2.3 Mode-by-mode token map

Dark mode is the default for the app interior (Create, Results, the centralized generation screen) because video and image content look better against a dark surround, which is the same reason screening rooms are dark. Light mode is available everywhere and is the default for marketing pages, the book export, and Settings.

Token naming follows the **shadcn/ui convention** (`--color-*` prefix) so that shadcn components theme themselves automatically without per-component overrides. Custom Clevroy-specific tokens are added alongside the shadcn defaults, not as replacements. Every token below maps to a Tailwind v4 `@theme` entry in the design system doc.

**Dark mode tokens** (shadcn base + Clevroy custom)

```
/* shadcn base — these are the names shadcn components read from */
--color-background:          #0D0D0D;     /* page background */
--color-foreground:          #F5EFE6;     /* primary text */
--color-card:                #161616;     /* panel background */
--color-card-foreground:     #F5EFE6;
--color-popover:             #1F1F1F;     /* modals, popovers */
--color-popover-foreground:  #F5EFE6;
--color-primary:             #C1272D;     /* Cinematic Red — CTAs, accent */
--color-primary-foreground:  #F5EFE6;
--color-secondary:           #1F1F1F;
--color-secondary-foreground:#F5EFE6;
--color-muted:               #161616;
--color-muted-foreground:    #9A9A9A;     /* secondary text */
--color-accent:              #1F1F1F;     /* hover/active surface tint */
--color-accent-foreground:   #F5EFE6;
--color-destructive:         #C1272D;     /* reuses Cinematic Red intentionally */
--color-destructive-foreground:#F5EFE6;
--color-border:              #262626;     /* hairline dividers */
--color-input:               #262626;
--color-ring:                #C1272D;     /* focus ring */

/* Clevroy custom — extend the shadcn base */
--color-shell:               #050505;     /* outer rounded shell frame */
--color-panel-elev:          #1F1F1F;     /* elevated card / modal */
--color-primary-hover:       #8F1D22;     /* Red Deep */
--color-primary-soft:        rgba(193, 39, 45, 0.15);
--color-success:             #2F7D5C;
--color-warning:             #C88A2C;
```

**Light mode tokens** (shadcn base + Clevroy custom)

```
/* shadcn base */
--color-background:          #F5EFE6;
--color-foreground:          #1A1A1A;
--color-card:                #FBF7F0;
--color-card-foreground:     #1A1A1A;
--color-popover:             #FFFFFF;
--color-popover-foreground:  #1A1A1A;
--color-primary:             #C1272D;
--color-primary-foreground:  #F5EFE6;
--color-secondary:           #EAE2D4;
--color-secondary-foreground:#1A1A1A;
--color-muted:               #EAE2D4;
--color-muted-foreground:    #6A6359;
--color-accent:              #EAE2D4;
--color-accent-foreground:   #1A1A1A;
--color-destructive:         #C1272D;
--color-destructive-foreground:#F5EFE6;
--color-border:              #D9D2C4;
--color-input:               #D9D2C4;
--color-ring:                #C1272D;

/* Clevroy custom */
--color-shell:               #EAE2D4;
--color-panel-elev:          #FFFFFF;
--color-primary-hover:       #8F1D22;
--color-primary-soft:        rgba(193, 39, 45, 0.10);
--color-success:             #2F7D5C;
--color-warning:             #C88A2C;
```

These exact token names should be used verbatim in Tailwind v4 theme config so that `Clevroy_UI_Design_System.md` can reference them without translation. The shadcn base names are non-negotiable (components depend on them); the Clevroy custom names can be extended but not renamed without updating both files.

### 2.4 Accessibility contrast notes

All body text pairings meet WCAG AA contrast:

- Paper `#F5EFE6` on Near Black `#0D0D0D` → ~16.8:1 (exceeds AAA)
- Ink Charcoal `#1A1A1A` on Paper `#F5EFE6` → ~15.7:1 (exceeds AAA)
- Cinematic Red `#C1272D` on Paper `#F5EFE6` → ~5.3:1 (passes AA for normal text)
- Cinematic Red `#C1272D` on Near Black `#0D0D0D` → ~4.1:1 (passes AA for large text and UI components; for body text on dark red backgrounds use Paper, not Red)

Do not place red text on red backgrounds. Do not use Muted Ink Dark `#9A9A9A` for anything smaller than 14px — it fails AA below that size.

---

## 3. Logo Direction

### 3.1 Concept

The Clevroy mark is a **C-shaped camera aperture**. The letter C is formed by the curved blades of a camera iris, partially closed so it reads simultaneously as a "C" and as a lens opening. This does three things at once: it initials the brand, it signals the filmmaking craft (an aperture is the single most iconic cinematography element), and it creates a simple, almost geometric shape that reproduces cleanly from a 16px favicon up to a cinema-screen splash.

The mark should feel **etched, industrial, and confident** — closer to a film-reel canister logo or a 1970s title card than to a rounded tech-startup glyph. No gradients, no inner shadows, no 3D. It should work as a single flat color.

### 3.2 Four required lockup variants

These are the four files that need to exist before product launch. Each is used in specific contexts, and substituting the wrong one will break layouts.

**1. Icon / App mark**
The aperture "C" alone, inside an invisible 1:1 bounding box with ~12% padding on every side. Used for: favicon, iOS/Android app icon, social profile image, loading spinner center, the "C" badge in the sidebar collapsed state. Must read at 16×16 px; test it there before approving. File: `clevroy-icon.svg` plus PNG exports at 16, 32, 64, 128, 256, 512, 1024 px.

**2. Horizontal lockup**
Aperture icon on the left, wordmark "Clevroy" on the right, baseline-aligned. Gap between icon and wordmark equals the x-height of the wordmark. Used for: landing page top nav, email headers, documentation, signature blocks. File: `clevroy-horizontal.svg`.

**3. Stacked lockup**
Aperture icon on top, wordmark centered underneath. The icon is roughly 2× the cap height of the wordmark. Used for: app splash screens, book export cover page, portrait-orientation marketing, T-shirts. File: `clevroy-stacked.svg`.

**4. Wordmark only**
"Clevroy" typeset without the aperture icon. Used for: tight horizontal spaces (footer strips), body-copy mentions in press, documents where the icon would compete visually with other marks. File: `clevroy-wordmark.svg`.

### 3.3 Color versions (each variant, three versions)

For each of the four lockups, produce three color versions:

- **Red on Paper** — Cinematic Red `#C1272D` mark on off-white `#F5EFE6` background. Primary public-facing version.
- **Paper on Near Black** — Off-white `#F5EFE6` mark on near-black `#0D0D0D` background. Used inside the dark-mode app and on landing hero.
- **Mono (single color)** — Solid Ink Charcoal `#1A1A1A`. For print, one-color merchandise, legal documents.

This means the final logo delivery is 4 lockups × 3 colorways × (SVG + PNG exports) = the asset pack for launch.

### 3.4 Clearspace and minimum size

Clearspace around any lockup equals the height of the aperture icon. No text, graphic, or container edge should intrude into that zone.

Minimum rendered sizes:

- Icon: 16 px (favicon is the hard floor)
- Horizontal lockup: 96 px wide
- Stacked lockup: 64 px wide
- Wordmark only: 72 px wide

### 3.5 Misuse (do-not)

Do not recolor the mark into any color outside the approved three (Red / Paper / Ink). Do not place the mark on a photographic background without a solid fill plate behind it. Do not rotate, skew, distort, or outline the mark. Do not re-space the letters of the wordmark. Do not re-draw the aperture with a different blade count — it is a **six-blade** aperture, always.

---

## 4. Wordmark Typography

### 4.1 Wordmark typeface

The wordmark "Clevroy" is set in **Inter Display**, mixed-case with a capital C and lowercase "levroy." The target feeling is "modern film studio title card" — a contemporary reinterpretation of classic studio sans-serif lockups, not a generic tech wordmark.

**Locked spec:**

- Font: **Inter Display** (not Inter — the Display optical variant has tightened, more confident proportions at large sizes)
- Weight: **Semibold (600)**
- Letterspacing: **+10 units** (tracked slightly open to give the wordmark architectural breathing room)
- Case: Capital C, lowercase "levroy"
- The capital C in the wordmark is **manually redrawn** to widen the aperture so it visually rhymes with the six-blade aperture icon. This is a one-time vector adjustment on the logo lockup files — the app UI uses stock Inter for everything else.

Inter Display is the locked choice for three reasons: (1) it's free and already in the Google Fonts pipeline that the rest of the UI uses, so the wordmark and the product share type DNA; (2) its proportions at Display weight are genuinely cinematic, not a compromise; (3) no licensing tracking, no renewal fees, no per-seat costs as the team grows.

Do not use Montserrat, Poppins, or Raleway. They are over-used in tech branding and will flatten the cinematic feel. Do not substitute plain Inter (the non-Display variant) — the optical difference matters at wordmark sizes.

### 4.2 UI typefaces (not the wordmark — the app)

The wordmark is a static logo. The app UI uses a different stack for readability:

- **UI Sans:** Inter (weights 400, 500, 600, 700) — the default for body, buttons, labels, nav.
- **Editorial Serif:** Fraunces (weights 400, 500, 600 with Optical Size axis) — reserved for hero headlines on the landing page, book export chapter titles, and the phase narrative copy on the centralized generation screen ("Reading your script...", "Final cut..."). Used sparingly, always paired with Inter for body.
- **Mono:** JetBrains Mono — for any code, filenames, IDs, technical error messages in Settings > Developer.

All three are free and load from Google Fonts or self-host.

### 4.3 Type scale (for UI reference — fully detailed in the Design System doc)

- Display: 48 / 56 / 72 px (Fraunces)
- H1: 32 px (Inter Semibold)
- H2: 24 px (Inter Semibold)
- H3: 20 px (Inter Semibold)
- Body: 16 px (Inter Regular)
- Small: 14 px (Inter Regular)
- Caption: 12 px (Inter Medium, uppercase +50 tracking for labels)

---

## 5. Slogan Library

Clevroy needs a spine slogan plus a bench of supporting taglines for different contexts. The spine slogan is locked. The bench can be rotated by context.

### 5.1 Spine slogan (locked — use everywhere by default)

**"Your script. On screen. Now."**

Three beats, each landing on a period. It names the input (script), the outcome (on screen — deliberately ambiguous between the app screen and the cinema screen), and the speed (now). It works as a homepage hero, as an App Store subtitle, and as a pitch one-liner. Never change the periods to commas. The three hard stops are part of the rhythm.

### 5.2 Hero taglines (pick one per landing context)

- **"Watch your story shoot itself."** — for the hero when the video demo is prominent; plays on "shoot" as filmmaking and as automatic.
- **"Dailies, without the crew."** — for the "how it works" section; positions Clevroy as the production the user doesn't have.
- **"Write it. Watch it. Done."** — for short-form ads and App Store preview; most aggressive version of the spine.
- **"The first film studio that fits in a tab."** — for press and investor decks; positions Clevroy against physical production, not against other AI tools.

### 5.3 CTA copy (on buttons, emails, modals)

- Primary CTA across the product: **"Start your film"** (not "Get started," not "Generate")
- Returning-user CTA: **"Open the studio"**
- Upgrade CTA: **"Buy more films"** (shown when user runs out of films; reframes purchase around the output, not an abstract currency)
- Export CTA: **"Take it home"** (shown next to download buttons for PDF / ZIP / MP4)
- Regeneration CTA: **"Reshoot this scene"** (reinforces the filmmaking metaphor over the AI metaphor)

**Surface language:** In all user-facing copy — buttons, modals, empty states, emails, the header balance indicator — the unit is **"films."** Not credits. A user has "3 films left," not "3 credits remaining." This holds even though the underlying database column is `credits_remaining NUMERIC(8,2)` because 1 credit = 1 film in the beta credit model, and "films" is the unit the user actually cares about. The word "credits" is reserved for: (a) internal documentation, (b) billing/invoice line items where legal/accounting precision matters, and (c) the scene-regen cost where "films" doesn't fit ("0.2 films" reads badly — there, use "regen cost" or "reshoot cost" as the surface term). Developer-facing surfaces like Settings > Developer or the API response bodies can use "credits" if it improves technical clarity.

### 5.4 Microcopy voice samples

Every string should choose filmmaking language over software language **when a natural substitute exists and doesn't cost clarity.** Clevroy uses a **moderate swap policy** — film language where it enhances the feeling, plain language where clarity matters more than flavor.

The rule: **Swap when the film word is obvious to a non-filmmaker. Keep the plain word when the film word would require explanation, appear in a destructive action, or confuse a user mid-task.**

| Software word | Clevroy word | Swap? |
|---|---|---|
| Generate (a film) | Shoot / Start your film | ✅ Always |
| Retry / Regenerate (scene) | Reshoot | ✅ Always |
| Download / Export | Take it home | ✅ On buttons and CTAs |
| Project (as user's creation) | Film | ✅ Always |
| Processing / Loading (generation) | Rolling | ✅ On the generation screen only |
| Iteration / Version | Take | ✅ In the scene detail view |
| Result / Output | Cut / Final cut | ✅ On the Results screen |
| Credit (the unit) | Film | ✅ Always in user-facing copy (see 5.3) |
| Delete | Delete | ❌ Keep — destructive actions must be unambiguous |
| Cancel | Cancel | ❌ Keep — "Cut" is a homonym with Final Cut, confusing |
| Save | Save | ❌ Keep — no natural film equivalent |
| Settings | Settings | ❌ Keep |
| Error / Failed | "This scene didn't render" | ⚠️ Rephrase, don't swap — see error voice in section 6 |
| Queue | Queue | ❌ Keep — "on the slate" sounds like internal jargon to a non-filmmaker |
| Sign in / Sign up | Sign in / Sign up | ❌ Keep |

**Test before swapping any new string:** Read the swapped version to someone who has never made a film. If they pause, if they ask what it means, or if the meaning is ambiguous in context — revert to the plain word. The swap exists to make Clevroy feel like it belongs to filmmaking, not to force users to learn vocabulary.

---

## 6. Copy Voice Guidelines

### 6.1 Voice attributes (in order of weight)

1. **Crafted, not casual.** Clevroy is a tool for storytellers. Copy should feel like it respects the craft, not like it is humoring a hobbyist. Avoid "✨" energy, avoid emoji in product copy (emoji are fine in marketing social posts), avoid exclamation points except in confirmation of user success.
2. **Quick on its feet.** Sentences are short. Rhythm matters. Read it aloud — if you run out of breath, cut it.
3. **Confident about what it is, honest about what it isn't.** Clevroy does not pretend to be a human film crew. When something is AI-generated, we say so. When a generation fails, we say so and offer a reshoot rather than burying the error.
4. **Plainspoken, not precious.** Avoid "unleash," "empower," "magical," "revolutionary." Avoid "simply" (it's rarely simple). Avoid "just" as filler. If a sentence still works without the adjective, the adjective was the problem.

### 6.2 Tone shifts by surface

Copy tone should flex depending on where the user is in the product:

- **Marketing (landing, ads, App Store):** Confident, cinematic, a little bold. Room for taglines and wordplay.
- **Onboarding:** Warm, specific, encouraging. This is the first conversation — tell them exactly what will happen and what to expect.
- **In-product (Create, Results, Settings):** Functional and crisp. Label buttons with verbs. Keep descriptions to one line.
- **Generation phase narration (the center-stage screen):** Cinematic, present-tense, first-person singular as Clevroy itself ("Reading your script..." / "Blocking the scenes..." / "Finding voices..."). Full list lives in `Clevroy_UI_Design_System.md` section on the Create screen.
- **Errors:** Direct, no blame, with a clear next action. Never say "Oops!" Never say "Something went wrong." Say what went wrong and what the user can do about it.
- **Success states:** Understated. A completed film gets a single line of acknowledgement, not confetti. The film itself is the reward.

### 6.3 What Clevroy never says

- "Magical," "magic," "magically"
- "AI-powered," "AI-driven," "powered by AI" (we don't lead with the tool; we lead with the film)
- "Seamless," "frictionless," "effortless"
- "Next-generation," "cutting-edge"
- "Simply," "just," "easily" as intensifiers
- "Oops!" or any surprised-sounding interjection for errors
- "Users" in user-facing copy (use "you" or "filmmakers" — "users" is for internal documentation only)

---

## 7. Brand Do / Don't Examples

These are the concrete calls that come up in real work. When in doubt, match the Do column exactly.

### 7.1 Headline writing

**Do:** "Your script. On screen. Now."
**Don't:** "Unleash your story with AI-powered magic!"

**Do:** "Watch your film come together."
**Don't:** "Experience the future of filmmaking."

### 7.2 Button labels

**Do:** "Start your film"
**Don't:** "Generate Now" / "Get Started" / "Create My Movie!"

**Do:** "Reshoot this scene"
**Don't:** "Regenerate" / "Try Again" / "Retry"

**Do:** "Take it home" (for downloads)
**Don't:** "Download Your AI-Generated Content"

### 7.3 Error states

**Do:** "This scene didn't render. Reshoot it and we'll only charge the regen cost."
**Don't:** "Oops! Something went wrong. Please try again."

**Do:** "We're out of voices at the moment. Try again in a minute."
**Don't:** "ElevenLabs API returned 503. Retry with exponential backoff."

### 7.4 Empty states

**Do:** "No films yet. Paste a script and we'll start shooting."
**Don't:** "You have no projects. Click the button below to create your first project."

### 7.5 Confirmation modals

**Do:** "Delete this film? It can't be recovered." [Keep it] [Delete it]
**Don't:** "Are you sure you want to permanently delete this project? This action cannot be undone. [Cancel] [OK]"

### 7.6 Marketing claims

**Do:** "A full short film in under ten minutes."
**Don't:** "Revolutionary AI technology that transforms scripts into Hollywood-quality films instantly!"

### 7.7 Visual do/don'ts

**Do:** Place the red aperture mark on solid near-black or solid paper. Use flat color. Let the shape do the work.
**Don't:** Add a glow, a gradient, or a drop shadow to the mark. Don't animate the aperture blades in the logo lockup (animation is fine as a loading state, never as the logo itself).

**Do:** Use plenty of negative space. Cinematic layouts breathe.
**Don't:** Fill every corner with features, badges, or "As seen in" logos. Cram equals cheap.

---

## 8. Logo Generation Prompts (for Google ImageFX)

These eight prompts are written for ImageFX specifically — each is self-contained, leads with the concept, and closes with the style modifiers that ImageFX responds to most reliably. Use them to seed the logo commissioning process; the output from these is **inspiration**, not a final logo — a designer should take the strongest direction and redraw it as a clean vector.

### Prompt 1 — The canonical mark (start here)

> A minimalist logo of a six-blade camera aperture forming the letter C, drawn as flat geometric vector art, solid cinematic red on an off-white background, perfectly symmetrical, no gradients, no shadows, etched industrial feel, high-contrast, centered in frame, logo design, vector illustration.

### Prompt 2 — Stacked lockup direction

> A brand lockup: a six-blade camera aperture shaped like the letter C sits above the wordmark "Clevroy" in a geometric sans-serif, stacked vertically, solid cinematic red on off-white paper background, centered, generous clearspace, modern film studio nameplate, flat vector design, clean and architectural.

### Prompt 3 — Horizontal lockup direction

> A horizontal brand lockup: on the left, a camera aperture icon shaped like the letter C with six blades; on the right, the word "Clevroy" set in a geometric sans-serif, baseline-aligned with the icon, cinematic red on off-white, like a 1970s film studio mark reimagined for today, flat vector, no effects.

### Prompt 4 — Dark background variant

> A logo mark: the letter C shaped from a six-blade camera iris, drawn in warm off-white on a deep near-black background, looks like a film leader title card, flat geometric vector, symmetrical, no gradients, cinematic minimalism, high contrast.

### Prompt 5 — Mono/print version

> A single-color logo of a camera aperture iris forming the letter C, solid dark charcoal ink on warm off-white paper, looks like letterpress printing or an embossed film canister stamp, flat vector, six blades, symmetrical, clean geometric lines, editorial feel.

### Prompt 6 — App icon squared

> An app icon: a six-blade camera aperture shaped into the letter C, solid cinematic red mark on a soft off-white rounded-square background, centered with even padding, flat vector, reads clearly at small sizes, modern film studio app icon, no text, no shadow.

### Prompt 7 — Alternate direction: projector-beam interpretation

> A logo mark where the letter C is formed by a projector light beam curving through darkness, minimalist, drawn as a single continuous red shape on off-white, suggests both a camera aperture and a light cone, flat vector art, geometric, clean, cinematic.

### Prompt 8 — Alternate direction: film leader countdown

> A logo mark inspired by old film leader countdown reels: a circular frame with a bold letter C inside that itself reads as an aperture opening, solid cinematic red on warm off-white, concentric geometric design, flat vector, high contrast, vintage cinema feel reimagined minimally.

**Notes for the designer working from these outputs:** The canonical direction is Prompt 1. Prompts 2 and 3 show how Prompt 1 extends to the stacked and horizontal lockups. Prompts 4 and 5 confirm the mark works across all three colorways. Prompt 6 checks small-size legibility. Prompts 7 and 8 are alternate concepts held in reserve — present them to the principal only if the aperture direction stalls. The final drawn mark must be a **six-blade aperture specifically**, hand-vectored, with visually balanced blade gaps; ImageFX tends to produce 5-blade or 8-blade apertures which must be corrected.

---

## 9. Cross-Reference Notes

Items where this guide needs to stay in sync with other documents as the build progresses. The four items below were initially flagged as conflicts and have been resolved in-doc; they remain here as an audit trail for anyone reading the V1 guide later.

**Resolved in V1:**

- ✅ **Tailwind token naming** — Section 2.3 now uses the shadcn/ui convention (`--color-background`, `--color-primary`, etc.) so shadcn components theme themselves without per-component overrides. Clevroy custom tokens (`--color-shell`, `--color-panel-elev`, `--color-primary-hover`) extend the shadcn base. `Clevroy_UI_Design_System.md` must match these names verbatim.
- ✅ **Wordmark font** — Section 4.1 locks Inter Display Semibold with +10 letterspacing as the primary and final choice. Free, already in the UI stack, no licensing overhead. The capital C is manually redrawn on the lockup files to echo the aperture icon.
- ✅ **Credit microcopy** — Section 5.3 locks "films" as the user-facing unit in all buttons, modals, and balance indicators. "Credits" is reserved for internal documentation, billing line items, and the scene-regen cost. Database column remains `credits_remaining NUMERIC(8,2)` per `Clevroy_Cost_Decisions.md`; only the surface language changes.
- ✅ **Copy swap policy** — Section 5.4 locks a moderate swap policy: film language where it enhances feeling, plain language where clarity matters (destructive actions, ambiguous homonyms, common UI affordances). The explicit swap/keep table prevents drift.

**Still open — verify during frontend audit reconciliation:**

- **Existing frontend copy debt** — If `Clevroy_Frontend_Audit.md` currently shows strings like "Generate Now" or "Retry," those need to be flagged against the moderate swap table in section 5.4 and fixed before launch.
- **"5 free credits on signup"** — This is a product/pricing decision, not a brand decision. It should live unambiguously in `Clevroy_Cost_Decisions.md`; this guide only covers how it's surfaced to the user (as "5 free films" on the signup and upgrade screens).

---

## 10. File Delivery Checklist (for logo commissioning)

The designer's deliverable should be one zipped asset pack containing:

- `/svg/` — all 4 lockups × 3 colorways = 12 SVG files, named `clevroy-[variant]-[colorway].svg`
- `/png/` — same 12 files exported at 512 px and 2048 px wide
- `/app-icon/` — the icon variant exported as PNG at 16, 32, 64, 128, 256, 512, 1024 px plus a rounded-square iOS/Android ready version at 1024 px
- `/favicon/` — `.ico` and a `.svg` for the favicon
- `/lockup-guide.pdf` — a one-page PDF showing clearspace rules, minimum sizes, and the do/don't examples from section 3.5 and 7.7
- `/source/` — the editable source file (Figma, Illustrator, Affinity — any vector tool, shared in native format)

Brand guide version: **V1 — April 2026**. Update the version stamp when colors, logos, or the spine slogan change.
