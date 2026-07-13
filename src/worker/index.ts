// FIXME: tsconfig worker should be picking these types up
import type { ExportedHandler } from "@cloudflare/workers-types";
import { StrengthSyncAgent } from "./agent/agent";
import { routeAgentRequest } from "agents";
import type { Env } from "./env";

export { StrengthSyncAgent };

export default {
  async fetch(request: Request, env: Env) {
    console.log("🚀 ~ Worker connected");
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
