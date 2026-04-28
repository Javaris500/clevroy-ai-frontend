# Clevroy Starter Repo Structure

**Document purpose:** The exact file-and-folder layout of the Clevroy backend starter repo. Every junior who joins should be able to clone this, run `make dev`, hit a working health endpoint, and start on Module 1 of `Clevroy_Backend_Handoff.md` §9 within an hour.

**Why this exists:** Without a starter repo, every developer spends their first day configuring Python 3.12, pyproject.toml, Alembic, Celery, Docker, Railway, and Supabase connections from scratch — using the deployment guide as a tutorial. That's a half-day per person, times every person who touches the project, forever. A working starter repo turns Module 1 from "figure out the scaffolding" into "add the first real feature."

**Status:** V1 — MVP beta. This structure is a suggestion; the actual repo might evolve in small ways during Module 1, and that's fine. The point is: **build the starter once, clone it many times.**

**Inheritance:** Stack per `Clevroy_Backend_Handoff.md` §2. Three-service topology per `Clevroy_Backend_Handoff.md` §3. Deployment per `Clevroy_Deployment_Guide.md`.

---

## 1. What the Starter Repo Contains

A minimum-viable but **complete** backend skeleton. When a dev clones this, the following is already working:

- One FastAPI `/health` endpoint that returns `{"status": "ok"}`.
- One Celery task (`ping_task`) that logs a structured JSON line.
- One SQLAlchemy model (`User` stub) so Alembic has something to migrate.
- One Alembic migration that creates the stub table.
- One pytest test that passes (`test_health.py`).
- A Dockerfile that builds cleanly and runs on Railway.
- A docker-compose for local dev (Postgres, Redis, the three services).
- A Makefile with `make dev`, `make test`, `make migrate`, `make lint`.
- A README that tells you exactly how to start.

This is the foundation. Module 1 expands on it instead of building it from zero.

---

## 2. Folder Layout

```
clevroy-backend/
├── .github/
│   └── workflows/
│       ├── test.yml                 # pytest on PRs
│       └── lint.yml                 # ruff + mypy on PRs
├── alembic/
│   ├── versions/
│   │   └── 0001_initial.py          # creates the stub users table
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI entrypoint
│   ├── celery_app.py                # Celery configuration
│   ├── config.py                    # Settings loaded via pydantic-settings
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                  # FastAPI dependencies (auth, db session)
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── health.py            # GET /health
│   ├── core/
│   │   ├── __init__.py
│   │   ├── database.py              # SQLAlchemy engine and session
│   │   ├── logging.py               # structlog configuration
│   │   └── r2.py                    # Cloudflare R2 client setup (stub)
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py                  # stub — expanded in Module 2
│   ├── services/
│   │   ├── __init__.py
│   │   └── __placeholder__.py       # expanded in Module 3
│   ├── tasks/
│   │   ├── __init__.py
│   │   └── ping.py                  # ping_task — proves Celery works
│   └── providers/
│       ├── __init__.py
│       ├── gemini.py                # stub — expanded in Module 7
│       ├── fal.py                   # stub — expanded in Modules 9, 10
│       └── elevenlabs.py            # stub — expanded in Modules 11, 12
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # pytest fixtures (test DB, client)
│   └── test_health.py               # verifies GET /health returns 200
├── decisions/
│   └── README.md                    # explains the decision-record pattern
├── scripts/
│   ├── run_migrations.py            # one-off migration runner for Railway
│   └── seed_dev.py                  # optional — populate local dev DB
├── .dockerignore
├── .env.example                     # template for required env vars
├── .gitignore
├── .python-version                  # pins Python 3.12
├── alembic.ini
├── docker-compose.yml               # local dev: postgres + redis + services
├── Dockerfile                       # single image for all three services
├── Makefile
├── pyproject.toml                   # dependencies pinned
├── README.md                        # onboarding guide
└── railway.json                     # Railway service-specific config (optional)
```

Total at starter: ~25 source files. By the end of Module 20, the repo will be 5–10× that. Start small; grow with the modules.

---

## 3. What Each Top-Level Folder Is For

### `app/`

The application code. Everything Python that runs in production lives here. Subdivided by concern:

- **`api/`** — FastAPI routers and dependencies. Thin controllers only (per `Backend_Handoff.md` §5.1).
- **`core/`** — Cross-cutting infrastructure (database, logging, R2 client). Things that every feature uses.
- **`models/`** — SQLAlchemy ORM models. One file per table, roughly.
- **`services/`** — Business logic. `FilmService`, `CreditService`, etc. Pure Python, no FastAPI.
- **`tasks/`** — Celery tasks. One file per logical pipeline stage.
- **`providers/`** — External AI provider clients. Isolates Gemini / fal.ai / ElevenLabs calls.

### `alembic/`

