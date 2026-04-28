# Clevroy Home + App Shell Audit — 2026-04-25

Captured from a desktop screenshot of `/home` taken on 2026-04-25 during the layout-enhancement rollout. The page is rendering an empty-state takeover ("This film isn't ready to watch yet.") inside the live shell, with the sidebar visible at left.

This audit catalogues 20 concrete defects + the structural read that ties them together. Several of these are duplicates of defects flagged in the AI Twin screenshot from earlier today (`docs/Clevroy_Chat_Surface_Risks.md` references the screenshot context) — meaning either the in-flight sessions marked tasks done without verifying, or the relevant work hasn't actually run yet. The fix path is one consolidated rebuild of the app shell against shadcn primitives plus the targeted bug fixes below.

---

## Visible defects

### Shell + chrome

1. **Cream/pinkish bleed at the top edge of the viewport.** The strip above the sidebar header is the `<body>` background showing through. Either `--background` is set to a warm light value in dark mode (Theme v2 token leak), or the `bg-sidebar` outer frame doesn't extend to the viewport top edge. Same root cause as the unfixed Capacitor `safe-area-inset-top` issue — the dark frame should paint behind the status bar, but the body color is leaking through. Marked done in `tasks.json` (`leia.21`); visibly not done.

2. **Wordmark in the sidebar header is invisible.** Top-left, where Clevroy should sit, is a faint placeholder against near-black. Same defect from the AI Twin screenshot. The Iyo session marked sidebar polish in flight but didn't ship the wordmark contrast fix. Bug is still live.

3. **Sidebar collapse trigger is floating awkwardly above the wordmark.** It's positioned absolutely at the very top, outside the natural flow of `<SidebarHeader>`. Should sit inside the SidebarHeader as a top-right cap, or to the right of the wordmark. As-is, it reads as a debug overlay.

4. **Orphan avatar in the top-right of the page.** The "N" circle is floating disconnected from any header chrome. There's already a real ProfileChip at the sidebar bottom — this top-right one is a duplicate identity surface. Same defect from the AI Twin screenshot.

5. **Active-state on "Home" is solid red `bg-primary`.** Reads as alert/danger, not selection. Spec is `bg-primary-soft text-primary` plus a 4px primary-color indicator strip (Linear-style left bar). `iyo.12` (B.29) is still pending and the live UI proves it.

### Sidebar internals

6. **`3 3 films left` — duplicated count.** Bottom of sidebar. The numeric prefix is being concatenated into the label. Same defect from the AI Twin screenshot. Either this session hasn't run, or it ran without shipping the format-string fix.

7. **Profile chip at the bottom is plain text with a tiny avatar.** "J Javaris" — no hover state, no chevron-down hint, no border, no popover affordance. Looks unfinished. The user can't tell it's clickable. The B.29 active-state language doesn't extend down here yet.

8. **Massive empty space between "Javaris" and the bottom of the sidebar** (~80px). The sidebar footer is ending mid-frame instead of bottom-anchored with `safe-area-inset-bottom`. Either the footer flex-grow is wrong or `mt-auto` isn't applied to the footer wrapper.

9. **The "Recent" group's red `New` dots are using `--color-primary` (brand red) instead of `--color-primary-soft`.** Reads as urgent/alert when they should read as a quiet "unseen" indicator. Same color-token misuse that's making the active-state feel hot.

10. **No `<SidebarSeparator />` between groups.** Resources ("Feedback" / "Documentation") sits below Recent but above the films-left badge with no visible separator. The grouping hierarchy isn't reading.

### Page content

11. **No PagePanel header on this page.** The "This film isn't ready" copy is hand-rolled, not inside a `<PagePanel title="…" subline="…">`. The home page is bypassing the design-system page primitive — `leon.14` (Home cleanup → use PagePanel) is not done.

12. **No greeting or page H1.** `Design_System §7.2` specifies "Welcome back, {first_name}" as the H1 of `/home`. The current page goes straight to a sub-state error message. There's no page-level identity.

13. **No films-left subline near the H1.** Spec says "X films left | Buy more films" inline beneath the greeting. The badge exists at sidebar bottom but there's no balance affordance in the page header. The user has to look down-and-left to know their balance.

