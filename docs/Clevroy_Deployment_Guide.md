# Clevroy Deployment Guide

**Document purpose:** How and when to deploy Clevroy's backend during the build. Answers the questions "what do I use to deploy?" and "when should I start?" so the deployment side of the system is solved in parallel with, not after, the application side.

**Audience:** Junior and mid-level backend developers, plus the solo founder running the build. Read this alongside `Clevroy_Backend_Handoff.md` — this doc covers deployment; that doc covers what you're deploying.

**Status:** V1 — MVP beta guidance. Infrastructure decisions here are locked for beta; any upgrade to more sophisticated tooling (Kubernetes, Terraform, multi-region, etc.) is explicitly deferred to post-launch.

**Inheritance:** Tech stack is locked per `Clevroy_V1_Architecture.md` and `Clevroy_Backend_Handoff.md` §2. Module sequencing follows `Clevroy_Backend_Handoff.md` §9. This doc does not introduce new stack components; it specifies how the locked stack is deployed.

---

## 1. The Headline Answer

**Deploy on day one of Module 1, not Module 20.** Get a `/health` endpoint live on Railway before you write any Clevroy-specific business logic. Every subsequent module ships to the live environment as you finish it.

This is the single most important deployment decision. Everything else in this doc follows from it.

---

## 2. Why Deploy Early

Deployment configuration is its own class of problem. Dockerfiles, environment variables, health checks, worker-as-separate-service, Redis connections, Supabase credentials, R2 authentication — these all have their own failure modes, and those failure modes have nothing to do with your application code.

If you defer deployment until "the app is ready," you hit every deployment failure mode at the worst possible time: while you're also trying to debug application bugs, right before you need to show progress. Every experienced engineer has lived through this. The pattern is: three weeks of feeling good about local development, then a week of hair-pulling when the Dockerfile doesn't build, the Supabase connection string has the wrong format, ffmpeg isn't installed in the container, or environment variables aren't loading the way pydantic-settings expects them to.

Deploying early solves this by **discovering one deployment problem at a time, while the fix is cheap.** Day one you discover that your Dockerfile doesn't build on Railway because you used an Alpine base image and Railway wants Debian. Day three you discover that Railway sets `$PORT` dynamically and your uvicorn start command had a hardcoded port. Day five you discover that Supabase connection strings need `?sslmode=require` appended. Each of those is a 15-minute fix on its own and a three-day nightmare when they all land in the same week.

---

## 3. What to Use (Locked)

The deployment stack mirrors the locked application stack. Do not substitute.

### 3.1 Backend services — Railway

**Railway** hosts the three backend processes as three separate services in one Railway project, all connected to the same GitHub repository:

- **API service** — runs `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Celery worker service** — runs `celery -A app.celery worker --loglevel=info --concurrency=4`
- **Celery beat service** — runs `celery -A app.celery beat --loglevel=info`

Railway's model is that one GitHub connection can power multiple services; each service has its own start command, its own scaling settings, and its own environment variable overrides (though shared variables are easy to set at the project level).

**Why Railway and not alternatives:** Railway is the stack locked in `Clevroy_V1_Architecture.md`. For MVP beta, it's the right call — good developer experience, automatic GitHub integration, Redis addon, sensible defaults, reasonable pricing at low scale. Fly.io and Render are comparable alternatives but weren't the call. Do not propose a swap.

### 3.2 Redis — Railway addon

Railway offers a one-click Redis addon that provisions Redis on the same internal network as your services. Use it. This is better than spinning up Redis elsewhere (Upstash, Redis Cloud, self-hosted) for MVP because:
- It's on the same internal network as the workers, so latency is minimal
- One less vendor to monitor, authenticate to, and pay
- Railway's Redis scaling is adequate for MVP loads

Connection string is exposed via an environment variable (`REDIS_URL`) that Railway injects automatically.

### 3.3 Database and Auth — Supabase (unchanged)

Supabase stays on Supabase's own hosting. Postgres, Auth, and Realtime are their product — you don't host these on Railway. Railway connects to Supabase over the public internet via connection string.

Environment variables needed in Railway:
- `SUPABASE_URL` — the project URL
- `SUPABASE_ANON_KEY` — used by the frontend, not the backend, but sometimes useful
- `SUPABASE_SERVICE_ROLE_KEY` — what the backend uses to bypass RLS for admin operations
- `DATABASE_URL` — the direct Postgres connection string, used by SQLAlchemy and Alembic

### 3.4 Object storage — Cloudflare R2 (unchanged)

R2 stays on Cloudflare. Railway accesses R2 over the public internet via the S3-compatible API. No deployment action on your side beyond configuring credentials.

Environment variables needed in Railway:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME` — primary bucket for generated assets
- `R2_PUBLIC_BASE_URL` — the public URL prefix for signed-URL generation

