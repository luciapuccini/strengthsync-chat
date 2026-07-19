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

/** In-flight progress week for the gym tracker (unfinished, highest week). */
export function getCurrentWeekProgress(
  weeks: StrengthProgramStructure[] = getCurrentProgress().weeks,
): StrengthProgramStructure {
  if (weeks.length === 0) {
    throw new Error("No progress weeks available");
  }

  const unfinished = weeks.filter((w) => w.finished !== true);
  const candidates = unfinished.length > 0 ? unfinished : weeks;
  return candidates.reduce((best, week) =>
    week.current_week >= best.current_week ? week : best,
  );
}
