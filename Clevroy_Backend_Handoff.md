# Clevroy Backend Handoff

**Document purpose:** A top-to-bottom walkthrough of how Clevroy's backend actually works, written so a mid-level Python developer can read it, understand the whole system, and know exactly what to build and in what order. This is a roadmap, not a prompt.

**Audience:** Junior and mid-level backend developers joining the project. Also useful as a reference for the senior engineer making architectural calls mid-build.

**Status:** V1 — end-to-end reference for MVP. Every decision here inherits from `Clevroy_V1_Architecture.md`, `Clevroy_Backend_Audit.md`, `Clevroy_Cost_Decisions.md`, and `Clevroy_Routing_Flow.md`. If this doc disagrees with any of those, those win and this doc needs updating.

**Inheritance:** Generation phase names match `Clevroy_UI_Design_System.md` §8.3 and `Clevroy_UX_Edge_Cases.md` §7 exactly. Credit cost percentages reference `Clevroy_Cost_Decisions.md`. Copy surface language (films vs credits) follows `Clevroy_Brand_Guide.md`.

**How to use this doc:**
1. Read sections 1–6 straight through before writing any code — that's the architecture foundation.
2. Read section 7 (database schema) next — everything else references these tables.
3. Read section 8 (API routes) to understand the external shape of the system.
4. Work through section 9 (the 20 modules) in order. Don't skip ahead.
5. Keep section 10 (cross-cutting watch-outs) open while you work — those are the mistakes juniors make on this stack.

---

## 1. What Clevroy's Backend Does

At its core: **a user pastes a script, and the backend turns it into a watchable short film in ~3–10 minutes while streaming progress updates live to the frontend.**

The backend has to:

- Accept a script and user choices (style, voice preferences, aspect ratio).
- Parse the script into scenes, characters, dialogue lines, and scene descriptions using an LLM.
- Generate character reference portraits (Pass 1) so the same face appears across scenes.
- Generate scene images using those portraits as visual conditioning (Pass 2).
- Synthesize voice lines for each character's dialogue.
- Compose background music in the requested style.
- Assemble individual scenes (image + voice + music ducking) into short video clips.
- Concatenate the clips into a final film.
- Stream every state change to the frontend in real time so the user can watch it happen.
- Handle failures gracefully — single-scene failures don't kill the film, provider outages refund credits, canceled generations clean up properly.
- Export completed films as MP4, as a PDF "book of the film," and as a static website ZIP.

This is a **long-running, multi-provider, streaming-state** problem. The architecture is shaped entirely around those three words.

---

## 2. Tech Stack (Locked)

Do not propose alternatives. These are committed.

**Runtime:** Python 3.12, FastAPI (API), Celery + Redis (background tasks)

**Database + auth:** Supabase — PostgreSQL for data, Supabase Auth for users, Supabase Realtime for streaming state to the frontend

**ORM:** SQLAlchemy + Alembic (migrations)

**Object storage:** Cloudflare R2 (S3-compatible API)

**Hosting:** Railway (both the FastAPI service and the Celery worker service are deployed as separate Railway services sharing the same codebase)

**AI providers:**
- **Google Gemini** — script parsing, content quality validation
- **fal.ai** — image generation (FLUX Kontext Pro for single-character scenes, Nano Banana 2 for multi-character scenes with multiple reference portraits)
- **ElevenLabs** — voice synthesis AND music composition (music replaced Suno/AIMLAPI)

**Export:**
- **WeasyPrint** — book PDF (replaced ReportLab)
- **Jinja2** — website HTML templating
- **ffmpeg** — video assembly and concatenation (system binary, called via subprocess)

If you find yourself wanting to swap any of these, stop and ask first.

---

## 3. System Shape: Three Services, One Codebase

The backend is one repo deployed as **three running processes**. They share models, schemas, and service code but run independently.

### 3.1 The API service (FastAPI)

The front door. Responds to HTTP requests from the frontend. Does **no heavy work**. Every endpoint either:
- Reads from the database (fast, synchronous)
- Writes to the database and enqueues a Celery task (fast, synchronous — the task is the slow part)
- Returns an authorization-signed URL for R2 uploads (frontend uploads directly to R2, bypassing the API)

The golden rule: **if an API request can take longer than 500ms, something is wrong.** Either the query is unoptimized, or the work shouldn't be happening in the request/response cycle.

### 3.2 The Celery worker service

Where all the slow, expensive, failure-prone work happens. Workers consume tasks from a Redis queue. Each task is one step in the generation pipeline:
- Parse a script
- Build the Character Identity Entities (CIE)
- Generate a character reference portrait
- Generate a scene image
- Synthesize a voice line
- Compose music
- Assemble a scene clip
- Concatenate the final film

Tasks are chained: when one finishes, it emits a database update (which Supabase Realtime broadcasts to the frontend) and schedules the next task in the chain.

### 3.3 The Celery beat scheduler (lightweight)

A small, always-running process that fires periodic housekeeping tasks:
- Cleanup of abandoned generations (>2 hours old, still in `pending` state)
- Cleanup of expired R2 upload URLs
- Soft-delete purge (films flagged for deletion >30 days ago are hard-deleted)
- Circuit breaker state resets

This is a single tiny process on Railway, not a full worker.

### 3.4 Why three services and not one monolith

FastAPI is request/response. Celery is long-running, can be killed at any time, needs its own retry logic. Running them in the same process creates resource contention — a slow Celery task blocks an API request. Separate deployments let each scale independently: more workers when generation load spikes, more API instances when sign-ups spike.

---

## 4. End-to-End Data Flow (Happy Path)

Here's exactly what happens when a user pastes a script and hits "Start your film." This is the single most important flow to understand — everything else is a variation or a failure handler.

**Step 1 — User clicks Start your film (frontend → API)**

Frontend POSTs to `/api/films` with the script text, style preset, and aspect ratio. API validates the user has ≥1 film in balance, creates a new `films` row with state `pending`, debits 1 film (NUMERIC(8,2) arithmetic in a transaction), and enqueues the `parse_script` Celery task. Returns the new film ID.

**Step 2 — Parse phase (Celery task 1)**

Worker picks up `parse_script`. Updates film state to `parsing`. Calls Gemini with the script and a system prompt that asks it to return structured JSON: scenes, characters, dialogue lines, visual descriptions. Writes the parsed result to the `scenes`, `characters`, and `dialogue_lines` tables. Updates film state to `cie_building` and enqueues `build_cie`.

**Step 3 — CIE building (Celery task 2)**

The Character Identity Entity step. Worker reads the characters, synthesizes each character's visual identity into a prompt-ready description (appearance, clothing, age, ethnicity, distinguishing features). Stores as `characters.cie_description`. Updates film state to `character_refs` and enqueues one `generate_character_ref` task per character, fanning out.

**Step 4 — Character reference portraits (Pass 1 — parallel fan-out)**

For each character, a worker calls fal.ai with the CIE description to generate a reference portrait. Uploads the result to R2. Writes the R2 key to `characters.reference_image_key`. When **all** character ref tasks are done (tracked via a counter on the `films` row), the coordinator enqueues `generate_scene_images`.

**Step 5 — Scene images (Pass 2 — parallel fan-out)**

The core two-pass moment. For each scene, a worker calls fal.ai — but this time with the character reference portraits as visual conditioning. Single-character scenes use **FLUX Kontext Pro** (one reference in). Multi-character scenes use **Nano Banana 2** (multiple references in). Scene images get uploaded to R2. Film state moves to `voice_synthesis` once all scenes have images.

**Step 6 — Voice synthesis (parallel fan-out)**

For each dialogue line, a worker calls ElevenLabs with the voice assignment for that character and the line text. Receives an MP3, uploads to R2, stores R2 key on `dialogue_lines.audio_key`. When all voice lines are done, state moves to `music_composition`.

**Step 7 — Music composition (single task)**

Worker calls ElevenLabs' music endpoint with the style preset and target duration (derived from total voice-line duration + 3s head/tail). Receives MP3, uploads to R2, stores R2 key on `films.music_key`. State moves to `scene_assembly`.

**Step 8 — Scene assembly (parallel fan-out)**

For each scene, a worker downloads the scene image + its voice lines + a segment of music, then uses `ffmpeg` to produce a scene video clip: image as the visual (with ken-burns zoom or static), voice lines timed to the dialogue order, music ducked under voice. Uploads each scene clip to R2, stores R2 key on `scenes.clip_key`. When all scene clips are done, state moves to `final_concat`.

**Step 9 — Final concatenation (single task)**

Worker downloads all scene clips, concatenates via `ffmpeg` into one MP4, uploads to R2 as the final film. Stores R2 key on `films.final_video_key`. State moves to `complete`.

**Step 10 — Frontend sees the final state**

