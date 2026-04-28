# Clevroy Dev Overview

**Document purpose:** The complete mental model of Clevroy — what the system is, how it works, and **why** it's built this way. Written for full-stack developers who need to hold the whole system in their head before they start building. Read this first; the reference docs make sense afterwards.

**Audience:** Full-stack developers joining the project, plus current devs who need a refresher when they've been heads-down on one part of the system and want to zoom out.

**Status:** V1 — MVP beta. Weighted backend-heavy because that's where most of the build complexity lives. Frontend gets enough depth to explain how it interacts with the backend; the UI Design System doc covers the rest.

**How to read this:**
- **First time:** read straight through. Should take about 45 minutes. You'll come out understanding the whole system.
- **As a reference:** jump to the section that matches what you're working on. Each section is self-contained enough to make sense on its own.
- **Don't try to memorize it.** This is the mental model. Details live in the reference docs (Backend Handoff, UI Design System, etc.) and in the code itself.

---

## 1. What Clevroy Is

Clevroy turns scripts into watchable short films. A user pastes their writing — a paragraph, a page, or a full screenplay — picks a visual style, and within 3–10 minutes the system produces a finished MP4 with consistent characters across scenes, original voice acting, original music, and the option to download as a book PDF or static website.

That's the surface. The product's real claim is something more specific: **the user watches it being made**. While the film is generating, a center-stage screen on the Create page shows the work happening — the script being parsed, character portraits being cast, scenes being blocked, voices being recorded, the score being composed. Phase narration cycles in cinematic copy ("Reading your script…" → "Casting portraits…" → "Final cut…"). It feels like a director reviewing dailies from set, not a customer waiting for an export.

This is the product. Every architectural decision — three-service backend, Supabase Realtime streaming, the two-pass image generation pipeline, the rounded shell UI layout — exists to support that experience. When you're making decisions and the principles compete, the live-watching experience wins.

### Why this matters

Most "AI film" tools today work as queue-based batch generators: submit a job, get an email when it's done. They hide the work because the work is unreliable and the wait is boring. Clevroy bets the opposite direction — that watching the film come together **is** the value, not a tax on the user. The product positioning, the brand language ("Reshoot this scene" instead of "Retry"), and the technical architecture all reinforce this. Don't optimize against it.

---

## 2. The 90-Second Explanation of How the System Works

A user clicks "Start your film." The frontend POSTs the script to the backend's API. The API validates the user has at least 1 film of credit, debits the credit in a database transaction, creates a film row in the database with state `pending`, and enqueues a Celery task to start parsing. Returns the film ID. **Total elapsed: under 200ms.** The API has done its part.

The frontend, having received the film ID, navigates to the generation screen and subscribes to a Supabase Realtime channel for that film. From this point on, the frontend mostly listens.

A Celery worker picks up the parse task. It calls Google Gemini with the script and a structured-output prompt. Gemini returns JSON with the parsed scenes, characters, and dialogue lines. The worker writes those rows to the database and updates the film state to `cie_building`. Supabase broadcasts the state change. The frontend's center stage updates: the script appears, scrolling, with scene break markers highlighting in red as the parser identifies them.

The worker chains forward. It synthesizes character identities (CIE), then fans out — one task per character — to generate reference portraits via fal.ai. As each portrait completes, it's uploaded to Cloudflare R2, the database is updated, and the frontend's character grid populates one card at a time.

Once all character portraits exist, the system fans out again — one task per scene — to generate scene images. This is the **two-pass moment**: each scene image is generated using the character reference portraits as visual conditioning, so faces stay consistent across scenes. Single-character scenes use FLUX Kontext Pro; multi-character scenes use Nano Banana 2.

Then voice synthesis (one ElevenLabs call per dialogue line, in parallel). Then music composition (one ElevenLabs call for the soundtrack). Then scene assembly (ffmpeg combines image + voice + music into per-scene clips). Then final concatenation (ffmpeg stitches the clips into one MP4). The state advances through `voice_synthesis`, `music_composition`, `scene_assembly`, `final_concat`, and finally `complete`.

The frontend has been watching this whole time. When the state hits `complete`, the center stage transforms into a play button. The user clicks it, the frontend requests a signed R2 URL for the final video, and they watch the film they just wrote.

**Total wall-clock time:** typically 3–10 minutes. **Number of external API calls:** anywhere from 15 to 50+, depending on script complexity. **Number of database writes during the run:** dozens. **Number of Realtime broadcasts to the frontend:** also dozens. **Number of times the user has to refresh, retry, or check their email:** zero — that's the point.

---

## 3. The Tech Stack and Why Each Piece

The stack is locked. This section explains why each choice was made so you understand the constraints.

### 3.1 Backend stack

**Python 3.12** — the AI ecosystem (Gemini SDK, fal.ai SDK, ElevenLabs SDK, WeasyPrint, ffmpeg-python wrappers) is most mature in Python. JavaScript backends could work but every AI library is more battle-tested in Python.

**FastAPI** for the HTTP API — modern async Python framework with first-class Pydantic integration for request/response validation. Faster than Flask, more pythonic than Django for an API-only service. Type hints become the contract.

**Celery + Redis** for background work — the standard Python solution for distributed task queues. Redis is the broker (the queue itself) and the result backend. Celery handles retries, chaining, scheduling, and worker management. The alternatives (RQ, Dramatiq, Arq) are simpler but less battle-tested at scale.

**Supabase** for database, auth, and realtime — Postgres is the right database (relational, ACID, excellent JSON support). Doing your own auth is a months-long mistake; Supabase Auth handles signup, signin, password reset, OAuth providers, and JWT issuance for free. Supabase Realtime broadcasts Postgres row changes to subscribed clients over WebSockets, which is exactly what the live generation screen needs. Three problems solved by one vendor.

**SQLAlchemy + Alembic** for ORM and migrations — SQLAlchemy 2.0 is the mature Python ORM. Alembic is its migration tool. Together they let you write Python instead of raw SQL while keeping schema changes versioned and reversible.

