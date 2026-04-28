# Clevroy Global Design Rules

**Document purpose:** A short, opinionated set of patterns every page must follow so the product feels like one app instead of eight agents' work stitched together. Cuts review cycles. Cuts implementation time.

**Status:** V1 — locked for MVP. Owned by Axios (orchestrator + designer). Updated when patterns change.

**Audience:** Every agent. Read once. Reference when building any new screen.

---

## 1. The seven shared primitives

Every screen is composed from these. If you find yourself building a one-off, stop and ask Axios — there's almost always a primitive that fits.

| Primitive | Used for | Lives in |
|---|---|---|
| `<RoundedShell />` | Outer app frame for all authenticated routes | `src/components/shell/` (Leia) |
| `<PagePanel />` | Standard page container — title, subline, content slot | `src/components/shell/PagePanel.tsx` (Leia) |
| `<SectionHeader />` | H2 + optional action button row inside a page | `src/components/shell/SectionHeader.tsx` (Leia) |
| `<EmptyState />` | "Nothing here yet" pattern (Brand_Guide §7.4 voice) | `src/components/empty-states/` (Leon) |
| `<ConfirmDialog />` | All destructive confirmations | `src/components/ui/` (Leia, on top of shadcn dialog) |
| `<Toast />` | Sonner global. Cross-page completion / error / refund | `src/components/toasts/` (Ghost) |
| `<Skeleton />` | Loading placeholders matching layout shape | `src/components/ui/skeleton.tsx` (Leia) |

If a screen needs a navbar, sidebar, or tab bar, it goes in **the shell** — not the page.

---

## 2. The five locked patterns

### 2.1 Page header pattern

Every authenticated page opens with the same shape:

```tsx
<PagePanel>
  <h1 className="text-h1">{pageTitle}</h1>
  {subline && <p className="text-body text-muted-foreground mt-1">{subline}</p>}
  <div className="mt-8">{children}</div>
</PagePanel>
```

No agent invents their own page-title styling. If you need a chip or action next to the title, use `<SectionHeader />` for the row.

### 2.2 Confirmation pattern

All destructive confirmations use `<ConfirmDialog />` with this exact prop shape:

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Delete this film? It can't be recovered."
  cancelLabel="Keep it"      // default — verb pair
  confirmLabel="Delete it"
  destructive
  onConfirm={handleDelete}
/>
```

The cancel/confirm verb pair (Keep it / Delete it, Keep going / Stop, Cancel / Reshoot) lives in `src/lib/copy.ts` under `confirmVerbPairs`. Never write a one-off pair without adding it to the registry.

### 2.3 Empty-state pattern

Brand voice is "absence as invitation." Always:

```tsx
<EmptyState
  illustration={<ApertureIcon className="opacity-40" />}
  headline="No films yet. Paste a script and we'll start shooting."
  cta={{ label: "Start your first film", href: "/create" }}
/>
```

Never use stock illustrations. The aperture mark or a muted panel only.

### 2.4 Loading pattern

- **Initial fetch:** `<Skeleton />` matching the real layout shape. No spinners.
- **Long fetch (>3s):** swap skeleton for a single line: `"Still loading {thing}…"`.
- **In the middle of an action:** disable the button + show its label changing (`"Deleting…"`).
- **Generation:** never a loading state. The CenterStage IS the loading UI.

### 2.5 Error-state pattern

Brand_Guide §7.3 voice. Pattern:

```tsx
<ErrorState
  headline="{Specific thing} didn't load."
  body="Check your connection and try again."
  primary={{ label: "Try again", onClick: retry }}