The frontend has been receiving Realtime updates this whole time (from step 2 onward). When the film state becomes `complete`, the generation screen flips to the play button. User hits play, frontend requests a signed R2 URL for the final video, user watches their film.

**Total wall-clock time:** typically 3–10 minutes depending on script length, character count, and provider responsiveness. Most of that time is in steps 4, 5, and 6 (the parallel AI calls).

---

## 5. Why It's Built This Way (Design Decisions Worth Understanding)

### 5.1 Thin API, thick workers

Every architectural choice is built around this. The API barely does anything — it validates requests, writes a database row, and kicks off a task. This means the API is fast, predictable, and easy to scale horizontally. All the complexity (provider calls, retries, state management, file handling) lives in the workers.

**Why this matters for a junior dev:** When you're tempted to put logic in an API endpoint "because it's simpler," resist. If it's slow or failure-prone, it belongs in a task. The API's job is to enqueue work, not to do it.

### 5.2 Async/sync boundary

FastAPI is async (coroutines, `async def`). Celery tasks are sync (regular functions). Don't mix them.

- In the API, use `async def` for endpoints, `await` for IO-bound calls (database reads, Redis writes).
- In Celery tasks, use regular `def`. No `async` in tasks. If you need to call an async library inside a task, wrap it with `asyncio.run()` at the task boundary and make the rest of the task body sync.

Mixing async and sync code inside the same function is the single most common cause of hangs and weird production bugs on this stack. Juniors: when in doubt, stay sync inside tasks.

### 5.3 Idempotent tasks

Every Celery task must be safe to run twice. If a task gets retried, re-executed, or duplicated, the result should be the same as running it once.

How we achieve this:
- Every task is keyed by a unique identifier (film ID, scene ID, character ID, etc.) plus a phase name.
- Before doing work, the task checks the database for existing output. If the output is already there (R2 key populated, status is `complete`), the task exits early.
- Writes to the database are conditional — "update row X to state Y only if current state is Z."

**Why this matters:** Celery has at-least-once delivery. Retries happen. Workers can be killed mid-task and the task gets redelivered. Without idempotency, retries create duplicate outputs, double-charges, or corrupted state.

### 5.4 Upload-first, write-second

When a task generates a file (image, audio, video clip), the order is always:
1. Generate the file (API call, ffmpeg, whatever).
2. Upload the file to R2, get back a key.
3. Write the R2 key to the database row.

Never write a DB record referencing a key that hasn't been uploaded yet. If the upload fails, the DB stays consistent — no pointers to files that don't exist. If the DB write fails after a successful upload, the file is an orphan that the cleanup task finds and deletes (section 9, module 20).

### 5.5 Mandatory Celery ack settings

Celery has two modes for acknowledging tasks: acknowledge on receive (default, unsafe) or acknowledge on completion (what we want). We use:

- `task_acks_late = True` — tasks are only acked after they complete successfully.
- `task_reject_on_worker_lost = True` — if a worker dies mid-task, the task goes back to the queue instead of being silently lost.
- `worker_prefetch_multiplier = 1` — each worker only pulls one task at a time. Prevents a dying worker from taking a backlog with it.

These are set in the Celery config and are non-negotiable. Without them, worker crashes silently lose generations and users get films that hang forever at 60%.

### 5.6 Two-pass image generation

The #1 reason competitors' AI films look bad: the same character's face changes between scenes. Clevroy's fix is two-pass:

**Pass 1:** Generate a reference portrait of each character in isolation. Store it.

**Pass 2:** Generate scene images using the reference portraits as visual conditioning. FLUX Kontext Pro takes one reference input (used for single-character scenes). Nano Banana 2 takes multiple reference inputs (used for multi-character scenes).

This costs more credits than a one-pass approach but is the product's defining quality differentiator. The cost numbers in `Clevroy_Cost_Decisions.md` are built around the two-pass model. **Do not skip Pass 1 for "optimization."**

### 5.7 Circuit breakers per provider

Each AI provider has its own circuit breaker. When a provider fails N times in a row (N = 5 for fal.ai, 3 for ElevenLabs, 3 for Gemini), the breaker trips and further calls to that provider are rejected immediately without waiting for the timeout. After a 60-second cooldown, the breaker half-opens and tries one call — if it succeeds, the breaker closes; if it fails, the cooldown restarts.

Circuit breaker state is stored in Redis (global across all workers). This prevents a provider outage from causing every worker to hang on slow calls, and it's what makes edge case EC-G5 ("all fal.ai calls fail") recoverable instead of catastrophic.

### 5.8 Cost logging per call

Every external API call (Gemini, fal.ai, ElevenLabs) writes a row to the `api_call_log` table **before** the call is made and updates it with the response. The log captures: provider, model, task ID, film ID, request size (input tokens, seconds of audio, etc.), response size, latency, cost in USD (derived from a provider rate table), success/failure, and any error code.

Why: for the credit math to hold up, we need to know our actual provider spend per film. It's also how we detect provider pricing changes (the cost table needs updating), and it's how support triages user reports ("my film cost 3 films but only produced 4 scenes — what happened?").

### 5.9 Dead-letter queue via signal handler

When a Celery task fails terminally (all retries exhausted), we don't just drop it. A signal handler on `task_failure` writes a row to the `dead_letter_queue` table with the full task context: args, kwargs, traceback, film ID. This lets us:
- Surface terminal failures in an admin dashboard
- Manually reprocess after a provider issue is resolved
- Track "which scenes are failing most often" for debugging

The DLQ is not a user-facing feature in MVP but is critical operational tooling.

### 5.10 Credits as NUMERIC(8,2)

Balances are stored as `NUMERIC(8,2)` — exact decimal, not floating point. 1 credit = 1 film. 0.2 credits = 1 scene regen. Partial refunds (section 5.13 in `Clevroy_Cost_Decisions.md`) produce fractional credits.

Why not floating point: balance rounding errors compound. A user should never lose 0.0001 of a film because of FP arithmetic. SQL NUMERIC does exact decimal math; Python's `Decimal` type round-trips through SQLAlchemy cleanly. **Never cast credit values to `float` anywhere in the codebase.**

### 5.11 Temp file discipline

Celery workers generate intermediate files constantly (downloaded reference images, intermediate ffmpeg outputs, etc.). Every task that writes to the local filesystem must:
1. Use a unique temp directory per task (via `tempfile.TemporaryDirectory`).
2. Clean up via a try/finally or context manager.
3. Never write to `/tmp` directly — always use the task's temp dir.
4. Never rely on files persisting between tasks (tasks can run on different workers).

If a task leaves files behind, the worker's disk fills up over time and Railway starts killing containers. This is the most common slow-degradation failure in the system.

### 5.12 Structured JSON logging

Every log line from the API and workers is a JSON object with at minimum: `timestamp`, `level`, `service` (api/worker/beat), `task_id` (if applicable), `film_id` (if applicable), `user_id` (if applicable), `event`, and `message`. No `print` statements, no f-strings into a logger, no unstructured text.

Why: when something goes wrong with film ABC123, you want to run one grep and get every event for that film across API, workers, and provider logs. JSON logs enable that. Unstructured logs don't.

---

## 6. Generation State Machine (Canonical Enum)

This is the canonical list of film generation states. Every other document (frontend, edge cases, design system) refers back to these names.

| State | Backend meaning | Frontend shows |
|---|---|---|
| `pending` | Film row created, waiting for parse task to start | N/A — user hasn't seen the generation screen yet |
| `parsing` | Gemini parse in progress | "Reading your script..." |
| `cie_building` | Building Character Identity Entities | "Assembling the cast..." |
| `character_refs` | Generating Pass 1 reference portraits | "Casting portraits..." |
| `scene_images_pending` | Generating Pass 2 scene images | "Blocking the scenes..." |
| `voice_synthesis` | Synthesizing dialogue voice lines | "Finding voices..." |
| `music_composition` | Composing background music | "Scoring the film..." |
| `scene_assembly` | Assembling individual scene clips | "Cutting scene {n}..." |
| `final_concat` | Concatenating into final film | "Final cut..." |
| `complete` | Final video uploaded, ready to watch | "Your film is ready." |
| `error` | Unrecoverable failure | "We missed a shot." |
| `canceled` | User canceled; cleanup complete | (UI returns to Create page) |

State transitions are always **forward-only** except: any state can transition to `error` or `canceled`. Never backwards. If you find yourself wanting to transition back, you want a new state, not a reverse.

Each state is associated with a specific Celery task function (or set of parallel tasks). The task that runs while in state X is the task that transitions the film to state X+1 on success.

---

## 7. Database Schema

Eight tables. All use UUID primary keys (generated via `gen_random_uuid()`). All have `created_at` and `updated_at` timestamps. All foreign keys use `ON DELETE CASCADE` for child tables except where noted.