**Cloudflare R2** for object storage — S3-compatible API, zero egress fees, much cheaper than AWS S3 for an app that serves a lot of media. Compatible with the boto3 library you'd use for S3, so the code is identical.

**Railway** for hosting — push-to-deploy, generous free tier for development, supports running multiple services from one repo (which you need for the API + worker + beat split), built-in Redis addon. The alternatives (Fly.io, Render, AWS) all work but add complexity you don't need at MVP.

**WeasyPrint** for PDFs — generates PDFs from HTML+CSS, which means you can write the book export in regular web technologies and let WeasyPrint render it. Replaced ReportLab (which requires you to position elements pixel-by-pixel in Python — much slower to iterate on).

**ffmpeg** for video assembly — the only realistic choice. Industry standard, handles every codec, called via subprocess from Python.

### 3.2 Frontend stack

**Next.js 15 App Router** — React's most mature framework, with server components, file-based routing, and excellent deploy story on Vercel. App Router (not Pages Router) is the current direction.

**React 18** with **Tailwind v4** — Tailwind v4's `@theme` syntax makes design tokens trivial to manage. The locked color/typography/spacing tokens flow directly from `Clevroy_Brand_Guide.md` into globals.css.

**shadcn/ui** for components — copy-paste component library built on Radix UI primitives. Not a dependency you install once and update; you copy the components into your repo and own them. This means full customizability and no version-lock issues. Pairs perfectly with Tailwind v4.

**Zustand** for client state — small, simple, no Redux ceremony. Used for theme preference, sidebar collapsed state, films balance, and not much else.

**TanStack Query** for server state — handles caching, refetching, optimistic updates, and infinite scroll. The right tool for "data that lives on the server and needs to be cached on the client."

**Framer Motion** for animations — only used in two places: the centralized generation screen (phase narration crossfade, scene strip state changes) and modal animations. Everywhere else uses native CSS transitions for performance.

**Vercel AI SDK** — for any streaming AI interactions on the frontend (mostly relevant for future features; minimal use in MVP).

**Capacitor v7** for mobile — wraps the Next.js app in a native iOS/Android shell. Same React components, same code, but with access to native APIs (haptics, push notifications, file system) and packaged as App Store / Play Store apps. The alternative — building separate native apps — is months of work for the same outcome.

### 3.3 The AI providers

**Google Gemini** — for script parsing and content quality validation. Fast, cheap, excellent at structured JSON output. We use the latest Gemini Flash variant for parsing because it's fast and the parsing task is well-suited to a smaller model.

**fal.ai** — for image generation. Specifically two models: **FLUX Kontext Pro** for single-character scenes (accepts one reference image) and **Nano Banana 2** for multi-character scenes (accepts multiple reference images). fal.ai hosts both behind a unified API. The two-model split is forced by the two-pass requirement: you need a model that respects multiple character references, and Nano Banana 2 is currently the best choice for that. **This is the most expensive part of generation** — typically 60–70% of total provider cost per film.

**ElevenLabs** — for voice synthesis AND music composition. ElevenLabs released their music endpoint relatively recently, which let us replace what was originally a Suno/AIMLAPI integration with a single vendor. One auth, one rate limit, one bill.

### 3.4 What we explicitly do not use

**Not LangChain** — adds abstraction we don't need. We call provider APIs directly with httpx. Simpler to debug, no version lock-in to LangChain's ecosystem.

**Not a vector database** — Clevroy has no semantic search use case. Every retrieval is by film ID or user ID, both relational lookups in Postgres.

**Not Kubernetes / Docker Swarm** — Railway's three-service deploy model is sufficient for MVP and well into the post-MVP phase. K8s is months of complexity for zero benefit at this scale.

**Not GraphQL** — REST is correct here. The API surface is small (under 30 endpoints), and the frontend's needs are predictable. GraphQL would add resolver complexity for no payoff.

**Not microservices** — three services, one repo. Microservices are a coordination tax that pays off only when you have multiple teams. You don't.

---

## 4. The Backend in Depth

### 4.1 Three services, one codebase

The backend is one Git repository deployed as three separate Railway services that share code:

**The API service** answers HTTP requests. It runs `uvicorn app.main:app`. It has access to the database and Redis but never makes external AI calls. Its job is fast read/write operations and enqueueing work. Every request returns in under 500ms or it's a bug.

**The Celery worker service** processes background tasks. It runs `celery -A app.celery_app worker`. It has access to the database, Redis, R2, and all external AI providers. It does the slow, expensive, failure-prone work: parsing, image generation, voice synthesis, video assembly. Multiple worker instances run in parallel to handle fan-out.

**The Celery beat service** is a tiny scheduler. It runs `celery -A app.celery_app beat`. It fires periodic tasks: cleaning up abandoned generations, deleting orphaned R2 files, purging soft-deleted films, verifying balance invariants. It must run as a single instance — running two beat schedulers would fire every scheduled task twice.

#### Why three services and not one

The work the API does (synchronous, fast, request/response-shaped) and the work the workers do (async, slow, retry-prone) have fundamentally different operational characteristics. Running them in the same process means a slow generation task blocks an API request, or an API memory leak takes down the worker. Separating them lets each scale independently — when generation load spikes, you add more workers without scaling the API; when signup load spikes, you add more API instances without touching workers.

The single repo means they share models, services, and provider clients. Code reuse is high; deployment isolation is also high. Best of both.

### 4.2 The async/sync boundary

This is the most common source of bugs for developers new to this stack. **FastAPI is async; Celery is sync.** Don't mix them inside a single function.

In API endpoints, use `async def` and `await` for I/O operations:

```
@router.post("/films")
async def create_film(payload: CreateFilmRequest, db: AsyncSession = Depends(get_db)):
    film = await film_service.create(db, payload)
    return film
```

In Celery tasks, use regular `def` — no async:

```
@celery_app.task
def parse_script(film_id: str):
    with session_scope() as db:
        film = db.get(Film, film_id)
        result = gemini_client.parse(film.script_text)  # sync call
        ...
```

If you need to call an async library inside a Celery task (rare, but it happens — some SDKs are async-only), wrap it with `asyncio.run()` at the task boundary:

```
@celery_app.task
def some_task(arg):
    result = asyncio.run(async_helper(arg))
    # rest of task is sync
```

#### Why this rule matters

Mixing async and sync inside the same function is the classic cause of "my task hangs forever" or "my API connection pool is exhausted" bugs on this stack. Async code yields control back to an event loop; sync code holds it. A sync function that awaits an async coroutine blocks the entire event loop. An async function that calls a long-running sync operation blocks every other request handled by that worker. Keeping them on opposite sides of the API/Celery boundary is the simplest discipline that prevents both bugs.

### 4.3 The database design

Eight tables drive everything. The full SQL with types and indexes lives in `Clevroy_Backend_Handoff.md` §7; here's the conceptual map:

**`auth.users`** — managed by Supabase Auth. We don't write to this directly. We reference it as a foreign key.

**`user_profiles`** — Clevroy's per-user data. Display name, balance (`credits_remaining` as `NUMERIC(8,2)`), theme preference, AI Twin training status. Linked 1:1 to `auth.users`. A database trigger creates a row here automatically when someone signs up, with `credits_remaining = 5.00` (the free films).

**`films`** — the top-level film record. One row per generation attempt, including canceled and errored ones. Holds the script text, style preset, aspect ratio, current state, debit amount, and R2 keys for the final video, music track, and cover image.

**`scenes`** — children of a film. One row per scene the parser identified. Holds the visual description (used for image generation prompt), the R2 key for the scene image, and the R2 key for the assembled scene video clip.

**`characters`** — also children of a film. One row per character the parser identified. Holds the character's name, the synthesized CIE description (used for the Pass 1 reference portrait prompt), the R2 key for the reference portrait, and the assigned ElevenLabs voice ID.

**`dialogue_lines`** — children of scenes, with a foreign key to characters. One row per dialogue line in a scene. Holds the spoken text and the R2 key for the synthesized voice MP3.

**`api_call_log`** — every external provider call gets logged here. Provider name, model, request size, response size, latency, cost in USD (calculated at insert time from a rate table). Used for cost tracking, debugging, and reconciling user complaints.

**`credit_transactions`** — every change to a user's balance goes through here. Signup bonus, purchase, film debit, regen debit, refunds, admin adjustments. Each row records the amount and the balance after that transaction. The sum of all transactions for a user must equal their `credits_remaining` — this invariant is verified nightly.

**`dead_letter_queue`** — when a Celery task fails terminally (all retries exhausted), it lands here with the full task context and traceback. Used for operational triage.

#### Why this shape

