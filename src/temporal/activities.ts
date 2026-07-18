import { copyFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ModelMessage } from "ai";
import { fetchAgentStaticText } from "../agent/agent-core.ts";
import {
  buildProgressFileName,
  PROGRESS_DIR,
  PROGRESS_FILE,
} from "./progressFile.ts";
import { WEEKLY_ANALYSIS_SYSTEM_PROMPT } from "./prompts.ts";
import { buildAnalysisTools } from "./tools.ts";

export async function logMessage(name: string): Promise<string> {
  const message = `Hello, ${name}! logMessage activity ran at ${new Date().toISOString()}`;
  console.log(`[temporal activity] ${message}`);
  return message;
}

export interface ArchiveResult {
  fileName: string;
  week: number;
  totalWeeks: number;
}

// Snapshots the in-flight week (src/app/dashboard/progress.json) into
// PROGRESS_DIR as progress_<datetimestamp>.json. The working file stays
// untouched — regenerating next week's template is roadmap 4.2 (deferred).
export async function archiveWeeklyProgress(): Promise<ArchiveResult> {
  const progress = JSON.parse(await readFile(PROGRESS_FILE, "utf8")) as {
    current_week: number;
    total_weeks: number;
  };

  const fileName = buildProgressFileName(new Date());
  await mkdir(PROGRESS_DIR, { recursive: true });
  await copyFile(PROGRESS_FILE, join(PROGRESS_DIR, fileName));
  console.log(`[temporal activity] archived week ${progress.current_week} → ${fileName}`);

  return {
    fileName,
    week: progress.current_week,
    totalWeeks: progress.total_weeks,
  };
}

export interface AnalyzeArgs {
  fileName: string;
  week: number;
}

export interface AnalyzeResult {
  analysis: string;
}

// One-shot agent run: reads the archived week + plan via tools and returns a
// markdown analysis. Runs in this Node process, so process.env is fine
// (temporal:worker loads .dev.vars via dotenv-cli).
export async function analyzeWeeklyProgress({
  fileName,
  week,
}: AnalyzeArgs): Promise<AnalyzeResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set (check .dev.vars)");
  }

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Analyze week ${week}. The archived progress file is "${fileName}" — read it with getProgressFile, then compare it against the plan with getCurrentProgram.`,
    },
  ];

  const result = await fetchAgentStaticText({
    messages,
    apiKey,
    system: WEEKLY_ANALYSIS_SYSTEM_PROMPT,
    tools: buildAnalysisTools(),
    maxSteps: 6,
  });

  return { analysis: result.text };
}