The schema is managed with Alembic migrations. Every schema change is a migration — no direct `ALTER TABLE` statements. The initial migration creates all eight tables at once.

### 7.1 `users`

Managed by Supabase Auth. Clevroy-specific user data lives in `user_profiles` (7.2). The `users` table is part of Supabase's auth schema and exposes `auth.users.id` as the reference point for everything user-owned.

We do not create or modify `auth.users` directly. We reference `auth.users.id` as a foreign key from `user_profiles`.

### 7.2 `user_profiles`

Clevroy's per-user data: balance, preferences, AI Twin state.

```sql
CREATE TABLE user_profiles (
    id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name            TEXT,
    avatar_url              TEXT,
    credits_remaining       NUMERIC(8,2) NOT NULL DEFAULT 5.00,
    theme_preference        TEXT NOT NULL DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark', 'system')),
    reduced_motion          BOOLEAN NOT NULL DEFAULT FALSE,
    voice_twin_key          TEXT,       -- R2 key for trained voice model
    voice_twin_status       TEXT DEFAULT 'none' CHECK (voice_twin_status IN ('none', 'training', 'ready', 'failed')),
    face_twin_key           TEXT,       -- R2 key for face reference portrait
    face_twin_status        TEXT DEFAULT 'none' CHECK (face_twin_status IN ('none', 'training', 'ready', 'failed')),
    onboarding_completed_at TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_credits ON user_profiles(credits_remaining) WHERE credits_remaining < 1.00;
```

The partial index on low balances lets us efficiently query "users who should see the upsell."

**Trigger:** On insert to `auth.users`, automatically insert a matching row here with default balance of 5.00 (the 5 free films on signup per `Clevroy_Cost_Decisions.md`). Implement as a Supabase database function.

### 7.3 `films`

The top-level film record. One row per generation attempt, including canceled and errored ones.

```sql
CREATE TABLE films (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title               TEXT NOT NULL DEFAULT 'Untitled film',
    script_text         TEXT NOT NULL,
    style_preset        TEXT NOT NULL,  -- 'cinematic' | 'animated' | 'documentary' | 'noir' | etc.
    aspect_ratio        TEXT NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:5')),
    state               TEXT NOT NULL DEFAULT 'pending' CHECK (state IN (
        'pending', 'parsing', 'cie_building', 'character_refs',
        'scene_images_pending', 'voice_synthesis', 'music_composition',
        'scene_assembly', 'final_concat', 'complete', 'error', 'canceled'
    )),
    state_error_reason  TEXT,
    credits_debited     NUMERIC(8,2) NOT NULL DEFAULT 1.00,
    credits_refunded    NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    music_key           TEXT,           -- R2 key for music track
    final_video_key     TEXT,           -- R2 key for final assembled MP4
    cover_image_key     TEXT,           -- R2 key for poster frame (first scene image)
    scene_count         INTEGER DEFAULT 0,
    character_count     INTEGER DEFAULT 0,
    duration_seconds    NUMERIC(6,2),   -- populated after final_concat
    use_voice_twin      BOOLEAN NOT NULL DEFAULT FALSE,
    use_face_twin       BOOLEAN NOT NULL DEFAULT FALSE,
    soft_deleted_at     TIMESTAMPTZ,    -- NULL = active; set = within 30-day recovery window
    completed_at        TIMESTAMPTZ,
    canceled_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_films_user_id ON films(user_id);
CREATE INDEX idx_films_user_active ON films(user_id, created_at DESC) WHERE soft_deleted_at IS NULL;
CREATE INDEX idx_films_state ON films(state) WHERE state NOT IN ('complete', 'error', 'canceled');
CREATE INDEX idx_films_soft_deleted ON films(soft_deleted_at) WHERE soft_deleted_at IS NOT NULL;
```

The `idx_films_state` partial index makes it efficient to find in-progress films for the housekeeping job that times out abandoned generations.

**Realtime:** This table is published to Supabase Realtime on the `state` column. The frontend subscribes to `films:id=eq.{film_id}` updates and listens for state changes.

### 7.4 `scenes`

One row per scene within a film. Created during the parse phase.

```sql
CREATE TABLE scenes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    film_id             UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    scene_number        INTEGER NOT NULL,  -- 1-indexed, ordered within film
    description         TEXT NOT NULL,     -- visual description used for image generation
    location            TEXT,              -- parsed setting (INT. DINER - NIGHT, etc.)
    time_of_day         TEXT,
    state               TEXT NOT NULL DEFAULT 'pending' CHECK (state IN (
        'pending', 'image_ready', 'assembled', 'failed'
    )),
    image_key           TEXT,              -- R2 key for scene image
    clip_key            TEXT,              -- R2 key for assembled scene video
    duration_seconds    NUMERIC(5,2),
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (film_id, scene_number)
);

CREATE INDEX idx_scenes_film_id ON scenes(film_id);
CREATE INDEX idx_scenes_state_pending ON scenes(film_id, state) WHERE state = 'pending';
```

### 7.5 `characters`

One row per character identified during the parse + CIE phases.

```sql
CREATE TABLE characters (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    film_id              UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    name                 TEXT NOT NULL,
    description          TEXT,                -- raw description from parse phase
    cie_description      TEXT,                -- synthesized identity description used for ref portrait prompt
    reference_image_key  TEXT,                -- R2 key for Pass 1 reference portrait
    voice_id             TEXT,                -- ElevenLabs voice ID assigned to this character
    voice_gender         TEXT CHECK (voice_gender IN ('male', 'female', 'neutral', NULL)),
    state                TEXT NOT NULL DEFAULT 'pending' CHECK (state IN (
        'pending', 'cie_built', 'ref_ready', 'failed'
    )),
    failure_reason       TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (film_id, name)
);

CREATE INDEX idx_characters_film_id ON characters(film_id);
```

### 7.6 `dialogue_lines`

One row per dialogue line in a scene, for voice synthesis.

```sql
CREATE TABLE dialogue_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id            UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    character_id        UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    line_number         INTEGER NOT NULL,    -- ordering within scene
    text                TEXT NOT NULL,
    audio_key           TEXT,                -- R2 key for synthesized MP3
    duration_seconds    NUMERIC(5,2),
    state               TEXT NOT NULL DEFAULT 'pending' CHECK (state IN (
        'pending', 'synthesized', 'failed'
    )),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (scene_id, line_number)
);

CREATE INDEX idx_dialogue_lines_scene_id ON dialogue_lines(scene_id);
CREATE INDEX idx_dialogue_lines_character_id ON dialogue_lines(character_id);
```

### 7.7 `api_call_log`

Every external provider call is logged here. Used for cost tracking, debugging, and provider health monitoring.

```sql
CREATE TABLE api_call_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    film_id             UUID REFERENCES films(id) ON DELETE SET NULL,
    user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider            TEXT NOT NULL CHECK (provider IN ('gemini', 'fal', 'elevenlabs')),
    model               TEXT NOT NULL,      -- 'gemini-2.0-flash', 'flux-kontext-pro', 'eleven-v3', etc.
    task_name           TEXT,               -- Celery task that triggered the call
    task_id             TEXT,               -- Celery task ID
    request_input_size  INTEGER,            -- tokens / bytes / seconds depending on provider
    request_metadata    JSONB,              -- truncated request payload for debugging
    response_status     TEXT NOT NULL CHECK (response_status IN ('success', 'failure', 'retry')),
    response_size       INTEGER,
    response_error_code TEXT,
    latency_ms          INTEGER,
    cost_usd            NUMERIC(10,6),      -- derived at insert time from provider rate table
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_call_log_film_id ON api_call_log(film_id);
CREATE INDEX idx_api_call_log_provider_time ON api_call_log(provider, created_at DESC);
CREATE INDEX idx_api_call_log_failures ON api_call_log(provider, created_at DESC) WHERE response_status = 'failure';
```

`ON DELETE SET NULL` for `film_id` and `user_id` — we want to retain call logs even if the film or user is deleted, for billing reconciliation.

### 7.8 `credit_transactions`

Every change to `user_profiles.credits_remaining` goes through here. Double-entry-style: every debit must have a matching transaction row.

```sql
CREATE TABLE credit_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    film_id             UUID REFERENCES films(id) ON DELETE SET NULL,
    kind                TEXT NOT NULL CHECK (kind IN (
        'signup_bonus', 'purchase', 'film_debit', 'regen_debit',
        'refund_full', 'refund_partial', 'admin_adjustment'
    )),
    amount              NUMERIC(8,2) NOT NULL,  -- positive for credits added, negative for credits removed
    balance_after       NUMERIC(8,2) NOT NULL,  -- snapshot of balance after this transaction
    description         TEXT,
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_film_id ON credit_transactions(film_id) WHERE film_id IS NOT NULL;
```

