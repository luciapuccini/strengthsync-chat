import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ModelMessage } from "ai";
import { fetchAgentObject, fetchAgentStaticText } from "../agent/agent-core.ts";
import {
  addDays,
  buildProgramFileName,
  buildProgressFileName,
  CLIENT_PROFILE_FILE,
  nextMonday,
  PROGRAM_DIR,
  PROGRAM_FILE,
  PROGRESS_DIR,
  PROGRESS_FILE,
  TRAINING_RULES_FILE,
} from "./progressFile.ts";
import {
  PLAN_GENERATION_SYSTEM_PROMPT,
  PROFILE_SUMMARY_PROMPT,
  PROGRESS_SUMMARY_PROMPT,
  WEEKLY_ANALYSIS_SYSTEM_PROMPT,
} from "./prompts.ts";
import {
  generatedPlanSchema,
  type GeneratedProgram,
} from "./schemas.ts";
import { buildAnalysisTools } from "./tools.ts";

export async function logMessage(name: string): Promise<string> {
  const message = `Hello, ${name}! logMessage activity ran at ${new Date().toISOString()}`;
  console.log(`[temporal activity] ${message}`);
  return message;
}

// Activities run in this Node process, so process.env is fine
// (temporal:worker loads .dev.vars via dotenv-cli).
function requireOpenAiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set (check .dev.vars)");
  }
  return apiKey;
}

// ── Weekly progress (roadmap "Every week") ──────────────────────────────────

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
// markdown analysis.
export async function analyzeWeeklyProgress({
  fileName,
  week,
}: AnalyzeArgs): Promise<AnalyzeResult> {
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Analyze week ${week}. The archived progress file is "${fileName}" — read it with getProgressFile, then compare it against the plan with getCurrentProgram.`,
    },
  ];

  const result = await fetchAgentStaticText({
    messages,
    apiKey: requireOpenAiKey(),
    system: WEEKLY_ANALYSIS_SYSTEM_PROMPT,
    tools: buildAnalysisTools(),
    maxSteps: 6,
  });

  return { analysis: result.text };
}

// ── Plan generation (roadmap "End of plan") ─────────────────────────────────

export interface SummaryResult {
  summary: string;
}

// LLM call 1: condenses every archived week (+ the in-flight week) of the
// finished block into coach-facing trends. Files are small and bounded, so
// they're inlined into the prompt — no tool loop needed.
export async function summarizeProgressHistory(): Promise<SummaryResult> {
  const files = (await readdir(PROGRESS_DIR))
    .filter((f) => f.startsWith("progress_") && f.endsWith(".json"))
    .sort();

  const weeks: string[] = [];
  for (const f of files) {
    weeks.push(`### ${f}\n${await readFile(join(PROGRESS_DIR, f), "utf8")}`);
  }
  weeks.push(
    `### in-flight week (progress.json)\n${await readFile(PROGRESS_FILE, "utf8")}`,
  );

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Summarize this block's training history:\n\n${weeks.join("\n\n")}`,
    },
  ];
  const result = await fetchAgentStaticText({
    messages,
    apiKey: requireOpenAiKey(),
    system: PROGRESS_SUMMARY_PROMPT,
    tools: {},
    maxSteps: 1,
  });
  return { summary: result.text };
}

