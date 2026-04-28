# Clevroy Dev Quickstart

**Open this every morning. Close everything else.**

This is the single page you read to know what to build today. The five reference docs (`Clevroy_Brand_Guide`, `Clevroy_UI_Design_System`, `Clevroy_UX_Edge_Cases`, `Clevroy_Backend_Handoff`, `Clevroy_Deployment_Guide`) are the library. This is the daily driver.

---

## The 30-Second Context

Clevroy turns a user's script into a watchable short film in 3–10 minutes, streamed live to a "center-stage" screen so the user watches it come together like dailies from set. That's the product. Everything else serves that.

**Stack (locked, do not swap):** Python 3.12 / FastAPI / Celery + Redis / Supabase (Postgres + Auth + Realtime) / Cloudflare R2 / Railway / Next.js 15 / shadcn + Tailwind v4 / Capacitor v7.

**Providers (locked):** Gemini for parsing, fal.ai for images (FLUX Kontext Pro single-char, Nano Banana 2 multi-char), ElevenLabs for voice AND music, WeasyPrint for PDFs.

**The defining quality bet:** two-pass image generation. Pass 1 = reference portraits per character. Pass 2 = scene images conditioned on those portraits. This is the product. Do not skip it.

---

## What to Build Right Now

The 20 modules from `Clevroy_Backend_Handoff.md` §9 group into three phases. Know which phase you're in.

### Phase 1 — Foundation (Modules 1–6) — weeks 1–3

> "The pipes work. Nothing generates yet."

Skeleton, database, services, auth, API endpoints, Celery infrastructure. **Done when:** a test Celery task updates a film's state in the database and the frontend sees the change via Realtime. No AI calls yet, no real generation. Just proof the plumbing works end-to-end.

### Phase 2 — Generation core (Modules 7–14) — weeks 4–8

> "The product actually works."

Parse → CIE → character refs → scene images → voice → music → scene assembly → final concat. **Done when:** you paste a real script, hit Start, and watch a complete MP4 film get generated and played back. This is where the product is born.

### Phase 3 — Exports and polish (Modules 15–20) — weeks 9–12

> "The product ships."

Download URLs, scene regen, book PDF, website ZIP, AI Twin, housekeeping. **Done when:** every feature in the MVP scope works and the cleanup tasks are running. Beta-ready.

---

## Today's Task

Find your current module in `Clevroy_Backend_Handoff.md` §9. The deliverable and verification are there. Before you start coding, answer these three questions:

1. **What does this module deliver?** One sentence. If you can't say it, re-read §9 for your module.
2. **How will I know it's done?** The "Verification" line in §9. This is your done criteria. Do not move on without hitting it.
3. **What does the next module assume I got right?** Look at Module N+1's "Inputs" line. That's the contract you're building to.

Now open the reference docs for your module. Most modules need two or three sections, not whole docs. Use the table below.

### Where to look, by module

| Module | Primary reference | Secondary references |
|---|---|---|
| 1 — Skeleton | `Backend_Handoff` §2 (stack), `Deployment_Guide` §4 (Dockerfile) | `Deployment_Guide` §6.1 |
| 2 — Database | `Backend_Handoff` §7 (full schema) | `Backend_Handoff` §5.10 (NUMERIC(8,2)), §7.11 (RLS) |
| 3 — Services | `Backend_Handoff` §5.3 (idempotent), §5.10 (credit math) | `UX_Edge_Cases` EC-G6 (refund math) |
| 4 — Auth | `Backend_Handoff` §8.1 (auth routes), §7.11 (RLS) | `UX_Edge_Cases` EC-N5 (session expiration) |
| 5 — Endpoints | `Backend_Handoff` §8 (all routes) | `Clevroy_Routing_Flow.md` for exact shapes |
| 6 — Celery | `Backend_Handoff` §3 (three services), §5.5 (ack settings) | `Deployment_Guide` §3.1 (three services) |
| 7 — Parse | `Backend_Handoff` §4 step 2, §6 (state enum) | `UI_Design_System` §8.3 (phase narration) |
| 8 — CIE | `Backend_Handoff` §4 step 3 | `Backend_Handoff` §5.6 (two-pass) |
| 9 — Character refs (Pass 1) | `Backend_Handoff` §5.6, §4 step 4 | **Run the spike first** (see §Must-Do below) |
| 10 — Scene images (Pass 2) | `Backend_Handoff` §5.6, §4 step 5 | The hardest module. Allocate extra time. |
| 11 — Voice | `Backend_Handoff` §4 step 6 | `Brand_Guide` §5.3 (voice twin language) |
| 12 — Music | `Backend_Handoff` §4 step 7 | — |
| 13 — Scene assembly | `Backend_Handoff` §4 step 8, §5.11 (temp files) | `Backend_Handoff` §13.3 (stream-copy concat) |
| 14 — Final concat | `Backend_Handoff` §4 step 9, §13.3 | — |
| 15 — Download URLs | `Backend_Handoff` §8.5 | One-day module. Don't overthink it. |
| 16 — Scene regen | `Backend_Handoff` §8.4 | `UX_Edge_Cases` EC-G8 (rapid clicks) |
| 17 — Book PDF | `Clevroy_Export_System.md` | `Brand_Guide` §4 (Fraunces for chapter titles) |
| 18 — Website ZIP | `Clevroy_Export_System.md` | `Brand_Guide` §2 (colors) |
| 19 — AI Twin | `Backend_Handoff` §8.7 | `UX_Edge_Cases` EC-N10 (training failure) |
| 20 — Housekeeping | `Backend_Handoff` §5.9 (DLQ), §5.11 (temp files) | `UX_Edge_Cases` EC-G6 (refund logic) |