**Invariant:** The sum of all `amount` values for a given `user_id` must equal that user's `credits_remaining`. This is a testable invariant — a nightly job verifies it and alerts on discrepancies.

### 7.9 `dead_letter_queue`

Terminally failed tasks land here.

```sql
CREATE TABLE dead_letter_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    film_id         UUID REFERENCES films(id) ON DELETE SET NULL,
    task_name       TEXT NOT NULL,
    task_id         TEXT,
    task_args       JSONB,
    task_kwargs     JSONB,
    exception_type  TEXT,
    exception_msg   TEXT,
    traceback       TEXT,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    resolved_at     TIMESTAMPTZ,    -- set when manually replayed or written off
    resolution_note TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dlq_unresolved ON dead_letter_queue(created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX idx_dlq_film_id ON dead_letter_queue(film_id);
```

### 7.10 Table relationship diagram (text form)

```
auth.users (Supabase)
    │
    ├─→ user_profiles (1:1)
    │
    ├─→ films (1:many)
    │       │
    │       ├─→ scenes (1:many)
    │       │       │
    │       │       └─→ dialogue_lines (1:many)
    │       │               │
    │       │               └─← characters (many:1 via character_id)
    │       │
    │       └─→ characters (1:many)
    │
    ├─→ credit_transactions (1:many)  — optionally linked to a film
    │
    └─→ api_call_log (1:many)  — optionally linked to a film

dead_letter_queue — standalone, optionally links to films
```

### 7.11 Row-level security (RLS)

Supabase RLS policies enforce that users can only access their own data. The policies are straightforward but must be applied to every table:

- `user_profiles`: SELECT/UPDATE allowed where `id = auth.uid()`
- `films`: SELECT/INSERT/UPDATE/DELETE allowed where `user_id = auth.uid()`
- `scenes`, `characters`, `dialogue_lines`: SELECT allowed where `film_id` is in the user's films (join-based policy)
- `credit_transactions`: SELECT allowed where `user_id = auth.uid()`; INSERT/UPDATE/DELETE **denied** to all roles except the service role (only workers can modify credits)
- `api_call_log`, `dead_letter_queue`: SELECT/INSERT/UPDATE/DELETE **denied** to all roles except the service role (admin-only tables)

The service role key is used by the FastAPI service and Celery workers to bypass RLS for administrative operations. **Never ship the service role key to the frontend.** Frontend always uses the anon key and RLS enforces isolation.

---

## 8. API Routes

Every route follows consistent conventions:
- **Auth**: All authenticated routes require a Supabase JWT in the `Authorization: Bearer <token>` header. Anonymous routes are explicitly marked.
- **Content type**: All request/response bodies are JSON unless stated otherwise.
- **Errors**: Consistent error envelope — `{"error": {"code": "string", "message": "human-readable", "details": object}}`. Status codes follow HTTP conventions: 400 (validation), 401 (unauthenticated), 403 (authorized but forbidden), 404 (not found), 409 (conflict, e.g., duplicate action), 429 (rate limited), 500 (server error).
- **Validation**: All request bodies are validated with Pydantic models. Invalid requests return 400 with field-level error details.

Routes are grouped by module. `Clevroy_Routing_Flow.md` is the source of truth for the exact endpoint shape if this doc ever drifts.

### 8.1 Auth routes

Supabase handles the actual auth flow (sign up, sign in, password reset, JWT issuance). Clevroy's API does not implement auth endpoints. The frontend talks directly to Supabase Auth.

The only Clevroy-owned auth-adjacent route is:

**`POST /api/me/onboarding`**
- Purpose: Mark onboarding as complete after the user finishes the first-run theme choice and intro tour.
- Auth: Required.
- Payload: `{"theme_preference": "dark" | "light" | "system", "reduced_motion": boolean}`
- Response: 200, returns the updated user profile.
- Side effects: Sets `user_profiles.onboarding_completed_at = NOW()` and applies preferences.

### 8.2 User profile routes

**`GET /api/me`**
- Purpose: Get the current user's profile (display name, avatar, balance, twin status, preferences).
- Auth: Required.
- Payload: None.
- Response: 200 with `UserProfile` object.

**`PATCH /api/me`**
- Purpose: Update the current user's profile (display name, avatar URL, theme, reduced motion).
- Auth: Required.
- Payload: Partial `UserProfile` (any editable fields).
- Response: 200 with updated profile.

**`DELETE /api/me`**
- Purpose: Initiate account deletion (30-day soft delete, then full purge).
- Auth: Required.
- Payload: `{"confirm": "delete"}` (the literal string, matching what the user typed in the UI).
- Response: 200 with `{"deletion_scheduled_for": "ISO8601 timestamp"}`.

### 8.3 Films routes (core)

**`POST /api/films`**
- Purpose: Start a new film generation.
- Auth: Required.
- Payload: `{"script_text": string, "style_preset": string, "aspect_ratio": "16:9"|"9:16"|"1:1"|"4:5", "title": string (optional), "use_voice_twin": boolean, "use_face_twin": boolean}`
- Response: 201 with `{"film_id": "uuid", "state": "pending"}`.
- Side effects: Validates balance ≥ 1.00, debits 1.00 credit in a transaction, creates a `films` row, creates a `credit_transactions` row (`film_debit`), enqueues `parse_script` Celery task.
- Failure modes: 400 if script_text is empty or too long (>50k chars); 402 (Payment Required) if balance < 1.00 — returns `{"error": {"code": "insufficient_films"}}`.

**`GET /api/films`**
- Purpose: List the current user's films (for Home and Projects pages).
- Auth: Required.
- Query params: `?cursor=<timestamp>&limit=20&include_deleted=false`
- Response: 200 with `{"films": [FilmSummary], "next_cursor": "timestamp"|null}`.
- Notes: Soft-deleted films are excluded unless `include_deleted=true`. `FilmSummary` includes id, title, state, created_at, cover_image_key (with signed URL for the cover), scene_count, duration_seconds.

**`GET /api/films/{film_id}`**
- Purpose: Get full details of a film — for the Results page or to catch up after reconnection.
- Auth: Required.
- Response: 200 with `Film` object (full film record + nested scenes, characters, dialogue_lines).
- Failure modes: 404 if not found or not owned by the user (indistinguishable by design — see edge case EC-N8).

**`GET /api/films/{film_id}/state`**
- Purpose: Lightweight state-only endpoint for reconnection. Used by the generation screen to catch up after network drops or backgrounding.
- Auth: Required.
- Response: 200 with `{"state": string, "current_phase_detail": object, "scene_count": int, "scenes_ready": int, "last_event_at": "ISO8601"}`.
- Notes: Designed to be polled by the frontend after a reconnect event. Response size is small (<1KB) so polling is cheap.

**`PATCH /api/films/{film_id}`**
- Purpose: Update metadata (title only, for now).
- Auth: Required.
- Payload: `{"title": string}`
- Response: 200 with updated film.

**`POST /api/films/{film_id}/cancel`**
- Purpose: Cancel an in-progress generation. Triggers partial refund logic.
- Auth: Required.
- Payload: `{"idempotency_key": "uuid"}` — frontend generates a UUID per cancel click to prevent duplicate cancels.
- Response: 200 with `{"refund_amount": "X.XX", "canceled_at": "ISO8601"}`.
- Failure modes: 409 if the film is already complete, errored, or canceled.

**`DELETE /api/films/{film_id}`**
- Purpose: Soft-delete a film (30-day recovery window).
- Auth: Required.
- Response: 200 with `{"deletion_scheduled_for": "ISO8601"}`.
- Failure modes: 409 if the film is in an in-progress state (see EC-N9) — returns `{"error": {"code": "film_in_progress"}}`.

**`POST /api/films/{film_id}/restore`**
- Purpose: Restore a soft-deleted film within the 30-day window.
- Auth: Required.
- Response: 200 with the restored film.
- Failure modes: 404 if beyond the recovery window.

### 8.4 Regeneration routes

**`POST /api/films/{film_id}/scenes/{scene_id}/reshoot`**
- Purpose: Regenerate a single scene.
- Auth: Required.
- Payload: `{"idempotency_key": "uuid", "reason": "user_initiated" | "generation_failure"}`
- Response: 202 Accepted with `{"task_id": "uuid", "cost_credits": "0.20"}`. Response 202 because the work is queued, not done.
- Side effects: For `user_initiated`: debits 0.20 credits, creates `credit_transactions` row (`regen_debit`), enqueues a scene reshoot task. For `generation_failure`: no debit (EC-G4).
- Failure modes: 409 if the scene is already being reshot (see EC-G8).

### 8.5 Export routes