Database migrations. Every schema change is a new file in `versions/`. Never run raw `ALTER TABLE` in production.

### `tests/`

Pytest suite. Mirror the `app/` structure — tests for `app/services/credit_service.py` go in `tests/services/test_credit_service.py`.

### `decisions/`

Decision records. Every time a dev makes a non-obvious call that isn't covered by existing docs, they write a three-paragraph file here with `Context / Decision / Consequences`. Committed alongside the code that implements the decision. Named `YYYY-MM-DD-short-title.md`.

### `scripts/`

One-off utilities. Migration runners, seed scripts, data-repair scripts. Run manually, not as part of the normal app lifecycle.

### `.github/workflows/`

GitHub Actions CI. Runs tests and linting on every PR. Deployment is handled by Railway's auto-deploy, not by Actions.

---

## 4. The Key Files in Detail

### 4.1 `pyproject.toml`

Dependencies are pinned (not loose versions). Dev dependencies are in a separate group so production images don't include pytest and mypy.

**Core runtime deps to pin at MVP start:**
- `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`
- `celery[redis]`, `redis`
- `sqlalchemy`, `alembic`, `psycopg2-binary`
- `supabase` (for Auth + Realtime client)
- `boto3` (for R2)
- `google-generativeai` (Gemini)
- `httpx` (for fal.ai and ElevenLabs — they don't have first-party SDKs worth using)
- `weasyprint`, `jinja2`
- `structlog`, `python-json-logger`
- `python-multipart` (for FastAPI file uploads)

**Dev deps:**
- `pytest`, `pytest-asyncio`, `pytest-cov`, `httpx` (reused for async test client)
- `mypy`, `ruff`, `types-*` for the typed libraries you use

**Build config:**
- Use `uv` or `pip-tools` to generate and maintain a lockfile. Commit the lockfile. Docker installs from the lockfile, not from pyproject alone.

### 4.2 `Dockerfile`

One Dockerfile, used by all three Railway services with different start commands. Debian-based (`python:3.12-slim-bookworm`), not Alpine. System packages for ffmpeg and WeasyPrint installed during build. Runs as non-root user. `$PORT` respected from environment. See `Clevroy_Deployment_Guide.md` §4 for the full spec.

### 4.3 `docker-compose.yml`

Local dev environment. Spins up:
- Postgres 16
- Redis 7
- The API service (uvicorn with reload)
- The Celery worker service
- The Celery beat service

All four app services share the same image (built locally from the Dockerfile) with different commands. Postgres and Redis run as standalone containers. Devs run `docker compose up` and have a full local stack on localhost.

**Why docker-compose for local dev:** guarantees parity with Railway. If it works in compose, it works in Railway. No "works on my machine" surprises.

### 4.4 `Makefile`

The daily-driver commands a dev runs. Keep it short.

**Required targets:**
- `make dev` — start the local stack via docker-compose
- `make test` — run pytest with coverage
- `make lint` — run ruff + mypy
- `make format` — run ruff format
- `make migrate` — run `alembic upgrade head` against the local DB
- `make migration NAME=description` — generate a new Alembic migration
- `make shell` — drop into a Python REPL with the app context loaded
- `make logs` — tail logs from all services
- `make clean` — tear down docker-compose, remove volumes

Avoid the temptation to add 20 targets. If a command isn't run daily, it doesn't belong in the Makefile.

### 4.5 `.env.example`

The template for local `.env` (gitignored). Every environment variable the app reads has an entry here, with a placeholder or a comment explaining what it is. This is the contract for setup — if a new dep needs a new env var, the `.env.example` is updated in the same PR.

**Required vars at starter:**
- `DATABASE_URL` — full Postgres connection string
- `REDIS_URL` — Redis connection string
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`
- `GEMINI_API_KEY`, `FAL_API_KEY`, `ELEVENLABS_API_KEY`
- `ENVIRONMENT` — `local` / `staging` / `production`
- `LOG_LEVEL` — `INFO` default
- `MOCK_PROVIDERS` — `true` in dev to skip real AI calls, `false` in staging/production

### 4.6 `README.md`

The onboarding guide. Should get a new dev from `git clone` to a running local app in under 30 minutes. Keep it short and tactical.

**Required sections:**
1. **What this is** — one paragraph on what Clevroy's backend does.
2. **Prerequisites** — Python 3.12, Docker, Make, a Supabase project, a Cloudflare R2 bucket.
3. **First-time setup** — clone, copy `.env.example` to `.env`, fill in values, `make dev`, `make migrate`, verify `curl localhost:8000/health`.
4. **Daily workflow** — branch, code, `make test`, `make lint`, push, PR.
5. **Where to find things** — a short list pointing at the reference docs (link to `Clevroy_Dev_Quickstart.md`).
6. **Getting help** — the team channel and the troubleshooting order from `Clevroy_Dev_Quickstart.md` §"When You're Stuck."

Do **not** put architectural content in the README. Link to the reference docs instead. Architectural prose in the README rots silently — kept short, the README stays current.

### 4.7 `app/config.py`

Settings object using pydantic-settings. Loads from environment variables with validation. One place for all configuration. Every other module imports `from app.config import settings`. Never call `os.environ` directly anywhere else.

### 4.8 `app/core/logging.py`

Structured JSON logging configuration using structlog or python-json-logger. Applied to the root logger at app startup. Every log line includes: `timestamp`, `level`, `service` (api / worker / beat), `event`, plus task/film/user IDs as contextual binding.

### 4.9 `app/core/database.py`

SQLAlchemy engine creation, session factory, and a FastAPI dependency for getting a session per request. For Celery tasks, a separate session manager (context-managed) since tasks aren't request-scoped.

### 4.10 `app/celery_app.py`

Celery instance with the required settings from `Backend_Handoff.md` §5.5:
- `task_acks_late = True`
- `task_reject_on_worker_lost = True`
- `worker_prefetch_multiplier = 1`
- `task_serializer = "json"`, `result_serializer = "json"`
- Redis broker URL from config
- Auto-discovery of tasks in `app/tasks/`

### 4.11 `app/tasks/ping.py`

The canonical "prove Celery works" task. Takes no arguments, logs a structured line with `event: "ping_task_executed"`, returns the current timestamp. Used as a smoke test that the worker service is alive and connected to the broker.

### 4.12 `tests/conftest.py`

Shared pytest fixtures:
- `test_db` — spins up a disposable Postgres database per test run (or uses transactions with rollback for speed)
- `client` — FastAPI `TestClient` fixture with dependency overrides
- `celery_app` — Celery in eager mode for tests (tasks run synchronously)

### 4.13 `.github/workflows/test.yml`

Runs on every PR:
1. Checkout
2. Set up Python 3.12
3. Install deps from the lockfile
4. Spin up Postgres and Redis as service containers
5. Run `make migrate`
6. Run `make test`
7. Upload coverage report

### 4.14 `.github/workflows/lint.yml`

Runs on every PR:
1. Checkout
2. Set up Python 3.12
3. Install deps
4. Run `ruff check`
5. Run `ruff format --check`
6. Run `mypy app/`

Failures block merging.

### 4.15 `alembic/versions/0001_initial.py`

The first migration. Creates a minimal `users` table stub (just `id UUID PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW()`) so Alembic has something real to do on first run. Replaced/expanded in Module 2 with the full 8-table schema from `Backend_Handoff.md` §7.

### 4.16 `decisions/README.md`

Explains the decision-record pattern for future devs. Three paragraphs: what a decision record is, when to write one, the three-section template (Context / Decision / Consequences). References the Dev Quickstart's "Three Rules of Writing Decisions."

---

## 5. The Frontend Side (Separate Repo)

The frontend is a separate repo (`clevroy-frontend`) with its own starter. Key points:

- **Next.js 15 App Router** + React 18 + Tailwind v4 + shadcn/ui + Zustand + TanStack Query + Framer Motion + Vercel AI SDK.
- **Capacitor v7** for the iOS/Android wrapper. Mobile build runs the same Next.js app inside a native shell.
- **Monorepo vs separate repos:** separate for MVP. Monorepo tooling (Turborepo, Nx) is overhead you don't need yet. Two repos, one shared types package (§6 below), is cleaner at this stage.
- **Deployment:** Vercel for the web target. Capacitor build happens in GitHub Actions and produces iOS/Android artifacts.

A full `clevroy-frontend` starter spec is out of scope for this doc but follows the same pattern: minimal working app, shadcn components installed, one page rendering, one TanStack Query hook talking to the backend's `/health`.

---

## 6. The Shared Types Package (`@clevroy/types`)

**This is the single highest-value integration investment for the project.** Build it in week one.

### 6.1 What it does

A small npm package containing TypeScript types for:
- The generation state enum (12 values from `Backend_Handoff.md` §6)
- API request/response shapes (all routes from `Backend_Handoff.md` §8)
- Realtime event payloads (the shapes of events broadcast from Supabase Realtime)
- Any other backend-frontend contract

The types are **generated from the backend's Pydantic models**, not hand-written. This means backend changes automatically produce new types; hand-drift is impossible.

### 6.2 How it works

1. Pydantic models on the backend are the source of truth.
2. A script (`scripts/generate_types.py` in the backend repo) uses `datamodel-code-generator` or `pydantic-to-typescript` to emit `.d.ts` files.
3. The generated `.d.ts` files are committed to a small npm package (`@clevroy/types` on a private npm registry or GitHub packages).
4. The frontend installs `@clevroy/types` as a regular dependency.
5. On backend PRs that change Pydantic models, CI runs the generator and opens a PR against the types package. Merging updates the types.

### 6.3 Why it's worth it

Without this:
- Backend changes a field name; frontend keeps using the old name; bug discovered in production.
- Frontend developer guesses at a response shape; gets it slightly wrong; silent data loss.
- Contract drift accumulates over months; a major refactor is needed to fix it.

With this:
- Backend changes a field name; frontend's TypeScript compile breaks before merge; developer sees it immediately.
- Frontend developer can't guess — the types are the contract.
- Drift is impossible because types are generated, not maintained.

This is a day of setup that pays back every week of the project. Build it in week one alongside the starter repo.

---

## 7. Environment-Specific Configuration

Three environments, three `.env` files, one set of code. The starter should make this obvious:

- **Local dev:** `.env` (gitignored), filled in by each dev from `.env.example`. `ENVIRONMENT=local`, `MOCK_PROVIDERS=true`.
- **Staging on Railway:** env vars configured in Railway's staging environment. `ENVIRONMENT=staging`, `MOCK_PROVIDERS=false`, connects to staging Supabase and staging R2.
- **Production on Railway:** env vars configured in Railway's production environment. `ENVIRONMENT=production`, `MOCK_PROVIDERS=false`.

The starter code should **fail loudly** on startup if any required env var is missing. Use pydantic-settings' validation: missing env vars raise on startup, not at the first request. Discovering a missing `R2_BUCKET_NAME` via a 500 error in production is worse than discovering it via a failed deploy.

---

## 8. What the Starter Does Not Include

Resist the urge to front-load everything. The starter includes only what's needed to get a dev productive on Module 1. It explicitly does **not** include:

- Real implementations of any generation phase (that's Modules 7–14)
- The full database schema (that's Module 2)
- All API routes (that's Module 5)
- Authentication logic (that's Module 4)
- Any AI provider calls (those ship with their respective modules)
- Payment integration
- Email sending
- Analytics

Those are all in the 20-module sequence. The starter is a scaffold, not a shortcut.

---

## 9. How to Build It

**One person, two days.** Most likely you (Roy) since you're leading the backend. The steps:

1. **Day 1 morning:** Create the repo, add the folder structure from §2, write the Dockerfile, pyproject.toml, and docker-compose.yml. Get `docker compose up` to bring up Postgres + Redis + an empty FastAPI app locally.
2. **Day 1 afternoon:** Add the `/health` endpoint, the ping task, the stub User model, the 0001 Alembic migration, the conftest.py, and test_health.py. Run `make test` and confirm it passes.
3. **Day 2 morning:** Wire up Railway — create the project, add the three services pointing at the repo, add Redis addon, configure env vars, push to `main`, confirm auto-deploy works and `/health` responds publicly.
4. **Day 2 afternoon:** Set up the `@clevroy/types` package skeleton, even if it only exports the state enum at first. Write the README. Tag the commit as `v0.1.0-starter`.

After this, every junior who joins clones the repo at the `v0.1.0-starter` tag, reads the README, and is productive within an hour.

---

## 10. Maintaining the Starter

The starter is a living thing, not a frozen template. As the build progresses, the starter gets enriched — but carefully:

- **Do update** `.env.example` when a new required env var is added.
- **Do update** the Dockerfile when new system packages are needed.
- **Do update** the Makefile when a common command becomes useful.
- **Do update** the README when the first-time setup steps change.
- **Do not update** the starter with module-specific code. Module 7's Gemini integration doesn't belong in the starter — it belongs in the repo at the end of Module 7.

A useful rule: if every future dev needs it on day one, it's starter material. If only the dev working on the current module needs it, it's module material.

---

## 11. Cross-Reference Notes

- **Three-service topology** (API, worker, beat) follows `Backend_Handoff.md` §3.
- **Celery settings** (`acks_late`, etc.) in `app/celery_app.py` mirror `Backend_Handoff.md` §5.5. Do not deviate.
- **Docker system packages** (ffmpeg, WeasyPrint deps) specified in `Clevroy_Deployment_Guide.md` §4.1.
- **Environment variables** list mirrors `Clevroy_Deployment_Guide.md` §3.3 and §3.4.
- **The types package** design in §6 is a new decision — `Clevroy_Routing_Flow.md` and `Clevroy_Backend_Handoff.md` §8 should reference the generated types as the canonical contract once the package exists.
- **Module 1** in `Backend_Handoff.md` §9.1 should be updated to say "expand the starter repo" rather than "build the skeleton" — the starter makes Module 1 faster, not replaced.

---

**Starter Repo Structure version: V1 — April 2026.** Update the version stamp when the folder layout, the core dependency list, or the three-service topology changes.