The schema is normalized — film has many scenes, scene has many dialogue lines, etc. This makes the parse phase straightforward (it's just inserting rows into the right tables) and makes querying for the generation screen state fast (the frontend asks "what scenes does this film have?" and gets a clean list).

The API call log and credit transactions are append-only — never updated or deleted. This makes auditing trivial: every charge has a corresponding transaction row, every provider spend has a corresponding API call log row. When a user disputes a charge, you have the full receipt.

Row-level security (RLS) policies on Supabase enforce that users can only see their own data. The frontend uses the Supabase anon key, RLS handles authorization. The backend uses the service role key when it needs to bypass RLS for administrative operations (housekeeping, etc.). This means even buggy backend code can't accidentally leak user data — Postgres won't let it.

### 4.4 The state machine

A film moves through a strict, forward-only sequence of states. This is the canonical enum, used by the backend, the frontend's center-stage narration, the QA stress tests, and the activity feed:

```
pending → parsing → cie_building → character_refs → 
scene_images_pending → voice_synthesis → music_composition → 
scene_assembly → final_concat → complete

(any state) → error
(any state) → canceled
```

Each state corresponds to a Celery task (or a set of parallel tasks for fan-out phases). The task that runs while a film is in state X is the task that transitions the film to state X+1 on success. State transitions are guarded — `UPDATE films SET state = 'voice_synthesis' WHERE id = $1 AND state = 'scene_images_pending'`. If the WHERE clause fails (because the state is unexpectedly different), the update silently does nothing and the task can detect that and abort. This prevents race conditions where two workers race to advance the same film.

States never go backwards. If you find yourself wanting a "back to parsing" state, you actually want a new state with a different name, not a reverse transition. The forward-only rule is what makes the state machine debuggable — you can always look at a film's current state and know exactly where in the pipeline it is.

#### Why state-machine-driven

The alternative would be to track progress with a percentage or a simple "in progress / done" flag. We don't, because:

1. The frontend needs to know **which phase** to show on the center stage, not just "X% done." A percentage doesn't tell you whether to render the script-parsing animation or the voice-waveform animation.
2. Different phases fail in different ways. Knowing "we failed in `voice_synthesis`" is more useful than knowing "we failed at 60%."
3. Refund math depends on which phases ran. Canceling during `parsing` refunds 100%; canceling during `final_concat` refunds 0% (everything else has already been spent). The state tells us exactly what phases ran.
4. The activity feed needs the state name to format event descriptions naturally.

The state machine is the spine of the whole system. Reference docs should always use these state names verbatim — never paraphrase them.

### 4.5 Idempotency and the "run twice safely" principle

Every Celery task must be safe to run twice. Celery's delivery guarantee is **at-least-once**: tasks can be retried, redelivered, or duplicated under various failure conditions. If your code assumes "this task runs exactly once," you'll have bugs.

The pattern: every task is keyed by a stable identifier (film ID, scene ID, character ID, etc.). Before doing work, the task checks whether the work has already been done. If yes, it exits early with success. If no, it does the work.

For example, `generate_character_ref(character_id)` should:

1. Look up the character.
2. If `character.reference_image_key` is already populated, exit successfully — the work is already done.
3. Otherwise, call fal.ai, upload the result to R2, write the key to the database, exit.

If this task is run twice (because Celery redelivered it after a worker crash), the second run sees the populated key and exits without making a second fal.ai call. No double-billing, no duplicate uploads, no corrupted state.

The corollary: **upload first, write second**. When a task generates a file, the order is always (1) generate the file, (2) upload to R2, get back a key, (3) write the key to the database row. Never the reverse. If the upload fails, the database is consistent — no row points to a missing file. If the database write fails after a successful upload, the file is an orphan that the cleanup task finds and deletes.

#### Why this matters specifically for AI calls

External AI calls are expensive (cents per call) and slow (seconds to minutes). A task that retries because of a transient error can easily double-bill the user and double-spend on provider costs if it doesn't check first. Idempotency is what prevents the system from spending unpredictable amounts of money under normal failure conditions.

### 4.6 The two-pass image generation, in detail

This is the technical bet that makes Clevroy's films actually watchable. Worth understanding deeply.

**Pass 1: character reference portraits.** For each character identified during the parse phase, the system generates a reference portrait — a clean, headshot-style image of that character against a neutral background. The prompt for this image is the synthesized CIE description: appearance, clothing, age, ethnicity, distinguishing features. The model used is fal.ai's FLUX Kontext Pro with no reference inputs. The portrait gets uploaded to R2; its key is stored on `characters.reference_image_key`.

**Pass 2: scene images.** For each scene, the system generates the scene's image. But the prompt isn't just the scene description — it includes the reference portraits of the characters who appear in that scene as visual conditioning. The model used here is:

- **FLUX Kontext Pro** if the scene has exactly one character (it accepts one reference image).
- **Nano Banana 2** if the scene has two or more characters (it accepts multiple reference images).

The scene image generated in Pass 2 shows the same characters from the reference portraits, in the new scene's setting, performing the scene's action.

**Result:** the woman who was generated in scene 1 looks like the same woman in scene 7, even though those are independent generation calls. Without Pass 1, she'd be a slightly different woman in every scene — different face shape, different age, different clothing. Competing AI film tools don't do two-pass; their characters drift visibly. Clevroy's two-pass is the difference between "AI slideshow" and "AI film."

#### Why this is expensive

You're making N+M image calls where N is the number of characters and M is the number of scenes, instead of just M calls. For a film with 5 characters and 7 scenes, that's 12 fal.ai calls instead of 7 — about 70% more cost than a one-pass approach. The credit model in `Clevroy_Cost_Decisions.md` is built around this cost. **Do not skip Pass 1 to "optimize."** Every cost decision in the project assumes two-pass.

#### Why this is also slow

Pass 1 has to finish before Pass 2 can start (Pass 2 needs the reference portraits as inputs). This forces a synchronization point in the pipeline that you can't parallelize away. The phase pipelining optimization in `Clevroy_Backend_Handoff.md` §13.6 partially addresses this (a scene can start as soon as **its** characters' references are done, not all of them) but full Pass 1 still gates full Pass 2.

### 4.7 The provider call discipline

Every external AI call follows the same pattern:

1. **Check the circuit breaker** for that provider. If tripped, fail fast without making the call.
2. **Insert an `api_call_log` row** with status `retry` (we use "retry" for "in-flight"). Capture the input details.
3. **Make the HTTP call** with httpx, with a timeout and retry policy.
4. **Update the `api_call_log` row** with the response: status (`success` or `failure`), latency, response size, cost in USD.
5. **Use the result** in the task's continued logic.

The reason for inserting the log row **before** the call is that if the worker dies mid-call (crash, OOM kill, network drop), there's still a record that the call was attempted. Without this, you'd have phantom spend that doesn't appear in any log. Inserting first, updating after, means the log always reflects reality.

The circuit breaker is shared across all workers via Redis. When fal.ai (for example) returns 5 consecutive failures, the breaker trips. Subsequent calls fail immediately for 60 seconds without hitting the provider. After 60 seconds, the breaker half-opens and tries one call — success closes the breaker, failure restarts the cooldown. This prevents one provider's outage from cascading into worker exhaustion across the whole system.

Cost is calculated at insert time using a rate table (per-provider, per-model). The rate table is a config file (or a database table — either works). When provider pricing changes, you update the rate table once and all future logging is correct.

### 4.8 Failure modes and recovery

Single-scene failures don't kill the film. If scene 4's image generation fails after retries, the film transitions to an `error` state with `state_error_reason = 'scene_4_image_failed'`. The frontend shows the error phase: the last successful scene holds on the center stage, scene 4's pill turns red, and the user sees "Reshoot scene 4" as a primary action. Reshooting just that scene (free, because it was a generation failure) doesn't cost the user another film and doesn't re-run the rest of the pipeline. If they choose "Continue without it," the film is assembled with a 1-second black intertitle for scene 4 and marked as "Incomplete" in the user's projects.

Total provider outages refund the user automatically. If fal.ai is fully down, the circuit breaker trips after 5 failures, the film transitions to `error`, the credit gets refunded via a `credit_transactions` row of kind `refund_full`, and the user sees a friendly message (not a stack trace).

Cancellations partially refund. The phases that have already run consume their credits; the phases that haven't yet run are refunded. The breakdown lives in `Clevroy_Cost_Decisions.md`. The frontend shows the user how much was refunded ("Stopped. 0.7 films refunded to your balance").

The Dead Letter Queue catches terminally failed tasks. A Celery `task_failure` signal handler writes a row to `dead_letter_queue` with the task name, args, traceback, and film ID. This isn't user-facing in MVP — it's operational tooling for the engineer triaging "why did this film fail?"

#### Why this much failure handling

