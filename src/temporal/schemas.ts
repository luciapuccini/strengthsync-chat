import { z } from "zod";

// Zod mirror of the program / progress file shapes — used (a) to validate
// LLM structured output and (b) as drift guards against real data files
// (see schemas.test.ts). src/types/types.ts holds the UI's TS-only equivalent.

const exerciseSchema = z.object({
  name: z.string(),
  series: z.number().int(),
  reps: z.number().int(),
  rest_time: z.number().int(),
  notes: z.string().optional(),
  weight_kg: z.number().optional(),
});

const daySchema = z.object({
  id: z.number().int(),
  type: z.enum(["upper body", "leg day", "rest", "swimming", "cardio"]),
  // Day-level notes: rest days use them for light-activity prescriptions
  // (training rule 4), e.g. "10k pasos + movilidad".
  notes: z.string().optional(),
  routine: z.array(exerciseSchema),
});

// File shape: optional fields are simply absent.
export const programSchema = z.object({
  current_week: z.number().int(),
  total_weeks: z.number().int(),
  training_days_per_week: z.number().int(),
  rest_days_per_week: z.number().int(),
  program: z.array(daySchema),
});

// OpenAI strict structured output rejects optional properties (every key must
// be in `required`), so the LLM-facing schema makes them nullable instead;
// nulls are stripped back to the file shape after generation.
const llmExerciseSchema = exerciseSchema.extend({
  notes: z.string().nullable(),
  weight_kg: z.number().nullable(),
});

const llmDaySchema = daySchema.extend({
  notes: z.string().nullable(),
  routine: z.array(llmExerciseSchema),
});

// LLM output = program + a coach rationale. The rationale is returned to the
// UI but stripped before the plan is written to disk.
export const generatedPlanSchema = programSchema.extend({
  program: z.array(llmDaySchema),
  rationale: z.string(),
});

export type GeneratedProgram = z.infer<typeof programSchema>;
export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;

// ── Progress week (weekly archive / next-week generation) ───────────────────

const progressExerciseSchema = exerciseSchema.extend({
  performed_reps: z.array(z.number().int()).optional(),
});

const progressDaySchema = daySchema.extend({
  date: z.string().optional(),
  completed: z.boolean().optional(),
  routine: z.array(progressExerciseSchema),
});

// On-disk progress_<timestamp>.json shape (finished weeks may include
// performed_reps; in-flight weeks have finished: false / omitted).
export const progressWeekSchema = z.object({
  current_week: z.number().int(),
  total_weeks: z.number().int(),
  training_days_per_week: z.number().int(),
  rest_days_per_week: z.number().int(),
  start_date: z.string(),
  end_date: z.string(),
  finished: z.boolean().optional(),
  program: z.array(progressDaySchema),
});

const llmProgressExerciseSchema = exerciseSchema.extend({
  notes: z.string().nullable(),
  weight_kg: z.number().nullable(),
});

const llmProgressDaySchema = z.object({
  id: z.number().int(),
  type: z.enum(["upper body", "leg day", "rest", "swimming", "cardio"]),
  date: z.string(),
  completed: z.boolean(),
  notes: z.string().nullable(),
  routine: z.array(llmProgressExerciseSchema),
});

// LLM output for the upcoming week template (no performed_reps).
export const generatedProgressWeekSchema = z.object({
  current_week: z.number().int(),
  total_weeks: z.number().int(),
  training_days_per_week: z.number().int(),
  rest_days_per_week: z.number().int(),
  start_date: z.string(),
  end_date: z.string(),
  finished: z.boolean(),
  program: z.array(llmProgressDaySchema),
});

export type ProgressWeek = z.infer<typeof progressWeekSchema>;
export type GeneratedProgressWeek = z.infer<typeof generatedProgressWeekSchema>;
