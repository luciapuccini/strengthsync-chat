import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  progressWeekSchema,
  type GeneratedProgram,
  type ProgressWeek,
} from "./schemas.ts";

// JSON files are the data store (discovery phase). Weekly progress lives only
// under PROGRESS_DIR as progress_<datetimestamp>.json snapshots (newest =
// in-flight week). End-of-plan wipe clears archives then seeds week 1.
// Generated plans live in PROGRAM_DIR as program_<datetimestamp>.json — the
// newest file is active.

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "../app");
const dashboardDir = resolve(appDir, "dashboard");

export const PROGRESS_DIR = resolve(dashboardDir, "progress");
export const PROGRAM_DIR = resolve(dashboardDir, "program");
export const CLIENT_PROFILE_FILE = resolve(
  dashboardDir,
  "client/client_profile.json",
);
export const TRAINING_RULES_FILE = resolve(appDir, "coach/training_rules.md");

// <prefix>_<datetimestamp>.json — ISO UTC, filesystem-safe (no colons/dots):
// progress_2026-07-18T14-32-05-000Z.json
export function timestampedFileName(prefix: string, date: Date): string {
  const iso = date.toISOString().replaceAll(":", "-").replace(".", "-");
  return `${prefix}_${iso}.json`;
}

export function buildProgressFileName(date: Date): string {
  return timestampedFileName("progress", date);
}

export function buildProgramFileName(date: Date): string {
  return timestampedFileName("program", date);
}

async function resolveNewestTimestampedPath(
  dir: string,
  prefix: string,
): Promise<string> {
  const files = (await readdir(dir))
    .filter((f) => f.startsWith(`${prefix}_`) && f.endsWith(".json"))
    .sort()
    .reverse();
  if (files.length === 0) {
    throw new Error(`No ${prefix}_*.json files found in ${dir}`);
  }
  return join(dir, files[0]!);
}

/** Newest program_<datetimestamp>.json under PROGRAM_DIR (active template). */
export async function resolveCurrentProgramPath(): Promise<string> {
  return resolveNewestTimestampedPath(PROGRAM_DIR, "program");
}

/** Newest progress_<datetimestamp>.json under PROGRESS_DIR (closest to today). */
export async function resolveLatestProgressPath(): Promise<string> {
  return resolveNewestTimestampedPath(PROGRESS_DIR, "progress");
}

// Week start for a freshly generated plan: the upcoming Monday (today if it
// is Monday). UTC-based to stay timezone-stable on the worker.
export function nextMonday(from: Date): Date {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday
  d.setUTCDate(d.getUTCDate() + ((8 - day) % 7));
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Week-1 in-flight progress from a newly activated program template. */
export function buildWeek1Progress(
  program: GeneratedProgram,
  from: Date = new Date(),
): ProgressWeek {
  const start = nextMonday(from);
  const end = addDays(start, 6);
  return {
    current_week: 1,
    total_weeks: program.total_weeks,
    training_days_per_week: program.training_days_per_week,
    rest_days_per_week: program.rest_days_per_week,
    start_date: toIsoDate(start),
    end_date: toIsoDate(end),
    finished: false,
    program: program.program.map((day, i) => ({
      ...day,
      date: toIsoDate(addDays(start, i)),
      completed: false,
    })),
  };
}

/** Pure merge: replace the day with matching id. Throws if dayId is missing. */
export function mergeProgressDay(
  week: ProgressWeek,
  day: ProgressWeek["program"][number],
): ProgressWeek {
  const index = week.program.findIndex((d) => d.id === day.id);
  if (index === -1) {
    throw new Error(`Day id ${day.id} not found in current progress week`);
  }
  const program = [...week.program];
  program[index] = day;
  return { ...week, program };
}

/** Read newest progress file, merge day, validate, overwrite same file. */
export async function updateProgressDay(
  day: ProgressWeek["program"][number],
): Promise<{ dayId: number; path: string }> {
  const path = await resolveLatestProgressPath();
  const raw = JSON.parse(await readFile(path, "utf8")) as unknown;
  const week = progressWeekSchema.parse(raw);
  const merged = progressWeekSchema.parse(mergeProgressDay(week, day));
  await writeFile(path, `${JSON.stringify(merged, null, 2)}\n`);
  return { dayId: day.id, path };
}
