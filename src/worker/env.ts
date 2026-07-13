import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import type { StrengthSyncAgent } from "./agent/agent";

export interface Env {
  StrengthsyncAgent: DurableObjectNamespace<StrengthSyncAgent>;
  OPENAI_API_KEY: string;
}