Every external API call is a potential failure point. Five providers, dozens of calls per film, thousands of films per week — without explicit failure handling, you'd have an alarming percentage of films just hanging or vanishing. The architecture assumes that **failures are normal**, not exceptional. The DLQ, the circuit breakers, the partial refunds, the per-scene reshoot path — these aren't paranoia, they're the cost of running a long-running multi-provider pipeline in production.

---

## 5. The Frontend in Depth (Lighter, but Enough)

The frontend is a Next.js 15 App Router app. The full design specifications are in `Clevroy_UI_Design_System.md`. This section explains how the frontend interacts with the backend and what makes it different from a typical web app.

### 5.1 The rendering model

App Router defaults to React Server Components — components rendered on the server and streamed to the client. This is good for performance but limits where you can use hooks, state, and event handlers. Most of Clevroy's interactive components are client components (`"use client"` directive). The pages themselves are mostly server components that fetch initial data and pass it to client components for interactivity.

### 5.2 State management split

Two state systems, with clear roles:

**Zustand** for client-only state — theme preference, sidebar collapsed/expanded, the current films balance (mirrored from server but updated optimistically), reduced-motion toggle. State that doesn't need to sync with anything else.

**TanStack Query** for server state — the films list, individual film details, character lists, dialogue lines, export task statuses. State that lives canonically on the server and needs to be cached on the client. TanStack Query handles refetching, optimistic updates, infinite scroll for the Projects page, and cache invalidation when mutations succeed.

This split keeps the two concerns separate: "is the sidebar open?" doesn't need server logic; "what films does this user have?" does.

### 5.3 The Realtime subscription

The defining frontend pattern is the Realtime subscription on the generation screen. When the user starts a film, the frontend:

1. Calls `POST /api/films` to create the film and get back a `film_id`.
2. Navigates to the generation screen.
3. Subscribes to a Supabase Realtime channel filtered to that film: `films:id=eq.{film_id}`.
4. Also subscribes to a channel for the film's scenes (so scene strip updates as scenes complete).
5. Listens for state changes and renders accordingly.

