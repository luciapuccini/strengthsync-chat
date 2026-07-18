# Temporal Workflow Architecture

check "./backend" form implementation details

## Overview

This codebase includes exactly one Temporal workflow: `verifyEmailWorkflow`, which backs the "Verify Email" lead-enrichment feature (triggered from the `LeadsList` UI's "Enrich" dropdown). It orchestrates a single activity, `verifyEmail`, that runs a mocked/rule-based email check.

**Note:** the CSV import feature does _not_ use Temporal. Uploaded CSVs are parsed entirely in the browser (`frontend/src/utils/csvParser.ts`, via PapaParse) and sent to a plain REST endpoint (`POST /leads/bulk`) that writes rows to the database with Prisma. It's a synchronous request/response flow with no workflow orchestration — this doc covers only the Temporal-backed path (Verify Email).

## Process topology

The Temporal worker and the Express API run in the **same Node process**, inside the same `backend` Docker container. `backend/src/index.ts` starts the Express server and, at the bottom of the file, also starts the worker:

```ts
// backend/src/index.ts:318-325
app.listen(4000, () => {
  console.log("Express server is running on port 4000");
});

runTemporalWorker().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

There is no dedicated worker container — API request handling and workflow task processing share one process and one container.

## Worker setup

`backend/src/worker.ts`:

```ts
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./workflows/activities";

export async function runTemporalWorker() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
  });
  try {
    const worker = await Worker.create({
      connection,
      namespace: "default",
      taskQueue: "myQueue",
      workflowsPath: require.resolve("./workflows"),
      activities,
    });

    await worker.run();
  } finally {
    await connection.close();
  }
}
```

- Connects to the Temporal server via `NativeConnection` at `TEMPORAL_ADDRESS` (defaults to `localhost:7233`).
- Registers for namespace `default` and task queue `myQueue` (both hardcoded string literals, not env-driven).
- `workflowsPath` points Temporal's worker sandbox at the `./workflows` module; `activities` are imported directly and passed as plain functions.

## Client setup

Unlike the worker, there is no shared/singleton Temporal client. A client connection is created ad hoc inside the request handler that needs it (`backend/src/index.ts:276-279`), and explicitly closed at the end of that handler (`index.ts:309`):

```ts
const connection = await Connection.connect({
  address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
});
const client = new Client({ connection, namespace: "default" });
// ... use client ...
await connection.close();
```

Every call to `POST /leads/verify-emails` opens and tears down its own gRPC connection to Temporal.

## Workflow definition

`backend/src/workflows/workflows.ts`:

```ts
import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";

const { verifyEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 second",
});

