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

## Quick start (this machine only)

```bash
pnpm install
cp .dev.vars.example .dev.vars   # fill in OPENAI_API_KEY (and other keys as needed)
pnpm dev                         # http://localhost:5173 — UI + chat Worker
```

Use only `http://localhost:5173` for this mode. Plan, History, and chat work; Temporal actions (Guardar día, Completar semana, Generar plan) need the full stack below.

## Full stack (Temporal)

Two env files at the project root (both gitignored):

| File | Purpose |
|------|---------|
| `.dev.vars` | Secrets + Temporal Cloud + `UI_ORIGIN` (CORS for `pnpm temporal:api`) |
| `.env.local` | `VITE_TEMPORAL_API_URL` for the browser (Vite loads `*.local`) |

**Local laptop values** (address bar is `localhost`):

```bash
# .dev.vars
UI_ORIGIN=http://localhost:5173

# .env.local
VITE_TEMPORAL_API_URL=http://localhost:3001
```

With `TEMPORAL_ADDRESS` / `TEMPORAL_NAMESPACE` / `TEMPORAL_API_KEY` set in `.dev.vars`, worker + API talk to **Temporal Cloud**. If those are empty, also run `pnpm temporal:dev` (local Temporal, Web UI on http://localhost:8233).

All-in-one (UI + Temporal API + worker):

```bash
pnpm preview:tailscale
```

Or separate terminals:

| Command | Role |
|---------|------|
| `pnpm dev` | UI + chat on **5173** |
| `pnpm temporal:api` | Guardar día / progress / workflow triggers on **3001** |
| `pnpm temporal:worker` | Completar semana / Generar plan |
| `pnpm temporal:dev` | Only if Temporal Cloud env is empty |

Restart `pnpm dev` after any `VITE_*` change in `.env.local`. Restart `pnpm temporal:api` after changing `UI_ORIGIN` in `.dev.vars`.

## Phone via Tailscale

MagicDNS name below is `mac` — substitute your Tailscale hostname.

**Env pairing** (must match the URL in the address bar):

| File | Key | Value |
|------|-----|-------|
| `.dev.vars` | `UI_ORIGIN` | `http://localhost:5173,http://mac:5173` |
| `.env.local` | `VITE_TEMPORAL_API_URL` | `http://mac:3001` |

```bash
pnpm preview:tailscale   # or the three commands from the table above
```

Before leaving home: Mac awake on power, Tailscale Connected, processes up. From the phone open **http** (not https): `http://mac:5173`. Smoke-test Plan, hard-refresh History (`/history`), Guardar día, and chat.

Vite already binds all interfaces (`server.host: true` in `vite.config.ts`). Chat agent routes stay on `/agents/*`; other paths serve the SPA so Tailscale deep links work.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Page won’t load | `pnpm dev` down; Tailscale disconnected; wrong hostname |
| `/history` (or any deep link) is plain **Not found** on `mac` but OK on localhost | Restart `pnpm dev` after the wrangler SPA fix (`run_worker_first: ["/agents/*"]`). Hard refresh again. |
| Guardar día CORS / wrong host | `UI_ORIGIN` must include the exact Origin in the address bar; or `VITE_TEMPORAL_API_URL` still points at `localhost` while you’re on `mac` |
| Guardar día “Failed to fetch” | `temporal:api` down; firewall blocking Node on 3001; phone can’t reach `mac:3001` |
| Chat fails | Missing `OPENAI_API_KEY`; `pnpm dev` not running |
| Week/plan buttons fail | `temporal:worker` down or Temporal Cloud env wrong |
| Env edits seem ignored | Restart Vite after `.env.local` changes; restart `temporal:api` after `.dev.vars` `UI_ORIGIN` changes |

## Structure

- `src/ui/` — frontend app and components.
- `src/worker/` — all Worker-side code, deployed as the Cloudflare Worker.
  - `src/worker/agent/*` — the Durable Object agent. All config and abilities under this folder.
- `src/temporal/` — standalone Node.js Temporal backend (workflows, worker process, trigger API).