The Realtime broadcast carries the new row data (Supabase's `REPLICA IDENTITY FULL` setting on the films table ensures the full updated row is broadcast, not just the primary key). The frontend uses the broadcast as a **notification** — "something changed" — and either trusts the broadcast payload (for simple state updates) or refetches via REST for complex updates.

The fallback is the `GET /api/films/{film_id}/state` endpoint. If the WebSocket disconnects (network drop, app backgrounded, device sleep), the frontend reconnects and immediately calls this endpoint to catch up to current state. It's how `Clevroy_UX_Edge_Cases.md` EC-G1 (mobile lock-and-resume) works.

### 5.4 The center-stage screen

This is the most complex single component in the whole app. It's not a video player — it's a phase-aware content surface that changes its rendering based on the current film state.

When state is `parsing`: it shows the script auto-scrolling with scene break markers highlighting as Gemini's parser identifies them.
When state is `cie_building` or `character_refs`: it shows a grid of character cards, populating with portraits as Pass 1 completes.
When state is `scene_images_pending`: it shows the current scene's image full-bleed with a ken-burns zoom.
When state is `voice_synthesis`: it shows the current scene image at 60% opacity with a waveform visualization overlaid.
When state is `music_composition`: it shows a wider waveform with all scene images cycling behind it at 40% opacity.
When state is `scene_assembly`: it plays the assembled scene clip in a small player.
When state is `final_concat`: it shows a strip of scene thumbnails with a scrubbing playhead.
When state is `complete`: it shows the first frame as a poster with a play button overlay.
When state is `error`: it holds the last successful scene with a red corner badge and a reshoot CTA below.

Each of these is a separate sub-component. The center stage is a switch on the current state that renders the appropriate one. The transition between states is a 450ms crossfade (Framer Motion).

#### Why this much variety

A single "loading spinner" or "progress bar" on the generation screen would defeat the entire purpose of the product. The variety is the value. The user gets specific visual feedback for each phase, which makes the wait feel like a performance instead of latency. Designing this took significant thought; implementing it is straightforward once the state machine and the Realtime subscription are working.

### 5.5 The mobile story

The same React app runs in three contexts:
- Web browser (desktop and mobile)
- iOS native app (via Capacitor)
- Android native app (via Capacitor)

Capacitor wraps the Next.js app in a native WebView shell and exposes native APIs (haptics, push notifications, file system access, app lifecycle events) to JavaScript. From the React code's perspective, you're calling Capacitor's JavaScript SDK; it's just that the SDK has different implementations on each platform.

The mobile experience differs from the web experience in specific ways: the sidebar becomes a bottom tab bar with an elevated red Create button in the center; the generation screen reshuffles its zones vertically; safe-area insets are respected on notched phones; haptic feedback fires on the Create button tap. These differences are handled in the components themselves via media queries and Capacitor platform detection — there's no separate mobile codebase.

The build pipeline for mobile: `npx cap sync` updates the iOS and Android projects, then they're built normally with Xcode (iOS) and Android Studio. GitHub Actions can produce signed builds for App Store / Play Store submission. For MVP beta, the mobile apps may not ship initially — web first, mobile second is a reasonable phasing.

### 5.6 The shared types package

The backend and frontend share TypeScript types via a small npm package called `@clevroy/types`. The package contains types for:
- The 12-state generation state enum
- The API request/response shapes for every endpoint
- The Realtime event payload shapes
- The Pydantic-validated form shapes (Create film, profile update, etc.)

Critically, **these types are generated from the backend's Pydantic models**, not hand-written. A script in the backend repo runs `datamodel-code-generator` (or `pydantic-to-typescript`) against the models and outputs `.d.ts` files. Those files get committed to the types package and published to a private npm registry (or GitHub Packages).

The frontend installs `@clevroy/types` as a regular dependency. Backend changes that alter a Pydantic model trigger a CI workflow that regenerates the types package. The frontend's TypeScript compilation then catches any mismatches at build time, before they hit production.

#### Why this is worth the setup effort

Without the types package, the contract between frontend and backend is documented in prose (in `Clevroy_Routing_Flow.md` and `Clevroy_Backend_Handoff.md` §8). Prose drifts. A backend dev renames a field from `credits_remaining` to `films_remaining`; the frontend keeps using `credits_remaining`; the bug appears at runtime in production.

With the types package, that rename causes the frontend to fail compilation. The bug is caught seconds after the backend PR is merged, not weeks later in production. For a project with parallel development streams (backend by you, frontend potentially by other devs), this is the single highest-value integration investment you can make.

---

## 6. The Generation Pipeline, Step-by-Step

This is the heart of the product. Walking through every phase with the technical detail you need to actually implement or debug each one.

### 6.1 Phase 1 — Parsing

**Trigger:** API endpoint `POST /api/films` enqueues `parse_script.delay(film_id)`.

**What happens:** The `parse_script` task loads the film, reads the script text, calls Gemini with a structured-output prompt that asks for JSON with this rough shape:

```
{
  "scenes": [
    {
      "scene_number": 1,
      "description": "visual description of the scene",
      "location": "INT. DINER - NIGHT",
      "time_of_day": "night",
      "dialogue": [
        {"character": "MAYA", "line": "Where have you been?"},
        ...
      ]
    },
    ...
  ],
  "characters": [
    {"name": "MAYA", "description": "early 30s, dark hair, tired eyes"},
    ...
  ]
}
```

The task validates the JSON, then writes:
- N rows to the `scenes` table
- M rows to the `characters` table
- K rows to the `dialogue_lines` table (linked to scene + character)

Then transitions the film state to `cie_building` and enqueues `build_cie.delay(film_id)`.

**Failure modes:** Gemini returns malformed JSON (the prompt should make this rare; the task validates and retries with a "fix the JSON" prompt up to 2 times). Gemini is rate-limited or down (circuit breaker handles this). The script is too long or too short (validate at API entry, not in the task).

**Cost:** A few cents per film.

### 6.2 Phase 2 — CIE building

**Trigger:** `build_cie.delay(film_id)` enqueued by the parse task.

**What happens:** Reads all characters for the film. For each character, calls Gemini again with a prompt that synthesizes a "Character Identity Entity" — a dense, prompt-ready description of the character's appearance optimized for image generation. This is more elaborate than the parse-phase character description; it includes specific visual details (hair color, clothing style, build, distinguishing features) phrased in language that image models respond well to.

Stores the result in `characters.cie_description`. Once all characters have CIE descriptions, transitions the film state to `character_refs` and enqueues one `generate_character_ref.delay(character_id)` task per character.

**Why this is a separate phase:** The parse phase is about extracting structure from prose. The CIE phase is about generating the right kind of prompt for the next step. Separating them means each task does one thing well.

### 6.3 Phase 3 — Character reference portraits (Pass 1)

**Trigger:** `generate_character_ref.delay(character_id)` enqueued for each character.

**What happens:** The task calls fal.ai FLUX Kontext Pro with the character's CIE description as the prompt. No reference images. The output is a single portrait image (typically 1024x1024) of just that character, centered, against a clean background.

The image is downloaded to a temp directory, then uploaded to R2 with a key like `characters/{character_id}/reference.png`. The R2 key is written to `characters.reference_image_key`. The character's state moves from `cie_built` to `ref_ready`.

After each character ref task finishes, an atomic counter check on the film row determines if all characters are done. The last character to complete its ref triggers the transition to `scene_images_pending` and enqueues the scene image tasks.

**Failure modes:** fal.ai timeout or rate limit (retried with backoff). Generated image fails content moderation (rare; logged and the character is marked failed; the film errors with a specific reason). R2 upload failure (retried separately).

**Cost:** A few cents per character. For a 4-character film, this phase costs roughly 10–15 cents.

### 6.4 Phase 4 — Scene images (Pass 2)

**Trigger:** `generate_scene_image.delay(scene_id)` enqueued for each scene after all character refs are ready.

**What happens:** This is the most architecturally important phase. The task:

1. Loads the scene and identifies which characters appear in this scene (by joining through dialogue_lines).
2. Decides which model to use:
   - 1 character → FLUX Kontext Pro (single reference image)
   - 2+ characters → Nano Banana 2 (multiple reference images)
3. Downloads the relevant character reference portraits from R2 to the task's temp directory.
4. Calls fal.ai with the chosen model, the scene description as the prompt, and the reference portraits as conditioning inputs.
5. Receives the generated scene image, uploads to R2, writes the key to `scenes.image_key`.

The result is a scene image where the characters look like their reference portraits. Maya in scene 7 has the same face as Maya in scene 1.

After each scene task completes, the same atomic counter logic transitions the film to `voice_synthesis` when all scenes have images.

**Failure modes:** Same as Pass 1 plus a more interesting one — sometimes the model returns an image where the characters don't actually resemble the references. We don't try to detect this automatically (Gemini-based quality validation is a possible future feature). For MVP, we trust the model.

**Cost:** This is the most expensive phase. Roughly 5–10 cents per scene depending on model choice. A 7-scene film costs 35–70 cents just for Pass 2.

### 6.5 Phase 5 — Voice synthesis

**Trigger:** `synthesize_voice_line.delay(dialogue_line_id)` enqueued for each dialogue line.

**What happens:** The task loads the dialogue line and the speaking character. Looks up the character's assigned voice ID (assigned during CIE based on `voice_gender`, or overridden to the user's voice twin if `films.use_voice_twin` is true and the character is the protagonist).

Calls ElevenLabs with the voice ID and the line text. Receives an MP3. Uploads to R2 with a key like `dialogue_lines/{line_id}.mp3`. Stores the R2 key and the audio duration in the database.

After all dialogue lines have audio, transitions to `music_composition`.