// LLM call 2: extracts goal-relevant context from the client profile.
export async function summarizeClientProfile(): Promise<SummaryResult> {
  const profile = await readFile(CLIENT_PROFILE_FILE, "utf8");
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Extract the goal-relevant context from this client profile:\n\n${profile}`,
    },
  ];
  const result = await fetchAgentStaticText({
    messages,
    apiKey: requireOpenAiKey(),
    system: PROFILE_SUMMARY_PROMPT,
    tools: {},
    maxSteps: 1,
  });
  return { summary: result.text };
}

export interface GeneratePlanArgs {
  progressSummary: string;
  profileSummary: string;
  quizNotes: string;
}

export interface GeneratePlanResult {
  program: GeneratedProgram;
  rationale: string;
}

// LLM call 3: writes the next block as schema-validated JSON. The training
// rules are appended to the system prompt; the rationale is split off before
// the plan is persisted.
export async function generateNewPlan({
  progressSummary,
  profileSummary,
  quizNotes,
}: GeneratePlanArgs): Promise<GeneratePlanResult> {
  const rules = await readFile(TRAINING_RULES_FILE, "utf8");
  const currentProgram = await readFile(PROGRAM_FILE, "utf8");

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        `## Finished block — weekly progress summary\n${progressSummary}`,
        `## Client profile — goals & constraints\n${profileSummary}`,
        `## Previous program template (structural reference)\n${currentProgram}`,
        `## Client quiz notes\n${quizNotes.trim() ? quizNotes : "(no notes provided)"}`,
        "Write the next block now.",
      ].join("\n\n"),
    },
  ];

  const { object } = await fetchAgentObject({
    messages,
    apiKey: requireOpenAiKey(),
    system: `${PLAN_GENERATION_SYSTEM_PROMPT}\n\n${rules}`,
    schema: generatedPlanSchema,
  });

  // Strip the LLM schema's nullable fields back to the file shape (absent
  // keys instead of nulls — see schemas.ts).
  const { rationale, program: rawDays, ...meta } = object;
  const program: GeneratedProgram = {
    ...meta,
    program: rawDays.map((day) => {
      const { notes: dayNotes, routine, ...dayRest } = day;
      return {
        ...dayRest,
        ...(dayNotes != null ? { notes: dayNotes } : {}),
        routine: routine.map((ex) => {
          const { notes, weight_kg, ...exRest } = ex;
          return {
            ...exRest,
            ...(notes != null ? { notes } : {}),
            ...(weight_kg != null ? { weight_kg } : {}),
          };
        }),
      };
    }),
  };
  return { program, rationale };
}

export interface ActivateArgs {
  program: GeneratedProgram;
}

export interface ActivateResult {
  programFileName: string;
}

// Archives the generated plan (program/program_<datetimestamp>.json, same
// approach as progress files) and activates it as the live program.json.
export async function activateNewProgram({
  program,
}: ActivateArgs): Promise<ActivateResult> {
  const programFileName = buildProgramFileName(new Date());
  const serialized = `${JSON.stringify(program, null, 2)}\n`;
  await mkdir(PROGRAM_DIR, { recursive: true });
  await writeFile(join(PROGRAM_DIR, programFileName), serialized);
  await writeFile(PROGRAM_FILE, serialized);
  console.log(`[temporal activity] activated new program → ${programFileName}`);
  return { programFileName };
}

export interface ResetProgressArgs {
  program: GeneratedProgram;
}

// Fresh week 1 for the new block: archives the outgoing in-flight week first
// (never lose data), then writes a clean progress.json — sequential dates from
// next Monday, completed flags false, weights taken from the generated plan.
export async function resetProgressForNewPlan({
  program,
}: ResetProgressArgs): Promise<void> {
  await mkdir(PROGRESS_DIR, { recursive: true });
  await copyFile(
    PROGRESS_FILE,
    join(PROGRESS_DIR, buildProgressFileName(new Date())),
  );

  const monday = nextMonday(new Date());
  const fresh = {
    current_week: 1,
    total_weeks: program.total_weeks,
    training_days_per_week: program.training_days_per_week,
    rest_days_per_week: program.rest_days_per_week,
    program: program.program.map((day, i) => ({
      id: day.id,
      type: day.type,
      date: addDays(monday, i).toISOString().slice(0, 10),
      completed: false,
      ...(day.notes ? { notes: day.notes } : {}),
      routine: day.routine,
    })),
  };
  await writeFile(PROGRESS_FILE, `${JSON.stringify(fresh, null, 2)}\n`);
  console.log(
    `[temporal activity] reset progress.json to week 1 (starts ${monday.toISOString().slice(0, 10)})`,
  );
}