14. **No Recent films row visible despite 5 recent films in the sidebar.** `Design_System §7.2` prescribes a horizontal-scroll Recent films row on `/home`. None here. The page is showing an empty-state takeover even though films clearly exist.

15. **No "Start your film" CTA anywhere on the page.** The user has 3 films left, 5 prior films, and zero affordance to start a new one from this page. `leon.14`'s `Button asChild` work is pending. The page is functionally a dead-end.

16. **The empty-state message card stretches edge-to-edge of the inset.** No content-column max-width inside the empty state. With `max-w-7xl` already on the inset (`leia.16`), the inner empty-state should sit in a narrower container for legibility.

17. **The empty-state has ~60% of the viewport empty below it.** No second-tier content, no recent films row, no CTA. It's just a card and then dead black space. The page is currently telling the user "your film isn't ready" and giving them no way out.

### Brand voice + visual hierarchy

18. **The empty-state copy is passive and flat.** "This film isn't ready to watch yet." / "It's still being shot. We'll take you back when it's done." `Brand_Guide §5.4` calls for more cinematic, declarative voice. Plus there's no Fraunces italic moment — every empty surface should have one serif phase line. `ghost.23` is still pending.

19. **The dark elevation system isn't applied here.** `bg-sidebar` and `bg-card` are too close in OKLCH — the seam between sidebar and inset disappears, and the empty-state card barely separates from its parent. `leia.19` (B.28) is marked done but the result is not visible.

20. **No CenterStage, no chat input, no center surface at all.** The page that should be the product's home — the place you land and feel "yes, I'm here to make a film" — is presenting a flat error message in a dark void. There is no creative affordance on this page.

---

## The structural read

The 20 defects above are symptoms. The root cause is one decision still unmade: **what is `/home`?**

Two possible product shapes were considered:

- **Shape A — `/home` is a dashboard.** Welcome back greeting, films-left, Recent films row, CenterStage above-the-fold for the in-progress film. Click a film card → `/films/[id]`. Click "Start your film" → `/create`. This is what `Design_System §7.2` and the layout enhancements were spec'd against.

- **Shape B — `/home` IS the chat surface.** Center chat input is the hero. Above it, "Welcome back. What's the next film?" Below the input, 2–3 starter prompt cards. Recent films collapse into a compact horizontal row at the bottom or live exclusively in the sidebar. There is no separate "dashboard" — `/home` and `/create` are the same surface. Type → mints a film → routes to `/films/[id]` and the thread continues there.

**Decision: Shape B.** Confirmed 2026-04-25 by the user immediately after this audit. The current screenshot is the strongest argument for it — there is already a void where the chat should be. The fix is not to fill the dashboard; it is to put the chat input in the void.

`docs/Clevroy_Chat_Surface.md §13` extends the chat-surface contract to cover `/home` as the entry point. The handoff prompt that follows this audit is the consolidated work order to fix all 20 defects above plus rebuild the app shell against shadcn primitives, ahead of the chat-surface implementation.

The cream-bleed and the duplicated count and the orphan avatar — those are genuine bugs and need fixing regardless of which shape wins. But the empty void in the middle of the page isn't a bug. It's the sound of nobody having decided what should be there yet.

---

## What this means for the in-flight rollout

- `leon.5/.6/.8/.14` (Home page tasks aimed at Shape A) need re-pointing. The Recent films row and the CenterStage placement on `/home` are cancelled under Shape B; they're absorbed into the chat surface instead.
- `leon.10/.11/.12/.13/.15/.16` (Projects tasks) survive — `/projects` is still the films list view.
- `kaiser.10/.11` (Films/[id] tasks) survive — but the `/films/[id]` page body becomes the chat thread, not a separate Results layout. The sticky header + scene strip survive as page chrome around the thread.
- `fantem.11–.17` (already refactored against the chat surface) absorb the `/home` chat-input surface as part of the same component family.
- `iyo.16` (sidebar polish) is no longer enough — the shell needs a full shadcn-primitives rebuild, captured in the consolidated handoff.

The 20 defects above + the shadcn shell rebuild are now one work item, handed off as a single prompt in the next message.