---

## The Must-Do Before Week Two

**Run the two-pass quality spike.** Half a day. A throwaway Python script that:
1. Calls fal.ai FLUX Kontext Pro with a synthetic character description, saves the portrait.
2. Calls FLUX Kontext Pro again with the portrait as reference + a new scene description. Saves the scene image.
3. Calls Nano Banana 2 with two portraits + a multi-character scene description. Saves that image.
4. Opens all three images next to each other and looks at them with your own eyes.

If the faces are consistent between the reference and the scene, the product works. Proceed with confidence.

If the faces drift, you need to fix prompting, switch models, or re-architect before Module 9. Better to know this now than in week six. **Do not skip this spike.**

---

## The Eight Rules Your Future Self Will Thank You For

These are the shortcuts that prevent the most common failures on this stack. Print them, post them, follow them.

1. **Thin API, thick workers.** If an endpoint takes >500ms, it belongs in a Celery task.
2. **Async in FastAPI, sync in Celery.** Never mix them inside the same function.
3. **Idempotent tasks.** Every Celery task is safe to run twice. Check state, exit early if already done.
4. **Upload first, write second.** File → R2 → database row with the R2 key. Never the reverse.
5. **NUMERIC(8,2) forever.** Never cast credits to `float`. Use `Decimal` start to finish.
6. **Temp dirs, not `/tmp`.** Every task uses `tempfile.TemporaryDirectory()` in a `with` block.
7. **Log before the provider call.** `api_call_log` row with status=`retry`, then update after response.
8. **Structured JSON logs only.** No `print`, no f-string logging. Every log line has `film_id`, `task_id`, `user_id` when relevant.

The long version of each lives in `Backend_Handoff.md` §5 and §10. Re-read those sections monthly.

---

## When You're Stuck

Work through these in order. Do not skip.

**1. Re-read the module's section in `Backend_Handoff.md` §9.** Nine times out of ten, the answer is in the Inputs, Deliverable, or Verification lines.

**2. Check the state machine.** `Backend_Handoff.md` §6 shows which state maps to which task. If your task is in the wrong phase, fix the transition, not the task.

**3. Check the edge cases.** `UX_Edge_Cases.md` almost certainly covers what you're hitting — if a user can trigger it, it's in there. Search for the scenario.

**4. Check the watch-outs.** `Backend_Handoff.md` §10 lists the 20 most common mistakes. Your bug is probably #3 (idempotency), #4 (credit float cast), or #6 (trusting provider responses).

**5. Look at the actual API call log.** The `api_call_log` table has every provider call with request and response. Most "my task is hanging" bugs are "the provider returned 429 and my code didn't notice."

**6. Ask in the team channel.** Include: module number, which doc section you read, what you expected, what you got. Vague questions get vague answers.

**7. If the docs are wrong, fix the docs.** If you've verified something that contradicts a doc, update the doc in the same PR as your code fix. Stale docs are worse than no docs.

---

## The Three Rules of Writing Decisions

When you make a call that isn't covered by existing docs — a new pattern, a tradeoff, a change to an assumption — do **not** update the big reference docs immediately. Instead:

1. Create a short decision record in `/decisions/YYYY-MM-DD-title.md` in the repo.
2. Three paragraphs max: **Context** (what problem), **Decision** (what you did), **Consequences** (what this implies going forward).
3. Commit it with the code that implements the decision.

If the decision is big enough to update a main reference doc, do that in a separate PR after the decision has proven out in code for a week. Decisions made in haste and spread across five docs are how documentation rots.

---

## What to Do When You Finish a Module

1. **Verify the "Verification" line** from `Backend_Handoff.md` §9. Don't mark done without actually running the check.
2. **Push to `main`.** Railway auto-deploys to production. Your module is live.
3. **Write one line in the team channel:** "Module N shipped. Next: Module N+1."
4. **Read Module N+1's Inputs line.** Make sure what you just built matches what N+1 expects. If it doesn't, fix now — don't build on a wrong foundation.
5. **Close the previous module's browser tabs.** You don't need them anymore. Less clutter = clearer head.

---

## The Red Flags That Mean "Stop and Regroup"

If any of these happen, stop coding and talk to the team before continuing:

- You're about to skip Pass 1 image generation "just to test faster." Don't. Re-read `Backend_Handoff.md` §13.1.
- You're about to use `float` for a credit calculation. Stop. Use `Decimal`.
- You're about to add a 4th Celery service. Stop. There are three services by design (`Backend_Handoff.md` §3).
- You're about to write a provider call in an API endpoint. Stop. That's a Celery task.
- You're about to hardcode a provider model name. Stop. Use the config (`Backend_Handoff.md` §10.12).
- You're spending more than 2 days on a single module. Stop. Ask for a pair review.
- You're about to document a decision in a reference doc. Stop. Write a decision record first.

---

## The One-Line Summary

**Find your module in `Backend_Handoff.md` §9. Build the Deliverable. Hit the Verification. Ship to `main`. Repeat.**

Everything else is supporting material for that loop.

Now close this doc and go build.
