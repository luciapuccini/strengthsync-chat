import type { StrengthProgramStructure } from "../../types/types";

export type CombinedProgress = {
  weeks: StrengthProgramStructure[];
};

const progressModules = import.meta.glob<{ default: StrengthProgramStructure }>(
  "../../app/dashboard/progress/progress_*.json",
  { eager: true },
);

export function getCurrentProgress(): CombinedProgress {
  const weeks = Object.values(progressModules).map((m) => m.default);

  if (weeks.length === 0) {
    throw new Error("No progress files found in dashboard/progress");
  }

  weeks.sort((a, b) => a.current_week - b.current_week);

  return { weeks };
}