### 3.5 CI/CD — GitHub Actions (added in week 2–3)

Railway's built-in GitHub integration handles deployment itself — on every push to `main`, Railway rebuilds and redeploys. You don't need GitHub Actions for deployment.

You **do** want GitHub Actions for:
- **Running tests on pull requests** (pytest against a disposable test database)
- **Type checking** (mypy in strict mode)
- **Linting** (ruff for Python; configured via `pyproject.toml`)
- **The copy-audit lint rule** specified in `Clevroy_UX_Edge_Cases.md` §CC-6 and TEST-18 — runs on frontend PRs to catch banned brand-voice words

Set up GitHub Actions in week 2–3, not week 1. Week 1 is for getting the deploy pipeline itself working.

---

## 4. The Dockerfile

One Dockerfile for the whole repo. All three Railway services (API, worker, beat) use the same image but with different start commands. This is simpler than multi-stage builds for MVP and keeps the build cache warm across services.

### 4.1 Base image and system dependencies

Use the official `python:3.12-slim-bookworm` base image (Debian-based). Avoid Alpine — many of Clevroy's dependencies (WeasyPrint in particular) have pre-built wheels only for glibc systems, and Alpine's musl libc causes compile-from-source failures that waste build minutes.

System packages to install in the Dockerfile via `apt-get`:
- `ffmpeg` — required by Module 13 (scene assembly) and Module 14 (final concat)
- `fontconfig`, `libcairo2`, `libpango-1.0-0`, `libpangocairo-1.0-0`, `libgdk-pixbuf2.0-0`, `shared-mime-info` — required by WeasyPrint (Module 17)
- `libffi-dev`, `libssl-dev` — required by some Python cryptography wheels
- `curl` — useful for health checks and debugging

Install these during the image build, not at runtime. Do apt cleanup (`apt-get clean && rm -rf /var/lib/apt/lists/*`) after install to keep image size down.

### 4.2 Python dependencies

Use `pyproject.toml` with `uv` or `pip-tools` for lockfile management. Install dependencies before copying application code so Docker's layer caching keeps the dependency install step warm across code changes.