**`POST /api/films/{film_id}/export/mp4`**
- Purpose: Request a signed download URL for the final MP4.
- Auth: Required.
- Response: 200 with `{"url": "https://...", "expires_at": "ISO8601"}`. URL is valid for 1 hour.
- Failure modes: 404 if the film isn't in `complete` state.

**`POST /api/films/{film_id}/export/book-pdf`**
- Purpose: Generate the book-style PDF export of the film (WeasyPrint).
- Auth: Required.
- Response: 202 Accepted with `{"task_id": "uuid"}`. The export is an async task because PDF generation can take 10–30 seconds for long films.
- Followup: Client polls `GET /api/exports/{task_id}` or subscribes to Realtime on the export status.

**`POST /api/films/{film_id}/export/website-zip`**
- Purpose: Generate the static website ZIP export (Jinja2 HTML + assets).
- Auth: Required.
- Response: 202 Accepted with `{"task_id": "uuid"}`.

**`GET /api/exports/{task_id}`**
- Purpose: Poll the status of an export task.
- Auth: Required.
- Response: 200 with `{"status": "pending"|"processing"|"ready"|"failed", "url": "https://..."|null, "expires_at": "ISO8601"|null}`.

### 8.6 Billing routes

**`GET /api/me/credits`**
- Purpose: Get the current balance and a paginated list of credit transactions.
- Auth: Required.
- Query params: `?limit=50&cursor=<timestamp>`
- Response: 200 with `{"balance": "X.XX", "transactions": [CreditTransaction], "next_cursor": "timestamp"|null}`.

**`POST /api/me/credits/purchase`**
- Purpose: Create a payment intent for purchasing more films. (Stripe integration — stubbed for MVP beta; returns a mock success after simulating a delay.)
- Auth: Required.
- Payload: `{"pack": "10_films" | "50_films" | "100_films"}`
- Response: 200 with `{"payment_url": "https://..."}` that the frontend redirects to. After successful payment, Stripe webhook updates the balance.

**`POST /api/webhooks/stripe`**
- Purpose: Stripe webhook receiver for successful payments.
- Auth: Verifies Stripe signature (not user JWT).
- Payload: Stripe event object.
- Response: 200.
- Side effects: On `payment_intent.succeeded`, credits the user's balance and creates a `credit_transactions` row (`purchase`).

### 8.7 AI Twin routes

**`GET /api/me/twins`**
- Purpose: Get the status of the user's voice and face twins.
- Auth: Required.
- Response: 200 with `{"voice": {"status": string, "sample_url": string|null}, "face": {"status": string, "preview_url": string|null}}`.

**`POST /api/me/twins/voice/upload-url`**
- Purpose: Get a signed R2 upload URL for a voice sample.
- Auth: Required.
- Payload: `{"filename": "sample.mp3", "content_type": "audio/mpeg"}`
- Response: 200 with `{"upload_url": "...", "key": "...", "expires_at": "ISO8601"}`.

**`POST /api/me/twins/voice/train`**
- Purpose: Kick off voice twin training after samples are uploaded.
- Auth: Required.
- Payload: `{"sample_keys": ["...", "..."]}`
- Response: 202 Accepted with `{"task_id": "uuid"}`.

**`POST /api/me/twins/face/upload-url`**
- Purpose: Get signed R2 upload URL for a face reference photo.
- Auth: Required.
- Payload: `{"filename": "face.jpg", "content_type": "image/jpeg"}`
- Response: Same shape as voice upload.

**`POST /api/me/twins/face/train`**
- Purpose: Kick off face twin training after photos are uploaded.
- Auth: Required.
- Payload: `{"sample_keys": ["...", "..."]}`
- Response: 202 Accepted with `{"task_id": "uuid"}`.

**`DELETE /api/me/twins/voice`** and **`DELETE /api/me/twins/face`**
- Purpose: Delete a trained twin.
- Auth: Required.
- Response: 200.

### 8.8 System / health routes

**`GET /health`**
- Purpose: Railway health check endpoint. Unauthenticated. Returns 200 if the API process is alive and can connect to the database.
- Response: 200 with `{"status": "ok"}` or 503 with `{"status": "degraded", "checks": {...}}`.

**`GET /api/me/activity/{film_id}`**
- Purpose: Get the activity feed entries for a film (used to render history when the user reloads a generation screen).
- Auth: Required.
- Response: 200 with `{"events": [ActivityEvent]}`.

---

## 9. The 20-Module Build Sequence

The build is broken into 20 modules, in strict order. Each module has **clear inputs** (what must be done first), a **single deliverable** (what you prove is working at the end), and a **verification check** (how you know it's done). No module takes more than 2–3 days for a mid-level developer.

Do not skip ahead. Do not work on modules 5 and 10 in parallel thinking "they're independent." They aren't — module 10 depends on assumptions made in modules 3, 5, 7, and 8. The order is the product.

### Module 1 — Project skeleton

**Inputs:** Railway project set up, GitHub repo initialized.

**Deliverable:** A deployable FastAPI app with one `/health` endpoint returning 200, running on Railway, with a dockerfile, pyproject.toml, and a local dev setup (`make dev` runs it). Environment variable loading via pydantic-settings.

**Verification:** `curl <railway-url>/health` returns `{"status": "ok"}`.

### Module 2 — Database setup and migrations

**Inputs:** Module 1. Supabase project created.

**Deliverable:** SQLAlchemy models for all 8 tables from section 7, Alembic configured, the initial migration that creates all tables applied to the Supabase database. RLS policies applied (as a separate migration). The trigger that creates a `user_profiles` row on auth signup is in place.

**Verification:** Sign up a test user via Supabase Auth, verify a `user_profiles` row is created with `credits_remaining = 5.00`.

### Module 3 — Core services layer (no endpoints yet)

**Inputs:** Module 2.

**Deliverable:** Service classes for the core domain objects — `UserService`, `FilmService`, `CreditService` — with methods for the common operations (get user, list films, debit credits). Pure Python, SQLAlchemy under the hood, no FastAPI dependency. Unit tests for `CreditService` specifically (the math is the riskiest part).

**Verification:** Unit tests pass. `CreditService.debit()` correctly handles race conditions via SELECT FOR UPDATE.

### Module 4 — Supabase auth integration

**Inputs:** Module 3.

**Deliverable:** A FastAPI dependency that validates the `Authorization: Bearer <jwt>` header against Supabase, extracts the user ID, and makes it available via `Depends(get_current_user)`. Handles token expiration cleanly (returns 401 with a consistent error shape).

**Verification:** Hit a protected test endpoint with a valid Supabase JWT — returns the user ID. Hit it without — returns 401. Hit it with an expired token — returns 401.

### Module 5 — FastAPI endpoint skeleton

**Inputs:** Module 4.

**Deliverable:** All endpoints from section 8 implemented as stubs — they accept the right payloads, validate with Pydantic, call into service methods, and return the right response shapes. The endpoints that need Celery tasks queue placeholder `print()` tasks. No AI provider calls yet. RLS is enforced at the database level so even incorrect endpoint code can't leak data.

**Verification:** Postman/Insomnia collection hits every endpoint. Auth, validation, and data shape all work end-to-end with dummy data.

### Module 6 — Celery + Redis infrastructure

**Inputs:** Module 5. Redis instance provisioned on Railway.

**Deliverable:** Celery worker service deployed on Railway as a separate process. Celery configured with `task_acks_late=True`, `task_reject_on_worker_lost=True`, `worker_prefetch_multiplier=1`. A single test task that reads a film ID and updates its state to `parsing`. Celery beat scheduler deployed for periodic housekeeping (empty task list for now).

**Verification:** Enqueue the test task from a Python shell, observe state change in the database, observe structured JSON log lines in Railway logs.

### Module 7 — Parse phase (Gemini integration)

**Inputs:** Module 6.

**Deliverable:** `parse_script` Celery task. Calls Gemini with a well-crafted system prompt (separate file, version-controlled). Parses the structured JSON response into `scenes`, `characters`, `dialogue_lines` rows. Transitions film state from `pending` → `parsing` → `cie_building`. Writes an `api_call_log` row.

**Verification:** Submit a sample script via `POST /api/films`, observe all three tables populated correctly, observe film state advance.

### Module 8 — CIE (Character Identity Entity) builder

**Inputs:** Module 7.

**Deliverable:** `build_cie` Celery task. Reads characters for a film, synthesizes each character's `cie_description` (another Gemini call). Transitions film state from `cie_building` → `character_refs`. Enqueues one `generate_character_ref` task per character (fan-out).

**Verification:** Completion of module 7's happy path now continues into CIE and fans out to N character-ref tasks waiting in the queue (you'll see them in the Redis queue view).

### Module 9 — Character reference portraits (Pass 1)

**Inputs:** Module 8.