**Voice assignment heuristics:** Characters with male names (or labeled male in the parse) get male voices from a curated ElevenLabs voice list. Female names → female voices. Ambiguous → a default neutral voice. If the user has a trained voice twin and `use_voice_twin=true`, the protagonist (most dialogue lines) uses the twin; supporting characters use the curated voices.

**Cost:** Per-line. Typical short film has 30–60 dialogue lines. A few cents total for this phase.

### 6.6 Phase 6 — Music composition

**Trigger:** `compose_music.delay(film_id)` enqueued after voice synthesis completes.

**What happens:** Calculates the total film duration from the sum of dialogue line durations plus per-scene buffer time. Calls ElevenLabs' music endpoint with the style preset (cinematic, animated, documentary, noir, etc.) and the target duration. Receives an MP3. Uploads to R2, writes the key to `films.music_key`.

Transitions to `scene_assembly`.

**Why one music track for the whole film:** Generating per-scene music is expensive and produces tonally inconsistent results. One unified track that ducks under dialogue feels more like a real film score than a per-scene music montage.

**Cost:** A handful of cents per film.

### 6.7 Phase 7 — Scene assembly

**Trigger:** `assemble_scene.delay(scene_id)` enqueued for each scene.

**What happens:** This is where ffmpeg enters. The task:

1. Downloads the scene image, the dialogue lines for that scene (in order), and the relevant segment of the music track to a temp directory.
2. Constructs an ffmpeg command that:
   - Uses the image as the visual (with optional ken-burns zoom for visual interest)
   - Layers the dialogue lines in time order
   - Mixes in the music segment, ducked by ~10dB during dialogue
   - Outputs an MP4 with locked codec, resolution, framerate, and audio sample rate (so the final concat can use stream copy)
3. Uploads the resulting clip to R2, writes the key to `scenes.clip_key`.

After all scenes are assembled, transitions to `final_concat`.

**Why locked output settings:** If every scene clip has identical codec parameters, the final concat phase can use ffmpeg's stream copy mode (no re-encoding), which is 5–10x faster than re-encoding. This is the optimization called out in `Clevroy_Backend_Handoff.md` §13.3.

**Failure modes:** ffmpeg crashes or returns a non-zero exit code. The temp files don't clean up (use `tempfile.TemporaryDirectory` context managers). The output file is malformed.

### 6.8 Phase 8 — Final concatenation

**Trigger:** `concat_final_film.delay(film_id)` enqueued after all scene assemblies complete.

**What happens:** Downloads all scene clips in order. Constructs an ffmpeg command using the concat demuxer with `-c copy` (stream copy, no re-encoding). Outputs the final film MP4. Uploads to R2 as `films.final_video_key`. Also extracts the first frame of the first scene as the cover image, uploads as `films.cover_image_key`.

Calculates and writes `films.duration_seconds`. Transitions to `complete` and writes `films.completed_at`.

This phase typically takes 3–5 seconds end-to-end with stream copy. With re-encoding, it would take 30+ seconds.

### 6.9 What the user sees during all this

The frontend's center stage and phase narration update with each state transition. The activity feed streams events as they happen. The scene strip pills fill in as scene images become ready. By the time `complete` fires, the user has been watching their film come together for several minutes — they don't see the play button as the start of value, they see it as the natural conclusion.

---

## 7. The Coordination Surfaces

For a team working on this in parallel, certain things are shared contracts. Knowing what they are matters more than the rest of the architecture.

### 7.1 The state machine enum

12 values: `pending`, `parsing`, `cie_building`, `character_refs`, `scene_images_pending`, `voice_synthesis`, `music_composition`, `scene_assembly`, `final_concat`, `complete`, `error`, `canceled`.

Used by:
- The backend (state transitions, task chaining, refund calculations)
- The frontend (phase narration, center stage rendering, scene strip states)
- The shared types package (TypeScript enum)
- The QA tests (every stress test references at least one state)

**Single source of truth:** the Pydantic model in the backend. All other usage is generated from it.

### 7.2 The database schema

Eight tables, locked. Schema changes are a serious operation that require:
1. Writing an Alembic migration
2. Testing on staging first
3. Coordinating any frontend types regeneration
4. Updating any docs that reference the schema

Migrations are **never** ad-hoc SQL. Always Alembic. Always reviewed.

### 7.3 The API surface

About 25 routes, grouped into auth-adjacent, user profile, films, regeneration, exports, billing, AI Twin, and health. Full details in `Clevroy_Backend_Handoff.md` §8 and `Clevroy_Routing_Flow.md`.

The shapes of every request and response are Pydantic models in the backend, generated as TypeScript types for the frontend.

### 7.4 The R2 key conventions

R2 keys follow a strict naming convention so that cleanup and debugging are trivial:

- `characters/{character_id}/reference.png`
- `scenes/{scene_id}/image.png`
- `scenes/{scene_id}/clip.mp4`
- `dialogue_lines/{line_id}.mp3`
- `films/{film_id}/music.mp3`
- `films/{film_id}/final.mp4`
- `films/{film_id}/cover.png`
- `users/{user_id}/voice_twin/{sample_id}.mp3`
- `users/{user_id}/face_twin/reference.png`

Convention: lowercase, slash-separated, type-suffixed extension, predictable from the database row. The orphan cleanup task can find unreferenced files by left-joining the database against R2 listings.

### 7.5 The Realtime channels

Supabase Realtime broadcasts row changes on subscribed tables. The frontend subscribes to:
- `films:id=eq.{film_id}` — for top-level film state changes
- `scenes:film_id=eq.{film_id}` — for per-scene state changes (used by the scene strip)

Other tables aren't published to Realtime in MVP (would be noisy and unnecessary).

---

## 8. The Brand-to-Code Connection

Every visual decision in the product traces back to the brand guide. This isn't decoration — it's product positioning encoded in pixels.

The cinematic red `#C1272D` is the only accent color in the system. It marks live activity, primary CTAs, the center Create button on mobile, error states, and the logo. Using it for anything else dilutes its meaning.

