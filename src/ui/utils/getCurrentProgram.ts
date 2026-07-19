import type { StrengthProgramStructure } from "../../types/types";

const programModules = import.meta.glob<{ default: StrengthProgramStructure }>(
  "../../app/dashboard/program/program_*.json",
  { eager: true },
);

export function getCurrentProgram(): StrengthProgramStructure {
  // Lexicographic descending matches resolveNewestTimestampedPath (ISO stamps).
  const paths = Object.keys(programModules).sort().reverse();

  if (paths.length === 0) {
    throw new Error("No program files found in dashboard/program");
  }

  return programModules[paths[0]!]!.default;
}