**Deliverable:** `generate_character_ref` Celery task. Calls fal.ai FLUX Kontext Pro with the CIE description. Downloads result. Uploads to R2. Writes `characters.reference_image_key`. Updates the character's state. Atomic counter logic: when the last character's ref completes, transitions the film from `character_refs` → `scene_images_pending` and enqueues `generate_scene_images`.

**Verification:** Sample film produces N reference portraits in R2, all characters have `reference_image_key` populated, film advances to `scene_images_pending`.

### Module 10 — Scene images (Pass 2)

**Inputs:** Module 9. This is the hardest module — two-pass conditioning.

**Deliverable:** `generate_scene_image` Celery task. For each scene: determines which characters appear in the scene (based on the parsed dialogue), fetches their reference portraits from R2, and calls fal.ai with the right model: FLUX Kontext Pro for single-character scenes (one reference in), Nano Banana 2 for multi-character scenes (multiple references in). Uploads scene image to R2, writes `scenes.image_key`. Counter logic transitions film to `voice_synthesis`.

**Verification:** Sample film produces N scene images where characters visibly resemble their reference portraits. This is the product's defining quality — visually inspect outputs, do not just check that the task completed.

### Module 11 — Voice synthesis (ElevenLabs)

**Inputs:** Module 10.

**Deliverable:** `synthesize_voice_line` Celery task. For each dialogue line: calls ElevenLabs with the character's assigned voice and the line text. Uploads MP3 to R2. Writes `dialogue_lines.audio_key` and `duration_seconds`. Counter logic transitions film to `music_composition`. Voice assignment logic: characters default to ElevenLabs voices based on `voice_gender`; if `use_voice_twin` is true, the user's trained voice is used for the primary character only.

**Verification:** All dialogue lines have an `audio_key` and a `duration_seconds`. Audio plays back correctly from a signed R2 URL.

### Module 12 — Music composition (ElevenLabs music)

**Inputs:** Module 11.

**Deliverable:** `compose_music` Celery task. Calls ElevenLabs' music endpoint with the style preset and target duration (sum of dialogue durations + ~3s head and tail). Uploads MP3 to R2, writes `films.music_key`. Transitions film to `scene_assembly`.

**Verification:** Films have a music track that roughly matches the total scene duration.

### Module 13 — Scene assembly (ffmpeg, per-scene)

**Inputs:** Module 12. `ffmpeg` installed in the worker container.

**Deliverable:** `assemble_scene` Celery task. For each scene: downloads the scene image, the scene's dialogue audio files, and a segment of the music track. Runs ffmpeg to produce a scene video clip — image with optional ken-burns zoom as the visual, dialogue audio layered in order, music ducked under dialogue by ~10dB during speech. Uploads clip to R2. Writes `scenes.clip_key`. Temp files cleaned up in a finally block.

**Verification:** Each scene has a clip. Playback shows image + voice + music properly mixed.

### Module 14 — Final concatenation

**Inputs:** Module 13.

**Deliverable:** `concat_final_film` Celery task. Downloads all scene clips in order, concatenates via ffmpeg into one MP4, uploads to R2 as `films.final_video_key`. Also extracts the first scene's image as `films.cover_image_key` for use as the poster. Transitions film to `complete`. Writes `films.completed_at` and `films.duration_seconds`.

**Verification:** Final MP4 plays end-to-end. Cover image is correctly set and renders in the Projects grid.

### Module 15 — Export: signed download URLs

**Inputs:** Module 14.

**Deliverable:** The `POST /api/films/{id}/export/mp4` endpoint from section 8.5. Generates a signed R2 URL with a 1-hour expiry. No additional processing — just a URL.

**Verification:** Hitting the endpoint returns a working URL that serves the MP4 when opened.

### Module 16 — Scene regeneration

**Inputs:** Module 14.

**Deliverable:** The reshoot endpoint `POST /api/films/{id}/scenes/{scene_id}/reshoot`. Debits 0.20 credits (for user-initiated) or 0 (for generation-failure recovery). Enqueues a `regen_scene` task that re-runs modules 10 and 13 for that single scene, then updates the final video by re-running module 14. Idempotency via `idempotency_key`.

**Verification:** Reshooting a scene from a completed film produces a new image, a new clip, and a new final video. The old files are either deleted or orphaned for the cleanup task to sweep.

### Module 17 — Book PDF export (WeasyPrint)

**Inputs:** Module 14. WeasyPrint installed in the worker container.

**Deliverable:** `export_book_pdf` Celery task. Template: a Jinja2 HTML template styled for print (A4 or Letter, generous margins, Fraunces for chapter titles per Brand Guide). For each scene: one page with the scene image full-width, dialogue lines below in script format, scene number in the header. Title page with the film title, cover image, and credits. WeasyPrint renders to PDF, uploads to R2, writes back to an export task record for polling.

**Verification:** Downloaded PDF opens in a reader and looks like a book, not a web dump.

### Module 18 — Website ZIP export (Jinja2 HTML)

**Inputs:** Module 14.

**Deliverable:** `export_website_zip` Celery task. Generates a static HTML site (index.html with a player for the full MP4, a scenes.html gallery, a characters.html page) styled with inline CSS matching the Clevroy brand. Bundles the MP4 (or includes a link to R2), scene images, character portraits, and the HTML/CSS into a ZIP. Uploads ZIP to R2.

**Verification:** Downloaded ZIP unzips into a folder; opening index.html in a browser shows a functional mini-site.

### Module 19 — AI Twin (voice + face training)

**Inputs:** Module 14.

**Deliverable:** The AI Twin endpoints from section 8.7. `train_voice_twin` Celery task (calls ElevenLabs voice cloning API). `train_face_twin` Celery task (generates a canonical face reference portrait from uploaded photos using fal.ai). Status updates on `user_profiles.voice_twin_status` and `face_twin_status`. Graceful failure handling per edge case EC-N10.

**Verification:** Uploading 5+ face photos and training produces a stored reference portrait. Creating a new film with `use_face_twin=true` uses that portrait in the Pass 1 step for the primary character.

### Module 20 — Housekeeping and cleanup

**Inputs:** All previous modules.

**Deliverable:** Celery beat scheduler tasks:
- **Abandoned generation timeout**: every 10 minutes, find films in an in-progress state older than 2 hours; mark as `error` with reason `timed_out`; refund credits.
- **Orphaned R2 object cleanup**: every hour, find R2 keys written to the DB but not referenced by any row (via left join checks); delete the R2 objects.
- **Soft-delete purge**: daily, find films with `soft_deleted_at < NOW() - INTERVAL '30 days'`; hard-delete them and their R2 assets.
- **Credit invariant check**: daily, for each user, verify `sum(credit_transactions.amount) = user_profiles.credits_remaining`. Alert on any discrepancy.
- **Circuit breaker reset**: runs on-demand via signal; resets a tripped breaker after a manual operations action.
- **DLQ retention**: 90-day retention on dead_letter_queue rows; older rows deleted.

**Verification:** Simulate each scenario and verify the cleanup task handles it correctly. This is the last module because it's the one that keeps the system healthy over time — without it, the system degrades silently.

---

## 10. Cross-Cutting Watch-Outs

These are the mistakes juniors and mids commonly make on this stack. Every one of them has happened on projects like this before. Keep this list open while you work.

### 10.1 Don't do heavy work in API endpoints

Already covered in section 5.1, but it bears repeating. If an endpoint takes more than 500ms, something is wrong. Heavy work → Celery task.

### 10.2 Don't mix async and sync

In FastAPI endpoints: `async def` + `await`. In Celery tasks: regular `def`. If you're in a Celery task and want to call something async, wrap with `asyncio.run()` at the top of the task and keep everything else sync. Mixing will cause mysterious hangs and connection pool exhaustion.

### 10.3 Always use idempotency keys on destructive actions

Cancel, reshoot, delete — all require an idempotency key from the frontend. Check the key against recent requests (Redis cache with 1 hour TTL). Duplicate requests within the window return the same response as the first one, not a new action.

### 10.4 Never cast credit values to float

`Decimal` from start to finish. SQLAlchemy's `Numeric` type round-trips as Python `Decimal`. JSON serialization requires explicit `str(Decimal(...))` conversion. Pydantic models use `Decimal` too. If you write `float(credits)` anywhere, it's a bug.

### 10.5 Always use the task's temp directory, never `/tmp`

`tempfile.TemporaryDirectory()` in a context manager. Never `/tmp/myfile.mp4`. Never leave files behind.

### 10.6 Don't trust provider responses

Every provider call can return malformed data, unexpected status codes, or truncated responses. Validate with Pydantic before acting on the response. Log the full response in `api_call_log.request_metadata` if anything looks wrong.

### 10.7 Circuit breaker state is global

The circuit breaker for a provider is shared across all workers via Redis. Do not implement per-worker breakers. When the breaker trips, it trips for everyone.

