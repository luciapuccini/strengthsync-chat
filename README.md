# StrengthSync Chat

An AI-powered chat application that helps people understand and manage their gym/fitness routines. A dashboard shows the user's plan, exercises, and progress, while an AI chatbot acts as an interactive tool to understand and analyze those results.

## Project scope

- **Dashboard** — displays the user's fitness plan, exercises, and progress over time.
- **Chatbot** — a conversational interface for interpreting the plan and progress data, answering questions, and reasoning about results with the user.

## Tech stack

- **Frontend** — React + TypeScript, built and served by Vite. [src/ui/App.tsx](src/ui/App.tsx).
- **Backend** — Cloudflare Workers. The Worker entry point ([src/worker/index.ts](src/worker/index.ts)) routes requests to a Durable Object agent.
- **Agent** — `StrengthSyncAgent`, an `AIChatAgent` Durable Object ([src/worker/agent/agent.ts](src/worker/agent/agent.ts)) that streams chat responses using the OpenAI API via the `ai` SDK and `@ai-sdk/openai`.
- **Deployment** — Cloudflare Workers platform, configured via `wrangler.jsonc`.

## Running locally

```bash
pnpm install
cp .dev.vars.example .dev.vars  # then fill in the keys
pnpm dev                        # app on http://localhost:5173 (Vite + Worker)
```

**Temporal backend** (sample workflow, triggered by the "Run sample workflow" button in the UI):

```bash
pnpm temporal:worker  # worker polling the "strengthsync" task queue
pnpm temporal:api     # trigger API on http://localhost:3001
```

With `TEMPORAL_*` keys set in `.dev.vars`, these connect to Temporal Cloud (dashboard at cloud.temporal.io). Without them, also run `pnpm temporal:dev` (local dev server, Web UI on http://localhost:8233).

## Phone via Tailscale (Mac mini gym access)

### Env on the Mac (project root)

| File | Purpose |
|------|---------|
| `.dev.vars` | Secrets + `UI_ORIGIN` (CORS for `pnpm temporal:api`) |
| `.env.local` | `VITE_TEMPORAL_API_URL` for the browser (Vite; gitignored via `*.local`) |

`.dev.vars` (excerpt):

### Processes to leave running

One command starts the usual stack (assumes Temporal Cloud env is set in `.dev.vars`):

```bash
pnpm deploy:local   # web :5173 + temporal:api :3001 + temporal:worker
```

| Command | Role |
|---------|------|
| `pnpm deploy:local` | UI + chat + Temporal API + worker (recommended) |
| `pnpm dev` | UI + chat on **5173** only |
| `pnpm temporal:api` | Guardar día / workflows on **3001** |
| `pnpm temporal:worker` | Completar semana / Generar plan |
| `pnpm temporal:dev` | Only if Temporal Cloud env is empty |

Before leaving home: Mac awake on power, Tailscale Connected, processes up; smoke-test from the phone at `http://MAC:5173` (http, not https) and **Guardar día**.

### Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Page won’t load | `pnpm dev` down; Tailscale disconnected; wrong `MAC` |
| Guardar día CORS / wrong host | `UI_ORIGIN` ≠ address bar; or `VITE_TEMPORAL_API_URL` still `localhost` |
| Guardar día “Failed to fetch” | `temporal:api` down; firewall blocking Node |
| Chat fails | Missing `OPENAI_API_KEY`; `pnpm dev` not running |
| Week/plan buttons fail | `temporal:worker` down or Temporal Cloud env wrong |

## Structure

- `src/ui/` — frontend app and components.
- `src/worker/` — all Worker-side code, deployed as the Cloudflare Worker.
  - `src/worker/agent/*` — the Durable Object agent. All config and abilities under this folder.
- `src/temporal/` — standalone Node.js Temporal backend (workflows, worker process, trigger API).
