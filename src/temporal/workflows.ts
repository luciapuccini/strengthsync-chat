import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.ts";

const { logMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export async function sampleWorkflow(name: string): Promise<string> {
  return await logMessage(name);
}