### 10.8 Don't silently swallow exceptions

In task code, if you catch an exception, either log it with full context and re-raise, or handle it with a specific recovery action. Never `except Exception: pass`. Never `except Exception as e: logger.error(e)` without the traceback.

### 10.9 Test with real provider calls before shipping any module

Mocks lie. The happy path of every AI provider call has to be verified end-to-end at least once on a staging environment before declaring the module done. Unit tests prove the logic; integration tests prove the integration.

### 10.10 RLS is defense in depth, not the only defense

Database RLS catches many mistakes but not all. Always validate authorization at the service layer too (`film.user_id == current_user.id`). If you rely on RLS alone and someone adds a new endpoint that bypasses the service layer, you have a vulnerability.

### 10.11 Realtime is notification, not state

The Realtime channel tells the frontend "something changed, go read the DB." The frontend should always re-fetch state after a Realtime event fires, not just trust the event payload. This is why `/api/films/{id}/state` exists — it's the catch-up endpoint. Don't try to cram full film state into Realtime event payloads.

### 10.12 Don't hardcode provider model names or rates

Model names (`flux-kontext-pro`, `eleven-v3`) and rates (`$0.05 per image`) change. Store them in a config file that gets loaded at startup, or better yet, a `provider_rates` database table that can be updated without a deploy.

### 10.13 Log before the call, not after

When calling a provider, write the `api_call_log` row before making the HTTP call (status: `retry`), then update it after the response (status: `success` or `failure`). If the call hangs or the worker dies mid-call, you still have a record that the call was attempted.

### 10.14 Pydantic v2, not v1

pydantic-settings and FastAPI on recent versions use Pydantic v2. The syntax is different from v1 (`model_config` not `class Config`, `field_validator` not `validator`). If you find tutorials with the old syntax, they're out of date.

### 10.15 SQLAlchemy 2.0 style

Use the 2.0 API (`select(Model).where(...)`, session.execute()), not the legacy query API (`session.query(Model).filter(...)`). The legacy API is deprecated.

### 10.16 Don't skip Alembic for "quick fixes"

Every schema change is a migration. Even renaming a column. Even adding an index. Never run raw SQL against Supabase. The migration history is the truth.

### 10.17 Beware of Celery's deprecation of pickle

Celery's default serializer used to be pickle; it's now JSON. Make sure tasks accept and return JSON-serializable types only. No passing `datetime` objects directly — convert to ISO 8601 strings. No passing SQLAlchemy model instances — convert to dicts or IDs.

### 10.18 Railway-specific: watch memory on the worker

Worker processes that handle ffmpeg or WeasyPrint jobs can spike memory. Set the Railway worker service memory cap generously (2GB+ for MVP) and monitor. If a worker OOMs, Railway restarts it and the task goes back to the queue (which is fine because of `task_acks_late`).

### 10.19 Supabase Realtime requires the `REPLICA IDENTITY FULL` setting

For the `films` table to broadcast UPDATE events with the full row payload, run `ALTER TABLE films REPLICA IDENTITY FULL`. Do this in the initial migration. Without it, the frontend only gets the primary key on updates, not the changed columns.

### 10.20 Secrets stay in Railway, not in code

API keys (Gemini, fal.ai, ElevenLabs, R2 credentials, Supabase service role key) are environment variables in Railway. Never commit a .env file with real keys. Local dev uses a `.env.local` in `.gitignore`.

---

## 11. Testing Approach

### 11.1 Unit tests

Every service class has unit tests. Focus: `CreditService` (math correctness), `StateService` (state transition guards), service-layer authorization checks.

### 11.2 Integration tests

Test the full parse → CIE → refs → images → voice → music → assembly → concat pipeline with a real sample script on a staging environment. Run before any production deploy that touches a generation-phase module.

### 11.3 End-to-end tests

One test per stress test prompt in `Clevroy_UX_Edge_Cases.md` §5. Run weekly, run before every beta release.

### 11.4 Load testing

Before beta, simulate 10 concurrent generations. Verify the worker pool handles them without cross-contamination, without circuit breaker false-trips, and without OOM kills. Railway's default plans may need adjustment for this — verify resource limits match the expected concurrency.

### 11.5 Provider mock environment

For fast local dev, implement a `MOCK_PROVIDERS=true` env flag that stubs all external API calls with deterministic sample responses. Used for development and the bulk of unit tests; never for integration tests.

---

## 12. Operational Playbook

### 12.1 Monitoring

- Railway's built-in logs + deploy monitoring.
- Structured JSON logs flow through — any external log aggregator (Axiom, Datadog, Grafana Loki) can ingest.
- Set up alerts on: API error rate >1% over 5 minutes, Celery queue depth >100 (backlog forming), worker memory >80%, circuit breaker trips (any provider).

### 12.2 On-call triage

When a user reports "my film is stuck":
1. Look up the film ID (support app or direct DB query).
2. Check `films.state`. If it's `error`, read `state_error_reason`.
3. Check `api_call_log` for that film — look for failures.
4. Check `dead_letter_queue` for unresolved tasks referencing that film.
5. Reconcile credits if a refund didn't happen — use an admin endpoint (to be built post-MVP) or a one-off script.

### 12.3 Provider outage handling