export async function verifyEmailWorkflow(email: string): Promise<boolean> {
  return await verifyEmail(email);
}
```

- Signature: `verifyEmailWorkflow(email: string): Promise<boolean>`.
- Proxies the `verifyEmail` activity with a **1-second `startToCloseTimeout`** and no explicit retry policy (Temporal SDK default retry behavior applies).
- No signals, queries, or child workflows — it's a thin orchestration wrapper around a single activity call.

`backend/src/workflows/index.ts` is just a barrel re-export (`export * from './workflows'`), which is what `workflowsPath` in the worker resolves to.

## Activity definition

`backend/src/workflows/activities/utils.ts`:

```ts
export async function verifyEmail(email: string): Promise<boolean> {
  if (email.includes("john.doe")) {
    return false;
  }

  if (email.includes("jane.smith")) {
    await new Promise((resolve) => setTimeout(resolve, 20000));
  }

  if (/\+/.test(email)) {
    return false;
  }

  return true;
}
```

This is the only activity in the codebase. It's a mocked verifier with hardcoded rules — no real network call:

- Rejects any email containing `john.doe`.
- Sleeps 20 seconds for any email containing `jane.smith`.
- Rejects any email containing a `+` (plus-addressing).
- Otherwise returns `true`.

**Bug to flag:** the 20-second sleep for `jane.smith` addresses exceeds the workflow's 1-second `startToCloseTimeout`. In practice this activity invocation will time out and retry (per Temporal's default retry policy), rather than ever completing — the workflow can't actually verify a `jane.smith` email successfully as written.

## Invocation pattern

The workflow is started from `POST /leads/verify-emails` in `backend/src/index.ts:256-316`:

```ts
for (const lead of leads) {
  try {
    const isVerified = await client.workflow.execute(verifyEmailWorkflow, {
      taskQueue: "myQueue",
      workflowId: `verify-email-${lead.id}-${Date.now()}`,
      args: [lead.email],
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { emailVerified: Boolean(isVerified) },
    });

    results.push({ leadId: lead.id, emailVerified: isVerified });
    verifiedCount += 1;
  } catch (error) {
    errors.push({
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName}`.trim(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
```

- `client.workflow.execute(...)` both **starts** the workflow and **awaits its completion** in one call — it's not a fire-and-forget `start()` followed by a separate poll/query.
- Workflow IDs follow the pattern `verify-email-<leadId>-<timestamp>`.
- Leads are processed in a **serial `for` loop**, not `Promise.all` — verifying N leads means N sequential workflow round-trips to Temporal, each blocking the HTTP request further.
- After each workflow resolves, the result is persisted immediately via `prisma.lead.update`.
- The whole loop runs inside the single `POST /leads/verify-emails` request; the HTTP response (`res.json({ success, verifiedCount, results, errors })`) is only sent once every workflow in the batch has finished (or errored).

### How the result reaches the UI

Because `client.workflow.execute` blocks until completion, there's no need for polling, workflow queries, or a websocket/SSE channel — the result comes back as part of the normal synchronous HTTP response. On the frontend, `LeadsList.tsx`'s mutation `onSuccess` handler invalidates the `['leads', 'getMany']` TanStack Query cache key, which triggers a refetch of `GET /leads` and re-renders the table with updated `emailVerified` status icons.

This is the same "invalidate-and-refetch" pattern used everywhere else in the app (including the non-Temporal CSV import flow) — there are no Temporal signals, queries, or websocket/SSE mechanisms anywhere in the codebase.

## Docker orchestration

`docker-compose.yml`:

```yaml
services:
  temporal:
    image: temporalio/temporal:1.7.3
    command:
      [
        "server",
        "start-dev",
        "--ip",
        "0.0.0.0",
        "--db-filename",
        "/home/temporal/temporal.db",
      ]
    ports:
      - "7233:7233"
      - "8233:8233"
    volumes:
      - temporal-data:/home/temporal

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      TEMPORAL_ADDRESS: temporal:7233
    volumes:
      - db-data:/app/prisma
    depends_on:
      - temporal
  # ... prisma-studio, frontend
```

- The `temporal` service uses the **official `temporalio/temporal:1.7.3` image**, running `server start-dev`. This is Temporal's built-in dev-server mode: a single container with embedded SQLite-backed persistence and an embedded web UI on port `8233`. Port `7233` is the gRPC endpoint SDK clients/workers connect to.
- No separate Postgres/Elasticsearch/Temporal-UI containers are needed — `start-dev` bundles all of that.
- `backend` depends on `temporal` and receives `TEMPORAL_ADDRESS=temporal:7233` so it can reach the server by container name.
- No dedicated worker container: the worker runs inside `backend` (see "Process topology" above).
- `backend/Dockerfile`'s `CMD` runs `pnpm migrate:dev && pnpm gen:prisma && pnpm dev`, i.e., Prisma migrations, client generation, then `nodemon ./src/index.ts` — which starts both Express and the Temporal worker.

**Recent history:** commit `7ee2986` ("add docker to spin-up all services") originally introduced a custom `backend/temporal.Dockerfile` to build a Temporal server image. Commit `64376ee` ("prefer official temporal image") removed that custom Dockerfile and switched `docker-compose.yml` to use the official `temporalio/temporal:1.7.3` image directly with `start-dev`, simplifying local orchestration down to a single well-maintained image.

## Config summary

| Setting               | Value                                                 | Source                                                               |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Temporal address      | `localhost:7233` (default) / `temporal:7233` (Docker) | `TEMPORAL_ADDRESS` env var, read in `worker.ts:6` and `index.ts:277` |
| Namespace             | `default`                                             | Hardcoded in `worker.ts:11` and `index.ts:279`                       |
| Task queue            | `myQueue`                                             | Hardcoded in `worker.ts:12` and `index.ts:288`                       |
| Workflow timeout      | `1 second` (activity `startToCloseTimeout`)           | Hardcoded in `workflows.ts:5`                                        |
| Temporal server image | `temporalio/temporal:1.7.3`, `start-dev` mode         | `docker-compose.yml`                                                 |

There is no `TEMPORAL_NAMESPACE` or `TEMPORAL_TASK_QUEUE` env var — namespace and task queue are literal strings duplicated between the worker and the client call site, so they must be kept in sync by hand if ever changed.

## Observations / audit notes

- **No shared Temporal client** — a new client connection is opened and closed on every `/leads/verify-emails` request instead of being reused across requests.
- **Serial workflow execution** — leads are verified one at a time in a `for` loop rather than concurrently, so batch verification time scales linearly with the number of selected leads.
- **Timeout/sleep mismatch bug** — the `jane.smith` 20-second sleep in the `verifyEmail` activity exceeds the workflow's 1-second `startToCloseTimeout`, so that case will time out and retry rather than succeed.
- **No Temporal-specific tests** — no use of `@temporalio/testing` (`TestWorkflowEnvironment`) anywhere in the codebase; existing Vitest suites (`messageGenerator.test.ts`, `csvParser.test.ts`) don't touch the workflow or activity.
- **No signals, queries, or websockets/SSE** anywhere in the app. All "live" UI updates — for both the Temporal-backed Verify Email flow and the non-Temporal CSV import flow — happen via TanStack Query's `invalidateQueries` triggering a refetch after a synchronous REST response.
- **Namespace/task queue duplication** — `default` and `myQueue` are hardcoded independently in two files; there's no single source of truth or env-based config for them.
