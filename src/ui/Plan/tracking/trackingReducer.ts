import type {
  ExcersiseDay,
  StrengthProgramStructure,
  WeightExcersise,
} from "../../../types/types";

export type TrackingState = StrengthProgramStructure;

export type TrackingAction =
  | { type: "HYDRATE"; week: StrengthProgramStructure }
  | {
      type: "TOGGLE_SET";
      dayId: number;
      exerciseName: string;
      setIndex: number;
    }
  | { type: "MARK_DAY_COMPLETE"; dayId: number };

export function performedCount(exercise: WeightExcersise): number {
  return exercise.performed_reps?.length ?? 0;
}

export function remainingSets(exercise: WeightExcersise): number {
  return Math.max(0, exercise.series - performedCount(exercise));
}

export function isExerciseComplete(exercise: WeightExcersise): boolean {
  return performedCount(exercise) >= exercise.series;
}

/** Training days: all exercises done. Empty routine: respect explicit completed. */
export function isDayRoutineComplete(day: ExcersiseDay): boolean {
  if (day.routine.length === 0) {
    return day.completed === true;
  }
  return day.routine.every(isExerciseComplete);
}

function updateDay(
  week: StrengthProgramStructure,
  dayId: number,
  updater: (day: ExcersiseDay) => ExcersiseDay,
): StrengthProgramStructure {
  return {
    ...week,
    program: week.program.map((day) =>
      day.id === dayId ? updater(day) : day,
    ),
  };
}

function updateExercise(
  day: ExcersiseDay,
  exerciseName: string,
  updater: (exercise: WeightExcersise) => WeightExcersise,
): ExcersiseDay {
  const routine = day.routine.map((exercise) =>
    exercise.name === exerciseName ? updater(exercise) : exercise,
  );
  const next: ExcersiseDay = { ...day, routine };
  if (routine.length > 0) {
    next.completed = isDayRoutineComplete(next);
  }
  return next;
}

/**
 * Only the next remaining set can be completed, and only the last completed
 * set can be undone — keeps performed_reps contiguous (no holes).
 */
export function toggleSet(
  week: StrengthProgramStructure,
  dayId: number,
  exerciseName: string,
  setIndex: number,
): StrengthProgramStructure {
  return updateDay(week, dayId, (day) =>
    updateExercise(day, exerciseName, (exercise) => {
      const done = performedCount(exercise);
      const reps = exercise.performed_reps ?? [];

      if (setIndex === done - 1) {
        const next = reps.slice(0, -1);
        return {
          ...exercise,
          performed_reps: next.length > 0 ? next : undefined,
        };
      }

      if (setIndex === done && done < exercise.series) {
        return {
          ...exercise,
          performed_reps: [...reps, exercise.reps],
        };
      }

      return exercise;
    }),
  );
}

export function markDayComplete(
  week: StrengthProgramStructure,
  dayId: number,
): StrengthProgramStructure {
  return updateDay(week, dayId, (day) => ({ ...day, completed: true }));
}

export function trackingReducer(
  state: TrackingState,
  action: TrackingAction,
): TrackingState {
  switch (action.type) {
    case "HYDRATE":
      return action.week;
    case "TOGGLE_SET":
      return toggleSet(
        state,
        action.dayId,
        action.exerciseName,
        action.setIndex,
      );
    case "MARK_DAY_COMPLETE":
      return markDayComplete(state, action.dayId);
    default:
      return state;
  }
}