When a provider goes down (confirmed via their status page):
1. Acknowledge to the team — don't wait for the first user complaint.
2. Check circuit breaker state in Redis. If not already tripped, it'll trip after the next 5 failures.
3. Communicate estimated impact: any in-progress films in states that depend on the down provider will error and refund.
4. After provider recovery, reset the circuit breaker manually (see Module 20's reset task).
5. Consider reprocessing DLQ entries created during the outage for users who want to retry automatically.

### 12.4 Scaling up

The MVP scales vertically first (bigger Railway instance) before horizontally. Horizontal scaling of the worker is safe (stateless, idempotent tasks). Horizontal scaling of the API is safe (also stateless). The only single-instance component is Celery beat — it must run on exactly one process at a time to avoid duplicate scheduled tasks.

---

## 13. Performance and Speed Optimization

A typical Clevroy generation runs 3–10 minutes end-to-end. Most of that time is in the parallel AI-call phases (character refs, scene images, voice synthesis) and the ffmpeg assembly steps. This section is the playbook for making generations faster without breaking the product.

### 13.1 What we will not optimize away

Three things are non-negotiable. Do not propose changes that compromise them.

**The two-pass image generation.** Pass 1 (reference portraits) → Pass 2 (scene images with reference conditioning) is Clevroy's defining quality differentiator. Every competitor's AI film tool produces inconsistent character faces across scenes; the two-pass approach is what fixes that. It takes longer than one-pass. That's the deal. Do not skip Pass 1 for any reason — not for "quick mode," not for "first-time users," not for "testing."

**Music.** Every film gets a score. Silent films are not a feature. Skipping music would shave ~20 seconds off some films and make every output feel unfinished.

**The live center-stage experience.** The user watches their film come together in real time. Any optimization that makes generation "invisible" (hiding it behind a spinner, generating in a silent background task) kills the product's positioning. Faster is good; invisible is not. Before optimizing actual speed, verify the center stage remains engaging — a 4-minute generation with a well-narrated center stage beats a 90-second generation with a spinner every time.

### 13.2 Opportunity 1 — Right-size the worker pool (highest-leverage, do this first)

Modules 9, 10, 11, and 13 are all fan-outs: one Celery task per character, per scene, per dialogue line. If the worker pool is smaller than the fan-out width, tasks queue up and run sequentially instead of in parallel. A 7-scene film with 2 workers renders scene images sequentially — roughly 7× slower than the same film with 7+ workers running them concurrently.

**Action:** Size the Celery worker pool based on `expected_concurrent_generations × max_scenes_per_film`. For MVP beta, assume 3 concurrent generations × 10 max scenes = 30 workers. Railway scales the worker service horizontally, so this is a dial, not a code change.

**Caveat:** More workers means more concurrent provider calls, which can trip rate limits on Gemini / fal.ai / ElevenLabs. The circuit breakers (§5.7) protect against this, but at very high concurrency you may hit provider quotas before hitting worker saturation. Monitor `api_call_log` for 429 rate-limit errors per provider; if they appear, your bottleneck is the provider quota, not the worker count.

**Expected win:** Depending on current worker count, 2–5× faster on the fan-out phases. This alone can take a 10-minute film down to 4 minutes.

### 13.3 Opportunity 2 — Stream-copy concat (trivial, safe, high-value)

Module 14 (final concatenation) currently re-encodes N scene clips into a single MP4. If all scene clips are produced with identical codec, resolution, and framerate settings, ffmpeg can concatenate them using stream copy (`-c copy`) instead of re-encoding — the bytes are spliced together without decoding the video streams.

**Action:** In Module 13 (scene assembly), lock the output codec / resolution / framerate / audio sample rate to fixed values so every scene clip matches. In Module 14, use the concat demuxer with `-c copy`. Verify playback on Chrome, Safari, Firefox, iOS, and Android.

**Expected win:** 5–10× faster concat. The final_concat phase drops from ~30 seconds to ~3 seconds for a typical film. This is one of the cheapest wins in the whole list.

**Caveat:** Stream copy is unforgiving — if one scene clip has a slightly different codec profile or audio sample rate, the output can be corrupted or unplayable. Test thoroughly with real outputs across all target platforms before shipping. Keep a re-encode fallback that triggers if stream copy fails (detect via ffmpeg exit code).

### 13.4 Opportunity 3 — Content-hash caching of provider calls

Same prompt + same reference inputs + same model = same output. Cache by content hash in R2.

Particularly valuable for:
- **Scene reshoots:** when a user reshoots scene 3 but other scenes are unchanged, voice synthesis for those scenes' dialogue lines doesn't need to re-run.
- **Development iteration:** when the same test script is used repeatedly in staging, cached hits skip all provider calls.
- **Retries:** when a task retries after a transient failure, the cache hit lets the retry skip re-generation.

**Action:** Add a middleware layer in each provider service (`GeminiService`, `FalService`, `ElevenLabsService`) that hashes the input (prompt + model + parameters + reference image bytes) into a cache key. Check R2 for an existing artifact under that key before making the provider call. If hit, skip the call and reuse the artifact. If miss, make the call, upload the result to R2 under the cache key, return.

**Expected win:** Variable — depends on how often users reshoot scenes and how similar scripts are across users. For reshoots alone, can cut regen time by 50–80% because the unchanged dialogue lines hit cache.

**Caveat:** Content-hash caching across users (not just within a user's own films) raises privacy and licensing questions. Scope the cache per-user in MVP; revisit cross-user caching only after legal review.

### 13.5 Opportunity 4 — Stream-copy voice synthesis

ElevenLabs supports streaming MP3 output for voice synthesis. The current Module 11 implementation waits for the complete MP3 before uploading to R2. With streaming, you can start uploading bytes to R2 (multipart upload) as they arrive from ElevenLabs.

**Action:** Replace the blocking voice call with a streaming variant. Use R2's multipart upload API to stream bytes as they arrive. Scene assembly can't actually start before the voice line is complete (it needs duration and the full audio), so this is mostly a latency smoothing, not a huge wall-clock win.

**Expected win:** 5–15% improvement on voice_synthesis phase duration. Not transformative but easy.

**Caveat:** Streaming failures are harder to handle cleanly — if the ElevenLabs stream drops mid-way, you have a partial file in R2 that needs to be cleaned up. Test the failure path before shipping.

### 13.6 Opportunity 5 — Phase pipelining (complex, defer to v1.1)

The current state machine runs phases strictly in order: all character refs finish before any scene image starts; all scene images finish before any voice synthesis starts. But scene 1 only depends on characters A and B — if A and B are done, scene 1's image can render while character C is still being generated.

Restructuring the pipeline as a dependency graph (scene N waits on its specific character refs, not all character refs) unlocks additional parallelism and can cut 30–40% off total wall-clock time for films with many characters.

**Action:** Replace the state-per-phase machine with a dependency-resolver pattern. Each task declares its dependencies (scene 1 depends on char_A, char_B); when a dependency completes, the resolver schedules any tasks whose dependencies are now fully satisfied. The `films.state` field still reflects the "dominant" phase for the center stage narrative, but individual tasks run as soon as ready.

**Expected win:** 30–40% total wall-clock reduction for films with 4+ characters. Minimal win for 1–2 character films.

**Caveat:** Significant complexity increase. The center stage phase narration blurs because multiple phases are active simultaneously — you'd need to pick a "dominant phase" rule (e.g., "show the phase with the most active work" or "show the earliest phase that's not yet complete"). The activity feed stays accurate because it's per-event, but the phase narrative becomes less crisp.

**Recommendation:** Defer to v1.1. Ship MVP with the current strict phase machine. Revisit only if user feedback shows total generation time as a top friction point.

### 13.7 Opportunity 6 — Pre-warm character refs during CIE

Currently CIE (Module 8) synthesizes all characters' identity descriptions before enqueuing any ref portrait tasks (Module 9). But as soon as one character's CIE description is ready, Pass 1 can start for that character while CIE continues for the others.

**Action:** In the CIE task, instead of updating all characters then fanning out to refs, fan out character-by-character as each CIE is ready.

**Expected win:** Saves the duration of CIE building for N-1 characters (small — maybe 5–10 seconds on a 4-character film).

**Caveat:** Minor refactor, low risk. Worth doing when touching CIE code for other reasons.

### 13.8 Opportunity 7 — Offer a speed-tier model as an option

fal.ai hosts faster image models (e.g., FLUX Schnell) that render in ~1 second vs FLUX Kontext Pro's 3–8 seconds, at lower quality. You could offer a "Quick cut" mode that uses the faster model, or use it for a preview pass while the quality pass runs in the background.

**Action:** Do not do this for MVP. The product positioning ("a real film studio in a tab") is undermined by a quality/speed toggle. If users ask for it post-launch as a common request, revisit.

**Expected win:** 3–5× faster scene image phase.

**Caveat:** Creates a product fork. Quality mode and speed mode become separate products to support. Skip for MVP.

### 13.9 Optimizations we explicitly reject

**Skipping Pass 1.** See §13.1. Do not.

**Speculative pre-rendering.** Starting scene rendering before parse finishes (guessing at scenes while Gemini is still thinking) produces wasted work when guesses are wrong, wastes provider spend, and introduces timing bugs. Not worth the complexity.

**Hiding generation behind a progress bar.** Already addressed in §13.1. Kills the differentiator.

**Client-side assembly.** Running ffmpeg in the browser via WebAssembly (ffmpeg.wasm exists) would shift compute off our infrastructure. Tempting cost-wise, but the user's machine specs are unknown — assembly on a weak phone would be much slower, not faster, and failures would be invisible to us. Keep assembly on the worker.

**Caching across users without isolation.** Privacy concern — users shouldn't be able to infer other users' scripts via cache timing attacks. Per-user cache only until legal signs off on cross-user.

### 13.10 Recommended sequence for MVP beta

In priority order, as it relates to shipping:

1. **Before beta:** Right-size workers (§13.2) and stream-copy concat (§13.3). Both are low-risk and high-value.
2. **During beta:** Add content-hash caching for reshoots (§13.4). Measure real user reshoot frequency to validate the win.
3. **Post-beta:** Voice streaming (§13.5) and CIE pre-warm (§13.7) as minor improvements when the relevant code is next touched.
4. **V1.1 or later:** Phase pipelining (§13.6) — only if total generation time is a top-3 user complaint.
5. **Never (without product signoff):** Speed-tier models (§13.8), skipping Pass 1, cross-user caching.

### 13.11 Measuring the impact

Every optimization must be measured against a baseline. Before shipping any speed change:

1. Capture the current p50 and p95 total generation time from `api_call_log` joined with `films.completed_at - created_at`. Segment by script length (character count, scene count).
2. Deploy the change to staging. Run a representative sample of 20 generations.
3. Compare p50 and p95 post-change. If the improvement is under 10% and complexity increased, consider reverting.
4. After production deploy, watch for 48 hours: error rate, DLQ growth, provider rate limit hits, Railway worker memory. Any anomaly is a reason to roll back.

Speed optimizations that introduce flakiness cost more than the latency they save. Measure twice, ship once.

---

## 14. Cross-Reference Notes

- **Generation phase names** in section 6 are the canonical enum. They are repeated verbatim in `Clevroy_UI_Design_System.md` §8.3 and `Clevroy_UX_Edge_Cases.md` §7. All three docs must stay in sync — this doc is the source of truth.
- **Credit cost model** (1.00 per film, 0.20 per regen, 5.00 signup bonus, partial refund percentages) lives in `Clevroy_Cost_Decisions.md`. This doc implements against those numbers but does not own them.
- **Exact endpoint request/response shapes** are supplemented by `Clevroy_Routing_Flow.md`. If this doc shows a different shape, `Clevroy_Routing_Flow.md` wins.
- **Export details** (exactly what the PDF book looks like, exactly what's in the website ZIP) are in `Clevroy_Export_System.md`. This doc covers the orchestration; that doc covers the output.
- **MVP timeline** is in `Clevroy_MVP_Roadmap.md`. The 20 modules in section 9 map onto the 12-week schedule there — verify module-per-week is achievable against that roadmap.

---

**Backend Handoff version: V1 — April 2026.** Update the version stamp when any of: the state machine enum, the database schema, the API route list, the 20-module sequence, or the performance optimization guidance changes.
