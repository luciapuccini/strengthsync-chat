import { describe, expect, it } from "vitest";
import type { StrengthProgramStructure } from "../../types/types";
import {
  getCurrentProgress,
  getCurrentWeekProgress,
} from "./getCurrentProgress";

describe("getCurrentProgress", () => {
  it("returns in-flight progress weeks ordered by current_week", () => {
    const result = getCurrentProgress();

    expect(result.weeks.length).toBeGreaterThanOrEqual(1);
    expect(result.weeks.map((w) => w.current_week)).toEqual(
      [...result.weeks.map((w) => w.current_week)].sort((a, b) => a - b),
    );

    const week1 = result.weeks[0]!;
    expect(week1.current_week).toBe(1);
    expect(week1.program.length).toBe(7);
    expect(week1.program[0]!.completed).toBe(false);
  });
});

describe("getCurrentWeekProgress", () => {
  it("prefers the unfinished week with the highest current_week", () => {
    const weeks: StrengthProgramStructure[] = [
      {
        current_week: 1,
        total_weeks: 6,
        training_days_per_week: 4,
        rest_days_per_week: 3,
        finished: true,
        program: [],
      },
      {
        current_week: 2,
        total_weeks: 6,
        training_days_per_week: 4,
        rest_days_per_week: 3,
        finished: false,
        program: [],
      },
    ];
    expect(getCurrentWeekProgress(weeks).current_week).toBe(2);
  });

  it("falls back to the highest week when all are finished", () => {
    const weeks: StrengthProgramStructure[] = [
      {
        current_week: 1,
        total_weeks: 2,
        training_days_per_week: 4,
        rest_days_per_week: 3,
        finished: true,
        program: [],
      },
      {
        current_week: 2,
        total_weeks: 2,
        training_days_per_week: 4,
        rest_days_per_week: 3,
        finished: true,
        program: [],
      },
    ];
    expect(getCurrentWeekProgress(weeks).current_week).toBe(2);
  });
});