The core `pyproject.toml` dependencies for Clevroy:
- `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`
- `celery[redis]`, `redis`
- `sqlalchemy`, `alembic`, `psycopg2-binary` (or `asyncpg` if going async-first)
- `supabase` (the Python client for Auth + Realtime)
- `boto3` (for R2's S3-compatible API)
- `google-generativeai` (Gemini)
- `httpx` (for fal.ai and ElevenLabs calls)
- `weasyprint`, `jinja2`
- `structlog` or `python-json-logger` (for structured JSON logging per Handoff §5.12)

Dev dependencies (separate group): `pytest`, `pytest-asyncio`, `mypy`, `ruff`, `pytest-cov`.

### 4.3 Non-root user

Run the application as a non-root user in the container. Create a `clevroy` user, chown the app directory, and `USER clevroy` before the CMD. This is a security best practice that costs nothing and prevents a whole class of container-escape issues.

### 4.4 What Railway provides

Railway injects the following automatically — do not hardcode:
- `$PORT` — the port your app must bind to (always use `--port $PORT` in uvicorn)
- `$RAILWAY_ENVIRONMENT` — which environment you're in (production, staging, etc.)
- `$RAILWAY_PUBLIC_DOMAIN` — the public URL Railway assigns

If you hardcode a port or assume your URL, you'll break in production. Always read from env vars.

---

## 5. Environment Separation

Railway supports environments natively. Set up **at least two** from day one:

### 5.1 Production environment

- Its own set of Railway services (API, worker, beat)
- Its own Railway Redis instance
- Connects to the **production Supabase project**
- Connects to the **production R2 bucket**
- Environment variables are prod secrets
- Auto-deploys from the `main` branch

### 5.2 Staging environment

- Its own set of Railway services (same topology as production)
- Its own Railway Redis instance
- Connects to a **separate staging Supabase project** (Supabase's free tier covers this)
- Connects to a **separate staging R2 bucket** (R2 has generous free tier)
- Environment variables point to test API keys where possible (Gemini allows this; fal.ai and ElevenLabs may require the same keys but with lower rate limits you self-enforce)
- Auto-deploys from a `staging` branch or from PRs labeled for staging deploy

### 5.3 Why two environments from day one

You will eventually write a script that deletes or modifies data. That script will have a bug. The first time you run it, it needs to run against staging, not production. Without environment separation, your options are "don't write the script" (bad) or "run it on prod and hope" (worse).

The cost of two environments on Railway, Supabase, and R2 is essentially nothing at MVP scale. The cost of not having them is measured in user trust lost the first time you accidentally wipe real data. Set them up in Module 1.

### 5.4 Local development

Local dev uses `.env.local` files (gitignored) with a mix of: local Postgres or a Supabase dev project, local Redis via Docker Compose, and either the staging R2 bucket or a test-mode provider stub (per Handoff §11.5 — the `MOCK_PROVIDERS=true` flag).

---

## 6. Deployment Sequence by Module

This is what actually gets deployed when, mapped onto the 20-module sequence in `Clevroy_Backend_Handoff.md` §9.

### 6.1 Module 1 — project skeleton

**Deploy action:** Full Railway setup happens here.
1. Create Railway project
2. Connect GitHub repo (can be nearly empty — just a README)
3. Add Redis addon
4. Add production and staging environments
5. Configure environment variables (Supabase, R2, provider keys) in both environments
6. Commit the minimal FastAPI app + Dockerfile + pyproject.toml
7. Push to `main` and watch Railway build and deploy
8. `curl https://<railway-url>/health` returns `{"status": "ok"}`

Time budget: 4–8 hours for a first-time Railway user, 2–3 hours for someone who has deployed Python services before.

### 6.2 Module 2 — database setup

**Deploy action:** Run Alembic migrations against Supabase (both staging and production).

The migration runner is a one-off command executed locally or via a Railway "one-off task" feature. Do not run migrations from the API service at startup — that's a race condition waiting to happen when you scale to multiple API instances.

### 6.3 Module 6 — Celery infrastructure

**Deploy action:** Add the worker and beat services to the Railway project. All three services (API, worker, beat) now auto-deploy on push to `main`.

After this module, every subsequent module ships automatically when merged. The rest of the build becomes a pure development exercise; deployment is solved.

### 6.4 Modules 7–20

**Deploy action:** None per module. Push to `main` ships the change. Push to `staging` ships to staging for integration testing before the production merge.

This is the payoff of front-loading deployment work. By Module 7, deployment is background noise.

---

## 7. Monitoring from Day One

Railway's built-in logs are adequate for Module 1 but not for production beta. Set up log aggregation before Module 20, ideally by Module 10 (when generation logic starts producing meaningful logs).

### 7.1 Log aggregation

Structured JSON logs (per Handoff §5.12) flow into Railway's log viewer natively. To aggregate across services and retain for >7 days, forward logs to one of:

- **Axiom** — generous free tier, simple to set up with Railway
- **Datadog** — overkill for MVP but fine if you already use it
- **Grafana Loki** — self-hosted option if you want full control

For MVP, Axiom is the recommendation. Free tier covers Clevroy's expected log volume for the entire beta period. Setup is a Railway log drain configuration — no code changes.

### 7.2 Alerts

Set up these alerts before beta launch, not after:

- **API error rate > 1%** over a 5-minute window
- **Celery queue depth > 100** (a backlog is forming)
- **Worker memory > 80%** sustained (OOM risk)
- **Circuit breaker trips** (any provider — means an outage is happening)
- **Any 500 error from `/api/films` POST** (film creation failures are user-visible and revenue-impacting)
- **DLQ grows by more than 10 entries/hour** (something is systematically failing)

Alerts go to your phone via SMS or a dedicated Slack channel. Don't use email alone — email alerts get ignored.

### 7.3 Uptime monitoring

External uptime monitoring hits `/health` every minute from outside Railway's network. Use any of: UptimeRobot (free), Better Stack, Pingdom. This catches "Railway is up but our app is broken" scenarios that internal monitoring can't.

---

## 8. What Not to Do

**Do not introduce Kubernetes.** Railway's click-to-deploy is correct for MVP. K8s adds months of complexity for zero benefit at your scale.

**Do not introduce Terraform.** Railway's environment configuration is manageable through its UI and CLI. IaC is valuable when you have 50 services across 5 regions, not when you have 3 services in one region.

**Do not build a custom CI/CD pipeline.** GitHub Actions for tests + Railway's auto-deploy is sufficient. Custom pipelines with approval gates, canary deploys, blue-green deploys — all defer to post-launch.

**Do not run Postgres on Railway.** Supabase is your database host. Don't duplicate Postgres on Railway "just in case." One database, managed by Supabase, with proper backups.

**Do not deploy to multiple regions for MVP.** Single region (Railway's US or EU, whichever is closest to most users) is correct. Multi-region adds consistency problems that aren't worth solving pre-launch.

**Do not optimize cold starts.** Railway services stay warm in the plans you'll use. Cold start optimization is a waste of time for MVP.

**Do not use serverless (Vercel Functions, AWS Lambda, Cloudflare Workers) for the backend.** Clevroy's backend is a long-running process with stateful Celery workers. Serverless is fundamentally the wrong shape. The frontend on Vercel is fine — the backend isn't.

**Do not skip staging.** The first time you run a destructive migration or a data-cleanup script against production without testing on staging, you will regret it. Staging costs ~$0. Regret costs trust.

---

## 9. When to Upgrade the Deployment Setup

Most of the "don't do this yet" items in §8 are correct for MVP but wrong forever. Here are the signals that indicate it's time to revisit:

- **You're deploying more than 20 times per day across a team of 3+:** time to add PR-based preview environments and merge queue.
- **You have paying users in more than one continent:** time to evaluate multi-region or at least CDN caching at the edge.
- **Your Railway bill is >$500/month:** time to evaluate whether another host is better value (or whether you should be reserving instances instead of paying on-demand).
- **You've had more than two "someone shipped to prod and it broke" incidents in a quarter:** time to add a manual approval gate or canary deploys.
- **Engineering team grows beyond 5:** time for proper IaC so config isn't tribal knowledge.

Until one of those signals fires, the Railway + Supabase + R2 + GitHub Actions setup described in this doc is correct. Do not upgrade preemptively.

---

## 10. Disaster Recovery

MVP disaster recovery is minimal but non-zero. Have answers to these before beta launch:

**If Railway goes down:** You can't deploy, but your users aren't affected as long as Railway's runtime is up. Railway's incident history is public; real outages are rare. No action.

**If Railway has a data issue affecting your deployed services:** Your services are rebuilt from the GitHub repo. Code is safe. State is in Supabase and R2, neither of which are on Railway. The worst case is a few minutes of downtime while Railway restores.

**If Supabase goes down:** This is the real risk. Every authenticated API call fails. There is no "fallback" database for MVP — accept this and monitor Supabase's status page. Post-MVP, consider read replicas or a separate analytics database that can keep serving cached data.

**If Cloudflare R2 goes down:** New file uploads fail. Existing films can still be viewed if the signed URLs were issued before the outage and cached by the browser. Accept this for MVP.

**If a provider (Gemini / fal.ai / ElevenLabs) goes down:** Circuit breakers (Handoff §5.7) handle this gracefully. Users see appropriate error messages, credits are refunded, the system self-recovers when the provider returns. No action needed.

**Backups:**
- Supabase: enable daily automated backups in the Supabase dashboard. Free on paid tiers; critical.
- R2: no backup service, but Cloudflare's durability guarantees are strong (11 nines). Don't re-architect for R2 backup unless a real use case emerges.
- Code: GitHub is the backup. All deployment configuration is either in the repo (Dockerfile, `pyproject.toml`) or recreatable from the Railway UI.

---

## 11. Cost Expectations at MVP

Rough monthly cost for Clevroy at beta launch (pre-users, or with <100 users):

- **Railway:** $20–50/month for three small services + Redis. Scales to $100–300 with light beta traffic.
- **Supabase:** Free tier covers early development. $25/month Pro plan recommended once you have real users (better backup retention, more connections, longer data retention).
- **Cloudflare R2:** Storage is cheap (~$0.015/GB/month), egress is free. Expected cost under $10/month for MVP beta.
- **Vercel (frontend):** Free for hobby, $20/month for Pro once you ship to a custom domain.
- **GitHub:** Free for private repos.
- **Provider costs:** By far the biggest line item — see `Clevroy_Cost_Decisions.md` for per-film cost analysis. Deploy costs are a rounding error compared to Gemini + fal.ai + ElevenLabs spend.

Total deployment/infrastructure cost for MVP beta: **~$100–200/month before counting AI provider spend.** This is low enough that it's not worth optimizing.

---

## 12. Cross-Reference Notes

- **Tech stack** (Python 3.12, FastAPI, Celery, Redis, Supabase, R2, Railway) is locked in `Clevroy_V1_Architecture.md` and `Clevroy_Backend_Handoff.md` §2. This doc is the deployment expression of that stack.
- **Three-service architecture** (API, worker, beat) is specified in `Clevroy_Backend_Handoff.md` §3. This doc describes how each one gets deployed.
- **Module sequence** referenced in §6 of this doc mirrors `Clevroy_Backend_Handoff.md` §9. If the module order or contents change there, update this doc's deployment checkpoints to match.
- **Structured logging format** comes from `Clevroy_Backend_Handoff.md` §5.12. This doc specifies where those logs go (Axiom / Datadog / Loki).
- **Circuit breaker behavior** in §10 disaster recovery is specified in `Clevroy_Backend_Handoff.md` §5.7. This doc references it for DR planning but does not redefine it.
- **Provider cost expectations** referenced in §11 live in `Clevroy_Cost_Decisions.md`.

---

**Deployment Guide version: V1 — April 2026.** Update the version stamp when any of: the deployment host, the three-service topology, the environment separation strategy, or the monitoring stack changes.
