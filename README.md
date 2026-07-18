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

## Structure

- `src/ui/` — frontend app and components.
- `src/worker/` — all Worker-side code, deployed as the Cloudflare Worker.
  - `src/worker/agent/*` — the Durable Object agent. All config and abilities under this folder.
- `src/temporal/` — standalone Node.js Temporal backend (workflows, worker process, trigger API).
