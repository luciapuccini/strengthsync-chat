import { describe, expect, it } from "vitest";
import type {
  ExcersiseDay,
  StrengthProgramStructure,
  WeightExcersise,
} from "../../../types/types";
import {
  isDayRoutineComplete,
  isExerciseComplete,
  markDayComplete,
  remainingSets,
  toggleSet,
  trackingReducer,
} from "./trackingReducer";

function exercise(
  overrides: Partial<WeightExcersise> & Pick<WeightExcersise, "name">,
): WeightExcersise {
  return {
    series: 3,
    reps: 8,
    rest_time: 90,
    weight_kg: 30,
    ...overrides,
  };
}

function day(overrides: Partial<ExcersiseDay> = {}): ExcersiseDay {
  return {
    id: 1,
    type: "upper body",
    completed: false,
    routine: [exercise({ name: "PRESS" })],
    ...overrides,
  };
}

function week(overrides: Partial<StrengthProgramStructure> = {}): StrengthProgramStructure {
  return {
    current_week: 2,
    total_weeks: 6,
    training_days_per_week: 4,
    rest_days_per_week: 3,
    finished: false,
    program: [day()],
    ...overrides,
  };
}

describe("isExerciseComplete / remainingSets", () => {
  it("treats missing performed_reps as zero done", () => {
    const ex = exercise({ name: "PRESS" });
    expect(isExerciseComplete(ex)).toBe(false);
    expect(remainingSets(ex)).toBe(3);
  });

  it("is complete when performed_reps length reaches series", () => {
    const ex = exercise({ name: "PRESS", performed_reps: [8, 8, 8] });
    expect(isExerciseComplete(ex)).toBe(true);
    expect(remainingSets(ex)).toBe(0);
  });
});

describe("toggleSet", () => {
  it("completes the next remaining set with planned reps", () => {
    const next = toggleSet(week(), 1, "PRESS", 0);
    const ex = next.program[0]!.routine[0]!;
    expect(ex.performed_reps).toEqual([8]);
    expect(remainingSets(ex)).toBe(2);
  });

  it("ignores out-of-order taps (not the next set)", () => {
    const next = toggleSet(week(), 1, "PRESS", 2);
    expect(next.program[0]!.routine[0]!.performed_reps).toBeUndefined();
  });

  it("undoes only the last completed set", () => {
    let state = toggleSet(week(), 1, "PRESS", 0);
    state = toggleSet(state, 1, "PRESS", 1);
    expect(state.program[0]!.routine[0]!.performed_reps).toEqual([8, 8]);

    state = toggleSet(state, 1, "PRESS", 1);
    expect(state.program[0]!.routine[0]!.performed_reps).toEqual([8]);
  });

  it("ignores undo taps that are not the last completed set", () => {
    let state = toggleSet(week(), 1, "PRESS", 0);
    state = toggleSet(state, 1, "PRESS", 1);
    state = toggleSet(state, 1, "PRESS", 0);
    expect(state.program[0]!.routine[0]!.performed_reps).toEqual([8, 8]);
  });

  it("marks the day completed when all exercises finish", () => {
    const state = week({
      program: [
        day({
          routine: [
            exercise({ name: "A", series: 1 }),
            exercise({ name: "B", series: 1 }),
          ],
        }),
      ],
    });
    let next = toggleSet(state, 1, "A", 0);
    expect(next.program[0]!.completed).toBe(false);
    next = toggleSet(next, 1, "B", 0);
    expect(next.program[0]!.completed).toBe(true);
    expect(isDayRoutineComplete(next.program[0]!)).toBe(true);
  });

  it("does not mutate the previous week object", () => {
    const prev = week();
    const next = toggleSet(prev, 1, "PRESS", 0);
    expect(next).not.toBe(prev);
    expect(prev.program[0]!.routine[0]!.performed_reps).toBeUndefined();
    expect(next.program[0]!.routine[0]!.performed_reps).toEqual([8]);
  });
});

describe("markDayComplete", () => {
  it("sets completed on empty-routine days", () => {
    const state = week({
      program: [day({ type: "rest", routine: [], completed: false })],
    });
    const next = markDayComplete(state, 1);
    expect(next.program[0]!.completed).toBe(true);
    expect(isDayRoutineComplete(next.program[0]!)).toBe(true);
  });
});

describe("trackingReducer", () => {
  it("hydrates state", () => {
    const hydrated = week({ current_week: 3 });
    expect(
      trackingReducer(week(), { type: "HYDRATE", week: hydrated }),
    ).toEqual(hydrated);
  });

  it("dispatches TOGGLE_SET", () => {
    const next = trackingReducer(week(), {
      type: "TOGGLE_SET",
      dayId: 1,
      exerciseName: "PRESS",
      setIndex: 0,
    });
    expect(next.program[0]!.routine[0]!.performed_reps).toEqual([8]);
  });
});
