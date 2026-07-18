import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// JSON files are the data store (discovery phase). The in-flight week lives in
// src/app/dashboard/progress.json; completed weeks are archived next to it in
// PROGRESS_DIR as progress_<datetimestamp>.json snapshots.

const dashboardDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../app/dashboard",
);

export const PROGRESS_FILE = resolve(dashboardDir, "progress.json");
export const PROGRAM_FILE = resolve(dashboardDir, "program.json");
export const PROGRESS_DIR = resolve(dashboardDir, "progress");

// progress_<datetimestamp>.json — ISO UTC, filesystem-safe (no colons/dots):
// progress_2026-07-18T14-32-05-000Z.json
export function buildProgressFileName(date: Date): string {
  const iso = date.toISOString().replaceAll(":", "-").replace(".", "-");
  return `progress_${iso}.json`;
}
