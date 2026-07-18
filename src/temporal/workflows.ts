import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.ts";

const { logMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

const { archiveWeeklyProgress } = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 seconds",
});

const { analyzeWeeklyProgress } = proxyActivities<typeof activities>({
  // LLM call with tool steps — allow time; few attempts to cap token burn.
  startToCloseTimeout: "2 minutes",
  retry: { maximumAttempts: 2 },
});

export async function sampleWorkflow(name: string): Promise<string> {
  return await logMessage(name);
}

export interface WeeklyProgressResult {
  fileName: string;
  week: number;
  planComplete: boolean;
  analysis: string;
}

// Roadmap "Every week": user marks the week complete → archive the progress
// file → AI analysis of the week → report whether the plan is finished.
export async function weeklyProgressWorkflow(): Promise<WeeklyProgressResult> {
  const { fileName, week, totalWeeks } = await archiveWeeklyProgress();
  const { analysis } = await analyzeWeeklyProgress({ fileName, week });

  const planComplete = totalWeeks > 0 && week >= totalWeeks;
  // TODO(roadmap "End of plan"): when planComplete, trigger the
  // plan-generation workflow; otherwise regenerate next week's template (4.2).

  return { fileName, week, planComplete, analysis };
}