The off-white paper `#F5EFE6` and near-black `#0D0D0D` are the foundation pair. Together they create the "screening room with a bright projection" feeling. Pure white and pure black were rejected — too sterile, too tech.

The rounded shell layout (12px panel radius, near-black outer frame, floating panels inside) signals "this is a serious tool for filmmakers" rather than "this is a casual social app." The radius value is specific: 8px reads as form-control, 16px reads as playful, 12px reads as architectural. Don't tweak it.

The copy voice ("Reshoot this scene" instead of "Retry," "Take it home" instead of "Download") frames the product as filmmaking, not software. But not aggressively — destructive actions like Delete and Cancel keep their plain words because clarity beats flavor when the user might lose work.

The fonts (Inter for UI, Fraunces for editorial, JetBrains Mono for code) work together to feel "modern film studio," not "tech startup." Inter Display at Semibold with widened tracking is the wordmark.

You don't need to memorize any of this — the design system doc is the reference. But knowing that every visual decision is intentional helps when you're tempted to "just add a quick badge here" or "just round this corner more." The constraints are the product.

---

## 9. The Failure Philosophy

Long-running multi-provider pipelines fail. The architecture assumes this and is built around graceful degradation rather than perfection.

**Single failures don't cascade.** A scene image fails → the film errors with a specific reason → the user reshoots that one scene → the film completes. The other scenes that succeeded aren't redone.

**Provider outages refund.** Circuit breakers detect provider failures. When the breaker trips, in-flight films error and credits are automatically refunded. The user gets a friendly explanation and their balance restored within seconds.

**Cancellations are honored.** A user can cancel anytime. The backend marks the film canceled, in-flight tasks abort at safe checkpoints, partial refunds are calculated based on phases run, and the user returns to the Create page with their script preserved.

**The DLQ catches everything else.** Truly unexpected failures (worker crashes, database connection loss, OOM kills) land in the dead letter queue with full context for human triage.

**The user never sees a stack trace.** Provider errors get translated to friendly messages. Unknown errors get a generic but specific phrasing ("This scene didn't render"). Never "Oops!" Never "Something went wrong." The brand voice extends into the failure mode.

**Refunds are automatic.** A user should never need to email support to get a refund on a failed generation. The backend handles it programmatically. Trust is the product's most fragile asset; auto-refunds protect it.

The reason the failure handling looks like overkill at first glance is because at the scale of a successful product (thousands of generations a day across five providers), normal-rate failures become user-visible incidents many times an hour. The discipline is what makes the system reliable in production, not in development.

---

## 10. Where to Go From Here

You now have the full mental model. Next steps depend on what you're doing:

**If you're starting fresh:**
1. Run the two-pass quality spike (Dev Quickstart §"Must-Do Before Week Two"). Half a day. Proves the foundational technical bet.
2. Build the starter repo (Starter Repo Structure §9). Two days. Scaffolds everything.
3. Set up the shared types package (Starter Repo Structure §6). Half a day. Locks the contract.
4. Begin Module 1 (Backend Handoff §9.1).

**If you're picking up mid-project:**
1. Read the `decisions/` folder in the repo. That's where every non-obvious call lives.
2. Look at the current state of `main`. What's deployed? What's the active branch?
3. Ask: which module are we on? The Quickstart's module-to-doc table tells you what to read.

**If you're stuck:**
1. Reread the relevant Backend Handoff section. 90% of the time the answer is there.
2. Check the state machine. Wrong-phase work is a common mistake.
3. Check `api_call_log`. Hanging tasks usually have a 429 or 503 in there nobody noticed.
4. Check the watch-outs list (Backend Handoff §10).
5. Ask the team. Be specific about what you tried.

**If you're tempted to optimize:**
1. Read Backend Handoff §13 (Performance) first.
2. The two-pass approach, music, and the live center-stage screen are non-negotiable.
3. Stream-copy concat and right-sizing the worker pool are the biggest wins. Do those first.
4. Skip the speed-tier model option for MVP.

**If you're tempted to add a feature:**
1. Check `Clevroy_MVP_Roadmap.md`. If it's not in scope, it's not in scope.
2. Big-picture features need product discussion before code.
3. Small-picture features need a decision record before code.

---

## 11. The Three Things That Most Often Go Wrong

After all of the above, the failure modes that actually bite developers on this kind of project, in order:

**1. Drifting contracts.** The backend changes a field name, the frontend doesn't catch up, production breaks. Defense: the shared types package, regenerated on every backend change. Build it in week one.

**2. Hidden async/sync mixing.** A junior writes an async function inside a Celery task and the worker hangs. Defense: the boundary discipline in §4.2. FastAPI is async, Celery is sync, never the twain shall meet inside one function.

**3. Floating-point credits.** Someone writes `float(user.credits_remaining)` somewhere and a year later the balance is off by a fraction of a cent and nobody knows why. Defense: NUMERIC(8,2) and Python `Decimal`, end to end. No floats. Ever.

If you avoid those three, the rest of the architecture catches your other mistakes.

---

## 12. The Closing Thought

Clevroy is a long-running multi-provider streaming-state pipeline with a cinematic UI. That sentence is the whole architecture in 12 words. Long-running because films take minutes to generate. Multi-provider because we use four AI vendors. Streaming-state because the user watches it happen. Pipeline because everything chains forward through phases. Cinematic UI because the brand is filmmaking, not software.

If you hold those five concepts in your head, you'll make the right call 95% of the time without consulting any document. The reference docs exist for the other 5%, and for the moments when you're in the weeds and need to verify a specific value or spec.

The product is ambitious but the architecture is disciplined. Trust the architecture. Build one module at a time. Verify each module's deliverable before moving on. Update the docs when you discover they're wrong. Ship.

---

**Dev Overview version: V1 — April 2026.** Update the version stamp when the architecture, the state machine, the tech stack, or the failure philosophy changes. Small edits (clarifications, corrections) don't bump the version.
