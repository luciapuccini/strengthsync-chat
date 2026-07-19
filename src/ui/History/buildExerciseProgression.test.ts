import { describe, expect, it } from "vitest";
import type { StrengthProgramStructure } from "../../types/types";
import { buildExerciseProgression } from "./buildExerciseProgression";

function week(
  partial: Partial<StrengthProgramStructure> &
    Pick<StrengthProgramStructure, "current_week" | "program">,
): StrengthProgramStructure {
  return {
    total_weeks: 6,
    training_days_per_week: 4,
    rest_days_per_week: 3,
    finished: true,
    ...partial,
  };
}

describe("buildExerciseProgression", () => {
  it("tracks weight_kg over time for weighted exercises", () => {
    const weeks = [
      week({
        current_week: 1,
        program: [
          {
            id: 1,
            type: "upper body",
            date: "2026-07-01",
            completed: true,
            routine: [
              {
                name: "PRES BANCA PLANO",
                series: 3,
                reps: 10,
                rest_time: 90,
                weight_kg: 26,
              },
            ],
          },
        ],
      }),
      week({
        current_week: 2,
        program: [
          {
            id: 1,
            type: "upper body",
            date: "2026-07-08",
            completed: true,
            routine: [
              {
                name: "PRES BANCA PLANO",
                series: 3,
                reps: 10,
                rest_time: 90,
                weight_kg: 28,
              },
            ],
          },
        ],
      }),
    ];

    expect(buildExerciseProgression(weeks)).toEqual([
      {
        name: "PRES BANCA PLANO",
        unit: "kg",
        points: [
          { date: "2026-07-01", value: 26 },
          { date: "2026-07-08", value: 28 },
        ],
      },
    ]);
  });

  it("uses total performed_reps for bodyweight exercises like FLEXIONES", () => {
    const weeks = [
      week({
        current_week: 1,
        program: [
          {
            id: 1,
            type: "upper body",
            date: "2026-07-01",
            completed: true,
            routine: [
              {
                name: "FLEXIONES",
                series: 3,
                reps: 8,
                rest_time: 90,
                performed_reps: [8, 8, 7],
              },
            ],
          },
        ],
      }),
      week({
        current_week: 2,
        program: [
          {
            id: 1,
            type: "upper body",
            date: "2026-07-08",
            completed: true,
            routine: [
              {
                name: "FLEXIONES",
                series: 3,
                reps: 10,
                rest_time: 90,
                performed_reps: [10, 10, 9],
              },
            ],
          },
        ],
      }),
    ];

    expect(buildExerciseProgression(weeks)).toEqual([
      {
        name: "FLEXIONES",
        unit: "reps",
        points: [
          { date: "2026-07-01", value: 23 },
          { date: "2026-07-08", value: 29 },
        ],
      },
    ]);
  });

  it("skips incomplete days and series with fewer than 2 points", () => {
    const weeks = [
      week({
        current_week: 1,
        program: [
          {
            id: 1,
            type: "upper body",
            date: "2026-07-01",
            completed: false,
            routine: [
              {
                name: "REMO",
                series: 3,
                reps: 10,
                rest_time: 90,
                weight_kg: 20,
              },
            ],
          },
          {
            id: 2,
            type: "upper body",
            date: "2026-07-02",
            completed: true,
            routine: [
              {
                name: "REMO",
                series: 3,
                reps: 10,
                rest_time: 90,
                weight_kg: 22,
              },
            ],
          },
        ],
      }),
    ];

    expect(buildExerciseProgression(weeks)).toEqual([]);
  });
});
