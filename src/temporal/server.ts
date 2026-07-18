import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getTemporalClient } from "./client.ts";
import { TASK_QUEUE, TEMPORAL_API_PORT, UI_ORIGIN } from "./shared.ts";
import { sampleWorkflow, weeklyProgressWorkflow } from "./workflows.ts";

const app = new Hono();

app.use("*", cors({ origin: UI_ORIGIN }));

app.get("/health", (c) => c.json({ ok: true }));

app.post("/api/workflows/sample", async (c) => {
  const body = await c.req.json<{ name?: string }>().catch(() => ({}) as { name?: string });
  const name = body.name ?? "StrengthSync";

  try {
    const client = await getTemporalClient();
    const workflowId = `sample-${Date.now()}`;
    // execute() starts the workflow and awaits its result — the HTTP response
    // doubles as the result channel (no polling/signals needed for the sample).
    const result = await client.workflow.execute(sampleWorkflow, {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [name],
    });
    return c.json({ workflowId, result });
  } catch (err) {
    console.error("[temporal api] sampleWorkflow failed", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});

app.post("/api/workflows/weekly-progress", async (c) => {
  try {
    const client = await getTemporalClient();
    const workflowId = `weekly-progress-${Date.now()}`;
    // execute() blocks until the workflow (archive + LLM analysis) finishes —
    // the HTTP response carries the analysis back to the UI.
    const result = await client.workflow.execute(weeklyProgressWorkflow, {
      taskQueue: TASK_QUEUE,
      workflowId,
    });
    return c.json({ workflowId, ...result });
  } catch (err) {
    console.error("[temporal api] weeklyProgressWorkflow failed", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});

serve({ fetch: app.fetch, port: TEMPORAL_API_PORT }, (info) => {
  console.log(`[temporal api] listening on http://localhost:${info.port}`);
});
