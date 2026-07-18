import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// JSON files are the data store (discovery phase). The in-flight week lives in
// src/app/dashboard/progress.json; completed weeks are archived next to it in
// PROGRESS_DIR as progress_<datetimestamp>.json snapshots. Generated plans are
// archived the same way in PROGRAM_DIR; program.json is the active template.

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "../app");
const dashboardDir = resolve(appDir, "dashboard");

export const PROGRESS_FILE = resolve(dashboardDir, "progress.json");
export const PROGRAM_FILE = resolve(dashboardDir, "program.json");
export const PROGRESS_DIR = resolve(dashboardDir, "progress");
export const PROGRAM_DIR = resolve(dashboardDir, "program");
export const CLIENT_PROFILE_FILE = resolve(appDir, "client_profile.json");
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