/>
```

Headline is a complete sentence. Never `Oops`, never `Something went wrong`. Specific noun + specific verb.

---

## 3. The three motion timings

Use only these three durations. Pick by purpose, not by feel.

| Token | Duration | Use for |
|---|---|---|
| `--duration-fast` | 150ms | hover/focus, color shifts on buttons |
| `--duration-base` | 200ms | press states, tooltip enter, small panels |
| `--duration-slow` | 300ms | sheet/sidebar, modal enter, page-section reflow |

Two exceptions live in tokens:
- `--duration-phase` — 450ms — reserved for `<PhaseNarration />` crossfade only.
- `prefers-reduced-motion` — collapses all of the above to 0ms except phase narration (150ms).

**Default easing:** `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`). Don't import a new easing curve.

---

## 4. The four spacing rhythms

The 4px Tailwind scale is the law. Every gap, padding, and margin is a multiple of 4px. Three rhythms cover 90% of cases:

- **Tight (4–8px / `gap-1`–`gap-2`):** inside chips, between icon + label
- **Snug (12–16px / `gap-3`–`gap-4`):** inside cards, list rows
- **Roomy (24–32px / `gap-6`–`gap-8`):** between page sections, around hero blocks
- **Cinematic (48–64px / `gap-12`–`gap-16`):** above page H1, between distinct page zones

Don't use `gap-5` or `gap-7`. They break the rhythm.

---

## 5. The icon contract

- Library: `lucide-react`. No other icon source.
- Stroke width: 1.5 (set via the `strokeWidth` prop or globally via Tailwind class).
- Sizes: 16, 20, or 24 px. Never arbitrary.
- Color: inherits via `currentColor` — never hard-coded.

---

## 6. The copy contract

- Every user-facing string lives in `src/lib/copy.ts` under your agent's labeled section.
- No raw JSX strings. Ghost's ESLint rule will fail your PR.
- Banned words list is enforced in CI: `Oops`, `Something went wrong`, `Generate`, `Magical`, `Seamless`, `Simply`, `AI-powered`, `Unleash`.
- Surface unit: "films" not "credits" (except Settings → Billing line items).
- Verb pairs in confirmations come from `confirmVerbPairs` in copy.ts.

---

## 7. The accessibility floor

- 44×44 px minimum touch target. Hit area extends via padding when the visible icon is smaller.
- 2px focus ring (`outline-ring/50` from theme), never removed.
- All interactive components keyboard-reachable. Custom rows/strips use roving tabindex.
- `aria-live="polite"` on streaming text. `aria-live="assertive"` only for errors that should interrupt the user.
- `prefers-reduced-motion` honored at the duration-token layer — agents don't need to special-case.

---

## 8. The shell pattern

The rounded shell is the application chrome:

- Outer frame: `bg-shell` (or `bg-sidebar` in the v2 theme), full viewport.
- 12px inset on all sides via `--spacing-shell-gap`.
- Inside: `<Sidebar />` + main panel, both 12px-radius (`rounded-lg`), `bg-card`.
- 12px gap between sidebar and main panel.
- On mobile: `<BottomTabBar />` replaces sidebar. Shell-gap collapses to 0.
- Auth screens, landing, and the centralized generation screen retain or extend the shell — they don't break out of it.

The visual reference is the new shadcn `sidebar-07` block (https://ui.shadcn.com/view/new-york-v4/sidebar-07) wrapped in our rounded shell. **The sidebar block alone is not enough** — Iyo and Leia must compose it inside RoundedShell so the panel float + 12px gap + mobile collapse all work together.

---

## 9. The centralized generation alignment

Every agent's surface eventually feeds into or out of the generation screen. Three commitments keep that consistent:

1. **The CenterStage is sacred.** No spinner, progress bar, or "generating…" text appears anywhere in the app. The CenterStage is the only generation UI.
2. **Phase state is a global concept.** Anywhere in the app, if a film is generating for the user, surfaces show the same indicator (red dot on Create, in-progress card on Home, balance reflecting the debit). Stratum's balance + Realtime hooks are the source of truth.
3. **Brand voice flows in and out.** Buttons that lead to generation say "Start your film." Buttons that come out of it say "Take it home." Errors that block generation say what specifically failed.

If your screen doesn't reference generation, ask whether it reinforces the path to or from it.

---

**Version: V1 — 2026-04-24.** Update when a primitive is added, a pattern changes, or a banned word is added.
