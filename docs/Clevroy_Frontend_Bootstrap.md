# Clevroy Frontend Bootstrap

**Owner:** Stratum • **Created:** 2026-04-25 • **Status:** Plan-of-record before S1–S10 begin.

The point of this doc is to get auth, types, the API contract, state, and payments out of the "stub" stage and into something the rest of the team can build the real product against. It is the tactical companion to `Clevroy_Dev_Overview` (mental model) and `Clevroy_Backend_Handoff` (server contract).

If you are not Stratum, you mostly need §1 (what's already locked), §6 (payment provider decision), §7 (pricing), and §9 (the order things come online).

---

## 1. What is already locked

These are not up for re-discussion. Treat them as fixed facts when planning.

- **Server-state library:** TanStack Query v5. Hook signatures are shipped under `src/hooks/use-films.ts`, `use-billing.ts`, `use-twins.ts`, `use-film-realtime.ts`. Implementations land in S5–S7.
- **API contract types:** `src/types/api.ts` is canon for every Backend_Handoff §8 route. `Film*` shapes live in `src/types/film.ts` (Leon's). `FilmState` lives in `src/types/film-state.ts` (Leia's).
- **Money:** `Credits` is a string alias for NUMERIC(8,2). Never coerce to `number` for math. Display formatting at the leaf is fine.
- **Error envelope:** wire shape is `{ error: { code, message, details } }`. Client throws `ApiError(status, code, message, details)`. UI branches on `err.code` against the `KnownErrorCode` union.
- **UI state library:** Zustand. Existing store: `src/stores/ui-store.ts`. New stores only when TanStack Query genuinely cannot model the state (rare).
- **Auth provider:** Supabase Auth. The backend already issues + validates the JWT; the frontend only attaches it.
- **Realtime provider:** Supabase Realtime. REST is the source of truth. Realtime is notification only (Backend_Handoff §10.11).

---

## 2. Auth — the architecture

Supabase Auth is the provider. The frontend's job is: gather credentials, hold the session, attach the JWT to every API call, and route the user based on `Profile.onboarding_completed_at`.

### 2.1 Session storage and SSR

Next 15 App Router with the `@supabase/ssr` package. Two clients live side-by-side:

- `src/lib/supabase/browser.ts` — `createBrowserClient` for client components.
- `src/lib/supabase/server.ts` — `createServerClient` for Server Components, Route Handlers, and middleware. Reads/writes cookies via `next/headers`.

Session lives in **httpOnly cookies**, refreshed by Next middleware (`middleware.ts` at the repo root) on every request that hits the `(app)` segment. This gives us:

- SSR access to `auth.getUser()` for the server-rendered shell so first paint is correctly authed (no flash of public content).
- A single source of truth for the JWT — the API client reads it from the same cookie store.
- Capacitor compatibility — the WebView reads the same cookies from the embedded server.

### 2.2 Capacitor deep links

Capacitor v7 wraps the web build for iOS/Android. Email-confirmation and OAuth callbacks need a registered URL scheme that resolves both in the browser and inside the WebView.

- Universal link in production: `https://app.clevroy.com/auth/callback`.
- Custom scheme fallback for native: `clevroy://auth/callback` (registered in `capacitor.config.ts`'s `appId`).
- Supabase project's "Site URL" + "Redirect URLs" allowlist must include both.
- The `/auth/callback/route.ts` Route Handler exchanges `code` → session and redirects to `/onboarding` or `/home` based on `onboarding_completed_at`.

### 2.3 Middleware gate

`middleware.ts` runs before every request to `/(app)/*`:

1. Refresh the Supabase session cookie.
2. If unauthed → redirect to `/sign-in?next=<original-path>`.
3. If authed but `onboarding_completed_at` is null → redirect to `/onboarding`.
4. Otherwise let the request through.

This is the only place onboarding-gating happens. No layout, no page should re-check.

### 2.4 Auth UI

shadcn-first per CLAUDE.md. Hand-rolled forms using `Form`, `Input`, `Label`, `Button`, `Card`. Routes:

- `app/sign-in/page.tsx` — email + password, "Send magic link" secondary action.
- `app/sign-up/page.tsx` — email + password, ToS checkbox.
- `app/auth/callback/route.ts` — code exchange handler.
- `app/sign-out/route.ts` — POST clears the session and redirects to `/sign-in`.
- `app/onboarding/` — already scaffolded by Ghost (single-route step machine, see coordination 2026-04-25). Stratum wires `POST /api/me/onboarding` from the final step.

Brand voice rules apply to every error string. Map Supabase auth errors to `copy.ts` entries — never surface raw provider strings.

---

## 3. Types and the API contract

Already 90% done. What remains:

- **Generated types:** when the backend ships its pydantic-to-typescript pipeline (Dev_Overview §5.6), `src/types/api.ts` migrates wholesale to `@clevroy/types`. Until then, `api.ts` is hand-maintained against Backend_Handoff §8. Any drift is a bug — fix `api.ts`, not the consumer.
- **Open contract questions:**
  - `useDuplicateFilm` has no backend route yet (flagged to Roy 2026-04-24). Drop or implement.
  - `EC-G4 "Continue without it"` has no endpoint (flagged by Kaiser). Same call.
  - `KnownErrorCode = "scene_already_reshooting"` — confirm exact string with backend.

These do not block S1–S5.

---

## 4. The API client (`src/lib/api/client.ts`, S5)

A single typed `fetch` wrapper. Keep it under 200 lines.

### Responsibilities

1. **Base URL** from `NEXT_PUBLIC_API_BASE_URL`.
2. **Auth header** — read JWT from the active Supabase client (browser or server), attach as `Authorization: Bearer <jwt>`. Never pass the JWT through props or context.
3. **Request body** — JSON-encode unless the caller passes `FormData` (used for direct-to-R2 uploads — though those bypass our API entirely).
4. **Response decode** — JSON unless the response is empty (`204` or `202`).
5. **Error mapping** — on non-2xx, parse the envelope, throw `new ApiError(status, code, message, details)`. On non-JSON error bodies (5xx HTML error pages, network failures), throw `ApiError(status, "unknown", "...")` with a brand-voice fallback string from `copy.ts`.
6. **Idempotency keys** — accept an optional `idempotencyKey` option, attach as `Idempotency-Key` header. The hook layer mints UUIDs (`crypto.randomUUID()`) per click for cancel and reshoot (EC-G6, EC-G8).
7. **AbortSignal** passthrough — TanStack Query passes one in for cancellation.

### Non-responsibilities

- **No retries** — TanStack Query handles retry policy at the query layer. Baking retries into the client double-counts.
- **No caching** — same reason.
- **No global state** — the client is stateless. JWT is read fresh each call from the Supabase client.
- **No logging in production** — dev-only `console.error` on `ApiError`. Sentry hookup is Ghost's lane.

### Shape

```ts
// src/lib/api/client.ts
export interface ApiOptions {
  signal?: AbortSignal;
  idempotencyKey?: string;
}

export const api = {
  get<T>(path: string, opts?: ApiOptions): Promise<T>,
  post<T>(path: string, body?: unknown, opts?: ApiOptions): Promise<T>,
  patch<T>(path: string, body?: unknown, opts?: ApiOptions): Promise<T>,
  delete<T>(path: string, body?: unknown, opts?: ApiOptions): Promise<T>,
};

export function mintIdempotencyKey(): string {
  return crypto.randomUUID();
}
```

The hooks in `use-films.ts` swap their fixture `queryFn` bodies for `() => api.get<Film>(\`/api/films/\${id}\`)` calls — one-line changes.

---

## 5. State management

### 5.1 Server state — TanStack Query

Already wired. Default options at the provider:

```ts
{
  queries: { staleTime: 30_000, retry: (count, err) => err.status >= 500 && count < 2 },
  mutations: { retry: false },
}
```

`staleTime: 30s` keeps the sidebar/balance from refetching on every focus. Mutations don't retry — idempotency keys protect the dangerous ones.

Query keys are centralized per hook file (`filmsQueryKeys`, `billingQueryKeys`, `twinsQueryKeys`). Other agents invalidate via these constants — never hand-craft a key string.

### 5.2 UI state — Zustand

`src/stores/ui-store.ts` already exists for ephemeral UI state (sidebar collapsed, modals open, toast queue overflow). New stores only when:

- The state is shared across unrelated component trees, AND
- It cannot be derived from a TanStack Query result.

### 5.3 Balance — derived, not duplicated

The earlier plan called for a `balance-store.ts` Zustand store. **Drop it.** `Profile.films_remaining` lives on the `useUser()` query result; the sidebar, Create page subline, and Buy-more button all read the same query via a selector:

```ts
const filmsRemaining = useUser().data?.films_remaining ?? "0.00";
```

EC-N7 is satisfied because every consumer reads the same query — TanStack Query's deduplication guarantees one in-flight request and one cached value. Realtime balance updates (after a Stripe webhook fires) invalidate `filmsQueryKeys.user()` from `useFilmRealtime` or a dedicated billing channel, and every consumer re-renders together. Single source of truth, zero new code.

If we later need optimistic balance updates (purchase mid-flight, refund landing before invalidate), revisit. Not for MVP.

---

## 6. Payments — Stripe vs Polar

The `BuyFilmsResponse` already returns `payment_url`. That means whichever provider we pick, the frontend just opens a hosted checkout in the browser (or the Capacitor in-app browser) and listens for the post-payment Realtime event to refresh `useUser()`. The provider choice is mostly a backend + business decision, but the frontend has a stake in the redirect/return UX.

### 6.1 Comparison

| Dimension | Stripe | Polar |
|---|---|---|
| **Fees** | 2.9% + $0.30 per transaction | 4% + $0.40 per transaction |
| **Tax compliance (MoR)** | Not by default. Stripe Tax adds 0.5%. EU/UK/US sales tax registration is on you unless you also use Atlas. | Merchant of Record by default. Polar handles VAT, UK VAT, US sales tax, registration, remittance. Zero ongoing tax work. |
| **Maturity** | Industry standard since 2010. Exhaustive docs, every framework integration, mature webhook tooling. | GA 2024, growing fast. Built specifically for digital products / SaaS. Open source. |
| **Hosted checkout** | Stripe Checkout — battle-tested redirect flow. Apple Pay, Google Pay, Link. | Polar Checkout — also redirect-based, hosted UI. Cards via Stripe under the hood (Apple Pay through Stripe). |
| **Webhook → credit grant** | Standard `checkout.session.completed` event. Backend grants credits, writes a `CreditTransaction(kind="purchase")`, Realtime fires. | Same model — `checkout.created` and `subscription.created` events. Same backend pattern. |
| **Capacitor** | In-app browser opens hosted page. Standard pattern. | Same. |
| **One-shot purchases (credit packs)** | Supported. Use Payment Links or Checkout Sessions. | Supported. First-class — Polar's native model is "buy a thing once." |
| **Subscription (future)** | First-class. | Supported, less mature than Stripe. |

### 6.2 The economic crossover

At our pack prices (see §7), an average purchase is roughly $40. Per transaction:

- **Stripe + Stripe Tax:** 2.9% + 0.5% + $0.30 = $1.66
- **Polar (MoR included):** 4% + $0.40 = $2.00

Polar costs **~$0.34 more per $40 transaction**. For that, you avoid:

- Registering for VAT in every EU country we sell into (the threshold is €0 for digital goods sold to consumers).
- Filing UK VAT quarterly.
- Tracking US state sales-tax economic nexus thresholds.
- Hiring an accountant or buying TaxJar/Avalara.

For a pre-launch indie team, the time and risk savings dwarf the fee delta. The crossover is roughly **$50k MRR**, where the 4% MoR overhead starts to matter more than ongoing tax compliance work.

### 6.3 Recommendation

**Start with Polar.** Reasons in priority order:

1. MoR removes a category of compliance work that none of the founding team should be doing in year one.
2. Native fit for one-shot digital purchases (our credit pack model exactly).
3. Open source and Vercel-friendly — first-class Next.js examples and a working AI Gateway integration story.
4. The fee delta is real but small at our scale.

**Switch to Stripe** when one of: revenue clears ~$50k MRR, we need richer subscription tooling than Polar offers, or we acquire a payments engineer. Migration is a backend change — frontend keeps redirecting to whatever URL the backend returns, no UI work needed.

**Open question for the team:** does anyone have a strong existing Stripe relationship (existing account, tax setup already done)? If yes, that flips the recommendation. Otherwise: Polar.

---

## 7. Credit pricing

### 7.1 Cost model recap

From `src/types/api.ts` and Backend_Handoff §8.6:

- 1 film = 1 credit (the surface word "films" maps to the `credits_remaining` column).
- Reshoot of a single scene = 0.20 credits when `reason: "user_initiated"`.
- Reshoot is **free** when `reason: "generation_failure"` (the system retries on its own dime — EC-G4).
- Signup grants a `signup_bonus` transaction. **Recommended:** 2 free films on signup. Enough to feel the product, not enough to stop people buying.

### 7.2 Pack pricing (proposed v1)

| Pack ID (in `CreditPack` enum) | Films | Price (USD) | Per-film | Discount vs Starter |
|---|---|---|---|---|
| `10_films` | 10 | **$9.99** | $1.00 | — |
| `50_films` | 50 | **$39.99** | $0.80 | 20% off |
| `100_films` | 100 | **$69.99** | $0.70 | 30% off |

### 7.3 Why these numbers

- **$1/film at the entry tier** is a clean anchor — easy to communicate ("one dollar per film, get more for less when you buy in bulk").
- **20% / 30% discounts** are the standard SaaS bulk-pricing curve; deeper discounts at the top tier signal commitment without giving away margin.
- **Reshoot at $0.20** keeps the cost of "fix this one scene" trivially below the cost of regenerating the whole film, which is the right product behavior.
- **2-film signup bonus** gives the user one full creation + one reshoot loop before paying. Validates the magic moment without unlocking serial freeloading.
- **Reference points:** Runway $15/mo for ~625 credits, Pika $10/mo basic, HeyGen $24/mo, Kling free + pay. We are positioned at the higher quality / lower volume end — appropriate given the two-pass image generation cost structure.

### 7.4 Surface language (Brand_Guide §5)

These are user-facing strings. Lock them in `copy.ts`:

- Pack names in UI: **Starter / Creator / Studio** (not "10/50/100 credits").
- Button: **"Buy more films"** (never "Top up", "Recharge", "Buy credits").
- Pack subtitle: **"10 films · $9.99"** (the dot is `·`, not `|`).
- Empty wallet CTA: **"You're out of films. Take one home or buy more."**

### 7.5 What needs deciding before launch

- **Currency:** USD only at launch, or also EUR/GBP? Polar handles multi-currency natively if we want it. Decision blocks copy + the Buy More page layout.
- **Refund policy on `cancel_film`:** Backend already supports a `refund_amount` on `CancelFilmResponse`. Confirm the policy: full refund if pre-image-gen, partial if mid-pipeline. Wire that into the cancel confirmation copy.
- **Signup bonus amount:** 2 is the recommendation. Roy may want different.

---

## 8. Realtime + reconnection (S7)

Already designed in `src/hooks/use-film-realtime.ts`. Implementation notes:

- One Supabase Realtime channel per visible film. Cleaned up on unmount.
- Reconnect backoff: 1s, 2s, 4s, 8s, max 15s.
- On `App.resume` (Capacitor) and `visibilitychange` → fire `reconcile()`, which re-fetches `GET /api/films/{id}/state` and `GET /api/me/activity/{film_id}` to backfill anything missed.
- Snapshot is the source of truth; Realtime payloads only trigger a merge.

The hook also owns invalidating `filmsQueryKeys.user()` when a balance-affecting Realtime event lands (purchase confirmed, cancel refund). That's how the balance stays consistent without a separate store.

---

## 9. Implementation order

Sequenced. Earlier items unblock later ones.

| Step | Owner | Deliverable | Blocks |
|---|---|---|---|
| **S1** | Stratum | `src/lib/supabase/{browser,server}.ts` | S2, S3 |
| **S2** | Stratum | `app/sign-in`, `app/sign-up`, `app/auth/callback`, `app/sign-out` | Real users |
| **S3** | Stratum | `middleware.ts` — session refresh + auth gate + onboarding gate | All `(app)` routes |
| **S4** | Leia (done) | Mounted `<QueryClientProvider />` in root layout | — |
| **S5** | Stratum | `src/lib/api/client.ts` — typed fetch wrapper, `mintIdempotencyKey()` | S6 |
| **S6** | Stratum | Replace fixture branches in `use-films.ts` with real `api.*` calls. Same for `use-billing.ts`, `use-twins.ts`. Keep `NEXT_PUBLIC_USE_HARDCODED=true` branches for offline dev. | Live build |
| **S7** | Stratum | `useFilmRealtime` implementation — channel subscription, REST catch-up, exponential backoff | Generation screen live |
| **S8** | — | (Dropped — balance is derived from `useUser()`, no store needed.) | — |
| **S9** | Stratum | Brand-voice mappings in `src/lib/copy.ts` for `KnownErrorCode` + provider error strings (CC-6) | Real-error UX |
| **S10** | Stratum | Polish — Sentry, request-id logging in dev, Capacitor App.resume wiring | Launch |

**Payments work** is mostly backend (webhook → credit grant). Frontend pieces:

- **P1** (parallel with S5): Buy-films flow — open `payment_url` from `useBuyFilms()` in a new tab (web) or Capacitor Browser (native).
- **P2** (after S7): Listen for purchase Realtime event → invalidate `filmsQueryKeys.user()` → balance updates everywhere.
- **P3**: Settings → Billing page — list `CreditTransaction[]` with running balance (Ghost's G7).

---

## 10. Out of scope for this doc

- **Capacitor build pipeline** — `Clevroy_Deployment_Guide`.
- **Component design** — `Clevroy_UI_Design_System` and `Clevroy_Global_Design_Rules`.
- **Per-phase generation UX** — Fantem and Nemi own this.
- **Backend internals** — `Clevroy_Backend_Handoff` is canonical.

---

## 11. Open questions for Axios

1. Polar vs Stripe — sign off on Polar for MVP (or override).
2. Pack pricing: $9.99 / $39.99 / $69.99 — sign off or counter.
3. Signup bonus: 2 films — sign off or counter.
4. USD-only at launch?
5. `useDuplicateFilm` — drop the hook (Leon hides the menu) or push backend (Roy) to ship the route?

Reply in `coordination.md` under the next Stratum entry. I'll start S1 in parallel — Supabase clients don't depend on any of the above.