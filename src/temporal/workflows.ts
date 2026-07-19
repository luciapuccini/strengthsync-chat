import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.ts";
import type { GeneratedProgram } from "./schemas.ts";

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

const { generateNextWeekProgress } = proxyActivities<typeof activities>({
  // Structured-output LLM call for the next progress week.
  startToCloseTimeout: "3 minutes",
  retry: { maximumAttempts: 2 },
});

const { summarizeProgressHistory, summarizeClientProfile } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: "2 minutes",
  retry: { maximumAttempts: 2 },
});

const { generateNewPlan } = proxyActivities<typeof activities>({
  // Bigger structured-output LLM call.
  startToCloseTimeout: "3 minutes",
  retry: { maximumAttempts: 2 },
});

const { activateNewProgram, resetProgressForNewPlan } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: "30 seconds",
});

export async function sampleWorkflow(name: string): Promise<string> {
  return await logMessage(name);
}

export interface WeeklyProgressResult {
  fileName: string;
  week: number;
  planComplete: boolean;
  analysis: string;
  nextFileName?: string;
}

// Roadmap "Every week": mark newest progress finished → analyze (with coach
// rules tool) → if the block continues, LLM-seed next week's progress file.
export async function weeklyProgressWorkflow(): Promise<WeeklyProgressResult> {
  const { fileName, week, totalWeeks } = await archiveWeeklyProgress();
  const { analysis } = await analyzeWeeklyProgress({ fileName, week });

  const planComplete = totalWeeks > 0 && week >= totalWeeks;
  // TODO(roadmap "End of plan"): when planComplete, trigger planGenerationWorkflow.

  let nextFileName: string | undefined;
  if (!planComplete) {
    const next = await generateNextWeekProgress({ fileName, week, analysis });
    nextFileName = next.nextFileName;
  }

  return { fileName, week, planComplete, analysis, nextFileName };
}

export interface PlanGenerationResult {
  programFileName: string;
  rationale: string;
  program: GeneratedProgram;
}

// Roadmap "End of plan": quiz notes + block history + profile + coaching
// rules → AI-generated next block, archived and activated.
//
//   quizNotes (workflow arg) ───────────────┐
//   summarizeProgressHistory ──┐            ▼
//                              ├──► generateNewPlan ──┬──► activateNewProgram
//   summarizeClientProfile ────┘                      └──► resetProgressForNewPlan (wipe + seed week 1)
export async function planGenerationWorkflow(
  quizNotes: string,
): Promise<PlanGenerationResult> {
  // Parallel group A: independent LLM summaries.
  const [{ summary: progressSummary }, { summary: profileSummary }] =
    await Promise.all([summarizeProgressHistory(), summarizeClientProfile()]);

  // Barrier: generation needs both summaries (+ quiz notes; rules and the
  // previous template are read from disk inside the activity).
  const { program, rationale } = await generateNewPlan({
    progressSummary,
    profileSummary,
    quizNotes,
  });

  // Parallel group B: activate the new program template; wipe + seed week 1.
  const [{ programFileName }] = await Promise.all([
    activateNewProgram({ program }),
    resetProgressForNewPlan({ program }),
  ]);

  return { programFileName, rationale, program };
}
