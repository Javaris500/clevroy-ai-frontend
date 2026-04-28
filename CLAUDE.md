# Clevroy Frontend — Claude Code Ground Rules

Single-developer build of the Clevroy frontend.

- Working dir: `C:\Users\javar\Desktop\clevroy-frontend`
- Stack: Next.js 15 App Router, React 18, Tailwind v4 (`@theme`), shadcn/ui, Vercel AI Elements, Vercel AI SDK v6, Zustand, TanStack Query, Framer Motion, Capacitor v7
- Backend lives in a separate repo on Railway/Supabase/R2. Frontend talks to it via REST + Supabase Realtime.

## Build model — layered, sequential

The app ships in six layers. Each layer is a complete floor; later layers compose on top without rewriting earlier ones. Don't propose Layer N+2 work while Layer N+1 hasn't started.

| Layer | Slice | Status |
|---|---|---|
| 0 | Edge-to-edge shell, no cream, no rounded inset | ✅ done |
| 1 | Visual `<ChatSurface mode="empty">` on `/home` (AI Elements `PromptInput` + `Suggestions`, unwired submit) | ✅ done |
| 2 | `/home` + `/create` + `/films/[id]` share one ChatSurface; submit mints `film_id` and routes | not started |
| 3 | Message-type components (`UserMessage`, `NarrationMessage`, `SceneImageCard`, `ScenePlaybackCard`, `CharacterRefCard`, `FinalFilmCard`, `ActivityMessage`, `SystemMessage`) fed from fixtures | not started |
| 4 | `useChat` + Vercel AI Gateway wiring (`anthropic/claude-haiku-4-5`) + tool schemas + voice filter | not started |
| 5 | Backend integration — `thread_messages` persistence + Realtime merge in the API route | not started |

The full surface contract is in `docs/Clevroy_Chat_Surface.md` §13. The risk register is `docs/Clevroy_Chat_Surface_Risks.md` — six risks; voice slip and dead-thread silence bite earliest.

## Reference docs

These survive from the prior build phase. Read them as **specs**, not as org charts. References to agent names (Leia, Stratum, Iyo, Leon, Fantem, Nemi, Kaiser, Ghost, Roy, Axios) describe *what* gets built, not *who* builds it — that scaffolding is dropped.

- `docs/Clevroy_Dev_Overview.md` — mental model
- `docs/Clevroy_Brand_Guide.md` — color, type, copy
- `docs/Clevroy_UI_Design_System.md` — layout + components
- `docs/Clevroy_UX_Edge_Cases.md` — failure modes
- `docs/Clevroy_Global_Design_Rules.md` — primitives + accessibility
- `docs/Clevroy_Chat_Surface.md` — chat surface contract (the live spec)
- `docs/Clevroy_Chat_Surface_Risks.md` — risk register
- `docs/Clevroy_Home_Audit_2026-04-25.md` — Shape B decision history
- `Clevroy_Backend_Handoff.md` — API/state contract

Note: `docs/Clevroy_Layout_Enhancements.md` and `docs/Clevroy_Page_Component_Inventory.md` reference Shape A dashboard surfaces that Shape B cancels — read selectively.

## Locked constraints (violating these blocks the work)

- **shadcn-first / AI Elements-first.** If a UI element has a shadcn or AI Elements equivalent, use it. Don't hand-roll buttons, inputs, textareas, cards, dialogs, dropdown menus, tooltips, sheets, tabs, avatars, badges, separators, popovers, selects, switches, skeletons, sonner toasts. Prompt inputs, suggestion chips, and message lists come from `src/components/ai-elements/` (installed via `npx ai-elements@latest add <name>`). Custom components are only allowed for the seven primitives in `Global_Design_Rules §1` and the Clevroy-specific surfaces in `Design_System §9.4` (`<CenterStage />`, `<SceneStrip />`, `<ActivityFeed />`, `<PhaseNarration />`, `<FilmBalanceBadge />`, `<RoundedShell />`, `<BottomTabBar />`).
- **Color tokens.** Exact hex values from `Brand_Guide §2` and `Design_System §2.1`. Use Tailwind v4 `@theme` in `app/globals.css`. shadcn CSS var names (`--color-background`, `--color-primary`, …) are non-negotiable.
- **Panel radius is 12px** (`--radius-lg`). Outer shell is edge-to-edge (Layer 0 dropped the rounded inset and the cream frame).
- **Typography.** Inter (UI), Fraunces (display + phase narration), JetBrains Mono (IDs).
- **Surface language.** "films" not "credits" in user-facing UI. "Start your film," "Reshoot this scene," "Take it home," "Keep it"/"Delete it." See `Brand_Guide §5.4`.
- **Never write.** `Oops`, `Something went wrong`, `Generate`, `Magical`, `Seamless`, `Simply`, `AI-powered`, emoji in product copy.
- **Backend state enum** (12 values) is the single source of truth for phase: `pending`, `parsing`, `cie_building`, `character_refs`, `scene_images_pending`, `voice_synthesis`, `music_composition`, `scene_assembly`, `final_concat`, `complete`, `error`, `canceled`. Lives in `src/types/film-state.ts`.
- **Accessibility.** WCAG 2.2 AA. 44×44 touch targets. Respect `prefers-reduced-motion`.
- **NUMERIC(8,2) end to end** — never cast balances to `float`. Use string or a `Decimal`-like wrapper on the client.

## Working style

- Work directly on `main` unless a feature warrants a branch. There is no team to coordinate with — branch only for risk-isolation, not process.
- Commits are mine to make; don't proactively run `git commit`/`add`/`push`. Read-only git is fine.
- For destructive operations (`reset --hard`, `branch -D`, `push --force`, deleting tracked files), confirm before acting.
- Read the affected files before writing. The repo is small enough that grep + read beats guessing.
- For UI work, the user verifies in the browser; don't claim visual correctness from code alone.
