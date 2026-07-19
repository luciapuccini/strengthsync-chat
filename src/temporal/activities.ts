import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { ModelMessage } from "ai";
import { fetchAgentObject, fetchAgentStaticText } from "../agent/agent-core.ts";
import {
  buildProgramFileName,
  buildProgressFileName,
  buildWeek1Progress,
  CLIENT_PROFILE_FILE,
  PROGRAM_DIR,
  PROGRESS_DIR,
  resolveCurrentProgramPath,
  resolveLatestProgressPath,
  TRAINING_RULES_FILE,
} from "./progressFile.ts";
import {
  NEXT_WEEK_PROGRESS_PROMPT,
  PLAN_GENERATION_SYSTEM_PROMPT,
  PROFILE_SUMMARY_PROMPT,
  PROGRESS_SUMMARY_PROMPT,
  WEEKLY_ANALYSIS_SYSTEM_PROMPT,
} from "./prompts.ts";
import {
  generatedPlanSchema,
  generatedProgressWeekSchema,
  type GeneratedProgram,
  type ProgressWeek,
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

// Marks the newest progress_<datetimestamp>.json as finished (no new file).
export async function archiveWeeklyProgress(): Promise<ArchiveResult> {
  const path = await resolveLatestProgressPath();
  const progress = JSON.parse(await readFile(path, "utf8")) as {
    current_week: number;
    total_weeks: number;
    finished?: boolean;
  };

  progress.finished = true;
  await writeFile(path, `${JSON.stringify(progress, null, 2)}\n`);

  const fileName = basename(path);
  console.log(
    `[temporal activity] marked week ${progress.current_week} finished → ${fileName}`,
  );

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
      content: `Analyze week ${week}. The archived progress file is "${fileName}" — read it with getProgressFile, compare it against the plan with getCurrentProgram, and read coaching rules with getTrainingRules before writing Accionables.`,
    },
  ];

  const result = await fetchAgentStaticText({
    messages,
    apiKey: requireOpenAiKey(),
    system: WEEKLY_ANALYSIS_SYSTEM_PROMPT,
    tools: buildAnalysisTools(),
    maxSteps: 8,
  });

  return { analysis: result.text };
}

export interface GenerateNextWeekArgs {
  fileName: string;
  week: number;
  analysis: string;
}

export interface GenerateNextWeekResult {
  nextFileName: string;
}

// LLM structured output: next week's progress_<timestamp>.json (roadmap 4.2).
export async function generateNextWeekProgress({
  fileName,
  week,
  analysis,
}: GenerateNextWeekArgs): Promise<GenerateNextWeekResult> {
  const rules = await readFile(TRAINING_RULES_FILE, "utf8");
  const finishedWeek = await readFile(
    join(PROGRESS_DIR, basename(fileName)),
    "utf8",
  );
  const currentProgram = await readFile(
    await resolveCurrentProgramPath(),
    "utf8",
  );

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        `## Finished week ${week} progress\n${finishedWeek}`,
        `## Active program template\n${currentProgram}`,
        `## Weekly analysis\n${analysis}`,
        `Write week ${week + 1} progress JSON now.`,
      ].join("\n\n"),
    },
  ];

  const { object } = await fetchAgentObject({
    messages,
    apiKey: requireOpenAiKey(),
    system: `${NEXT_WEEK_PROGRESS_PROMPT}\n\n${rules}`,
    schema: generatedProgressWeekSchema,
  });

  const progress: ProgressWeek = {
    current_week: object.current_week,
    total_weeks: object.total_weeks,
    training_days_per_week: object.training_days_per_week,
    rest_days_per_week: object.rest_days_per_week,
    start_date: object.start_date,
    end_date: object.end_date,
    finished: false,
    program: object.program.map((day) => {
      const { notes: dayNotes, routine, ...dayRest } = day;
      return {
        ...dayRest,
        completed: false,
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

  const nextFileName = buildProgressFileName(new Date());
  await mkdir(PROGRESS_DIR, { recursive: true });
  await writeFile(
    join(PROGRESS_DIR, nextFileName),
    `${JSON.stringify(progress, null, 2)}\n`,
  );
  console.log(
    `[temporal activity] seeded next week ${progress.current_week} → ${nextFileName}`,
  );
  return { nextFileName };
}

// ── Plan generation (roadmap "End of plan") ─────────────────────────────────

export interface SummaryResult {
  summary: string;
}

// LLM call 1: condenses every archived week of the finished block into
// coach-facing trends. Files are small and bounded, so they're inlined into
// the prompt — no tool loop needed.
export async function summarizeProgressHistory(): Promise<SummaryResult> {
  const files = (await readdir(PROGRESS_DIR))
    .filter((f) => f.startsWith("progress_") && f.endsWith(".json"))
    .sort();

  const weeks: string[] = [];
  for (const f of files) {
    weeks.push(`### ${f}\n${await readFile(join(PROGRESS_DIR, f), "utf8")}`);
  }

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
  const currentProgram = await readFile(
    await resolveCurrentProgramPath(),
    "utf8",
  );

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

// Archives the generated plan as program/program_<datetimestamp>.json and
// deletes older program_*.json so only the active template remains.
export async function activateNewProgram({
  program,
}: ActivateArgs): Promise<ActivateResult> {
  const programFileName = buildProgramFileName(new Date());
  const serialized = `${JSON.stringify(program, null, 2)}\n`;
  await mkdir(PROGRAM_DIR, { recursive: true });
  await writeFile(join(PROGRAM_DIR, programFileName), serialized);

  const stale = (await readdir(PROGRAM_DIR)).filter(
    (f) =>
      f.startsWith("program_") &&
      f.endsWith(".json") &&
      f !== programFileName,
  );
  await Promise.all(stale.map((f) => unlink(join(PROGRAM_DIR, f))));
  console.log(
    `[temporal activity] activated new program → ${programFileName}` +
      (stale.length > 0 ? ` (removed ${stale.length} older archive(s))` : ""),
  );
  return { programFileName };
}

export interface ResetProgressArgs {
  program: GeneratedProgram;
}

export interface ResetProgressResult {
  progressFileName: string;
}

// End-of-plan housekeeping: wipe archived progress_<datetimestamp>.json files,
// then seed week 1 of the new plan so weeklyProgressWorkflow has a current week.
export async function resetProgressForNewPlan({
  program,
}: ResetProgressArgs): Promise<ResetProgressResult> {
  let files: string[] = [];
  try {
    files = (await readdir(PROGRESS_DIR)).filter(
      (f) => f.startsWith("progress_") && f.endsWith(".json"),
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }

  await mkdir(PROGRESS_DIR, { recursive: true });
  await Promise.all(files.map((f) => unlink(join(PROGRESS_DIR, f))));

  const progress = buildWeek1Progress(program);
  const progressFileName = buildProgressFileName(new Date());
  await writeFile(
    join(PROGRESS_DIR, progressFileName),
    `${JSON.stringify(progress, null, 2)}\n`,
  );
  console.log(
    `[temporal activity] wiped ${files.length} progress file(s); seeded week 1 → ${progressFileName}`,
  );
  return { progressFileName };
}
