import type { StrengthProgramStructure } from "../../types/types";

export type ProgressionPoint = {
  date: string;
  value: number;
};

export type ExerciseProgression = {
  name: string;
  unit: "kg" | "reps";
  points: ProgressionPoint[];
};

function metricForExercise(exercise: {
  weight_kg?: number;
  reps: number;
  performed_reps?: number[];
}): { value: number; unit: "kg" | "reps" } {
  if (exercise.weight_kg !== undefined) {
    return { value: exercise.weight_kg, unit: "kg" };
  }
  const reps =
    exercise.performed_reps !== undefined
      ? exercise.performed_reps.reduce((sum, n) => sum + n, 0)
      : exercise.reps;
  return { value: reps, unit: "reps" };
}

/** Build one time series per exercise from finished weeks' completed days. */
export function buildExerciseProgression(
  weeks: StrengthProgramStructure[],
): ExerciseProgression[] {
  const byName = new Map<
    string,
    { unit: "kg" | "reps"; points: ProgressionPoint[] }
  >();

  for (const week of weeks) {
    for (const day of week.program) {
      if (day.completed !== true || !day.date) continue;

      for (const exercise of day.routine) {
        const { value, unit } = metricForExercise(exercise);
        const existing = byName.get(exercise.name);
        if (!existing) {
          byName.set(exercise.name, {
            unit,
            points: [{ date: day.date, value }],
          });
        } else {
          existing.points.push({ date: day.date, value });
        }
      }
    }
  }

  const series: ExerciseProgression[] = [];
  for (const [name, { unit, points }] of byName) {
    points.sort((a, b) => a.date.localeCompare(b.date));
    if (points.length < 2) continue;
    series.push({ name, unit, points });
  }

  series.sort((a, b) => a.name.localeCompare(b.name));
  return series;
}
