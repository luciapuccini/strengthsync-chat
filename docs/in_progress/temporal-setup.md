# Temporal Setup — Implementation Plan (In Progress)

> Status: 🟡 in progress · Started: 2026-07-18
> Reference: `docs/temporal_setup_example.md` (audit of an example Express + Temporal app)

## Goal

Add Temporal to strengthsync-chat with:

- **No Docker** — local dev server via the Temporal CLI (`temporal server start-dev`, already installed via Homebrew, includes Web UI at `localhost:8233`).
- A **separate workflows worker/backend** (`src/temporal/`) that runs independently from the Cloudflare Workers app.
- A **sample workflow** with an activity that `console.log`s, triggered by a **test button in the UI**.

## Why this architecture

- Temporal's TS SDK (`@temporalio/*`) requires Node.js native modules (gRPC core bridge) — it **cannot run inside a Cloudflare Worker**. A separate Node backend is required, not just preferred.
- Canonical Temporal topology: a **Worker process** (executes workflows/activities, polls the task queue) and an **API process** (Hono HTTP server holding a `@temporalio/client` that starts workflows). Two independent entry points so the worker can later be scaled/deployed separately.
- Improvements over the example doc's setup:
  - Single source of truth for task queue / namespace / address (`shared.ts`) instead of duplicated hardcoded literals.
  - One lazy-singleton client connection instead of opening/closing a gRPC connection per request.
  - Sensible activity timeout (not shorter than the work it wraps).

## New files — `src/temporal/` (standalone Node backend)

| File           | Contents                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `shared.ts`    | Constants: `TASK_QUEUE`, `TEMPORAL_NAMESPACE`, `TEMPORAL_ADDRESS`, `TEMPORAL_API_PORT` (env-overridable; Node process, so `process.env` is fine) |
| `activities.ts`| `logMessage(name)` — sample activity: `console.log` + returns a greeting string                                                   |
| `workflows.ts` | `sampleWorkflow(name)` — `proxyActivities`, awaits `logMessage`, returns result. Deterministic code only.                         |
| `client.ts`    | Lazy singleton: `Connection.connect` + `new Client(...)`                                                                           |
| `worker.ts`    | `Worker.create({ workflowsPath, activities, taskQueue })` + `run()`, graceful shutdown                                             |
| `server.ts`    | Hono on :3001 — `GET /health`; `POST /api/workflows/sample` → `client.workflow.execute(sampleWorkflow, ...)` → `{ workflowId, result }`. CORS → `http://localhost:5173` |

## Config wiring

- New `tsconfig.temporal.json`: Node types, `module: nodenext`, strict, `include: ["src/temporal/**"]`; added to root `tsconfig.json` references.
- `tsconfig.app.json`: exclude `src/temporal/**` (it globs all of `src`; Node code must not be typechecked against DOM/vite types).

## Dependencies (depscore-checked before install)

- `@temporalio/client`, `@temporalio/worker`, `@temporalio/workflow`, `@temporalio/activity` (same version)
- `hono`
- dev: `tsx`

## package.json scripts

```
"temporal:dev":    "temporal server start-dev"
"temporal:worker": "tsx watch src/temporal/worker.ts"
"temporal:api":    "tsx watch src/temporal/server.ts"
```

## UI changes

1. `src/ui/Plan/components/TestWorkflowButton.tsx` — shadcn Button ("Run sample workflow") + spinner state; `POST {VITE_TEMPORAL_API_URL ?? http://localhost:3001}/api/workflows/sample`; success/error toasts via sonner.
2. `PageHeading.tsx` — render the button in the heading row.
3. `App.tsx` — mount shadcn `<Toaster />` (exists in `ui/sonner.tsx`, not yet mounted).

## Implementation checklist

- [x] **Step 0** — This plan doc. ✅ Checkpoint: file exists and matches approved plan.
- [x] **Step 1** — depscore-check + install deps. ✅ Checkpoint: scores reviewed (Socket skipped — expired token, user call); `--force` reinstall clean incl. all build scripts (`allowBuilds` in `pnpm-workspace.yaml`); native core-bridge loads. Installed: `@temporalio/*` 1.20.3, `hono` 4.12.30, `tsx` 4.23.1 (dev).
- [x] **Step 2** — tsconfig wiring. ✅ Checkpoint: `tsc -b` clean.
- [x] **Step 3** — Backend skeleton (`shared/activities/workflows/client/worker`). ✅ Checkpoint: `temporal:dev` + worker boot; bundle compiled; worker `RUNNING`, polling the `strengthsync` task queue.
- [x] **Step 4** — Hono API + scripts. ✅ Checkpoint: `curl -X POST localhost:3001/api/workflows/sample` → `{ workflowId, result }`; `console.log` fired in the **worker** terminal; `temporal workflow list` shows `Completed`. (Added `@hono/node-server` — Hono's Node adapter.)
- [x] **Step 5** — UI button + Toaster. ✅ Checkpoint: `tsc -b` clean; new/changed files lint clean (repo-wide lint failures are pre-existing shadcn/docs issues); Vite serves the button module; CORS preflight + POST return `access-control-allow-origin: http://localhost:5173`.
- [x] **Step 6** — Final validation + docs. ✅ Checkpoint: all 4 processes up simultaneously (dev server, worker, API, Vite); E2E POST → `{ workflowId, result }`; activity `console.log` in worker terminal; `Completed` in `temporal workflow list`; `pnpm test` 28/28; CLAUDE.md updated. **Pending: manual button click in the browser (user verification), then move this doc out of `in_progress/`.**

## Addendum — Temporal Cloud (2026-07-18)

Connected to Temporal Cloud, namespace `quickstart-luciapuccini.wu1pr`:

- `.dev.vars` holds `TEMPORAL_ADDRESS` (`<namespace>.tmprl.cloud:7233`), `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY` (git-ignored; placeholders in `.dev.vars.example`).
- `shared.ts` builds `connectionOptions`: TLS + API key when `TEMPORAL_API_KEY` is present, plain local connection otherwise — one code path, env-driven switch. Used by both `client.ts` and `worker.ts`.
- `temporal:worker` / `temporal:api` scripts load `.dev.vars` via `dotenv-cli` (same pattern as the existing `eval` script).
- ✅ Verified E2E against Cloud: worker `RUNNING` on Cloud, POST → result, activity `console.log` in worker, `temporal workflow list` (Cloud creds) shows `Completed sampleWorkflow` → visible in the cloud.temporal.io dashboard.
- CLI against Cloud: `TEMPORAL_TLS=true dotenv -e .dev.vars -- temporal workflow list` (env vars `TEMPORAL_ADDRESS`/`TEMPORAL_NAMESPACE`/`TEMPORAL_API_KEY` + TLS flag).
- ⚠️ Gotcha encountered: worker/API started before this change keep the old localhost config — after editing `.dev.vars`, restart `temporal:worker`/`temporal:api`. `pnpm temporal:dev` is not needed in Cloud mode.

## Explicitly out of scope

Docker Compose, Temporal Cloud / mTLS (prod story for later), `@temporalio/testing` unit tests (follow-up), any changes to the existing chat/agent code.
