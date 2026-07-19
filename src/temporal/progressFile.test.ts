import { basename } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addDays,
  buildProgressFileName,
  buildWeek1Progress,
  listFinishedProgressWeeks,
  mergeProgressDay,
  nextMonday,
  resolveLatestProgressPath,
  toIsoDate,
} from "./progressFile.ts";
import type { GeneratedProgram, ProgressWeek } from "./schemas.ts";

const sampleProgram: GeneratedProgram = {
  current_week: 1,
  total_weeks: 6,
  training_days_per_week: 4,
  rest_days_per_week: 3,
  program: [
    { id: 1, type: "upper body", routine: [] },
    { id: 2, type: "leg day", routine: [] },
    { id: 3, type: "rest", notes: "walk", routine: [] },
    { id: 4, type: "upper body", routine: [] },
    { id: 5, type: "cardio", routine: [] },
    { id: 6, type: "leg day", routine: [] },
    { id: 7, type: "rest", routine: [] },
  ],
};

const sampleWeek: ProgressWeek = {
  current_week: 2,
  total_weeks: 6,
  training_days_per_week: 4,
  rest_days_per_week: 3,
  start_date: "2026-07-27",
  end_date: "2026-08-02",
  finished: false,
  program: [
    {
      id: 1,
      type: "upper body",
      date: "2026-07-27",
      completed: false,
      routine: [
        {
          name: "PRESS",
          series: 3,
          reps: 8,
          rest_time: 90,
          weight_kg: 30,
        },
      ],
    },
    {
      id: 2,
      type: "rest",
      date: "2026-07-28",
      completed: false,
      routine: [],
    },
  ],
};

describe("buildProgressFileName", () => {
  it("builds an ISO-timestamped progress file name", () => {
    const date = new Date("2026-07-18T14:32:05.123Z");
    expect(buildProgressFileName(date)).toBe(
      "progress_2026-07-18T14-32-05-123Z.json",
    );
  });

  it("keeps the timestamp filesystem-safe (no colons or dots)", () => {
    const name = buildProgressFileName(new Date("2026-01-01T00:00:00.000Z"));
    const stamp = name.replace(/^progress_/, "").replace(/\.json$/, "");
    expect(stamp).not.toMatch(/[:.]/);
  });
});

describe("resolveLatestProgressPath", () => {
  it("returns the newest progress file by filename timestamp", async () => {
    const path = await resolveLatestProgressPath();
    expect(basename(path)).toMatch(/^progress_.+\.json$/);
  });
});

describe("listFinishedProgressWeeks", () => {
  it("returns only finished weeks sorted by start_date", async () => {
    const weeks = await listFinishedProgressWeeks();
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks.every((w) => w.finished === true)).toBe(true);
    const dates = weeks.map((w) => w.start_date);
    expect(dates).toEqual([...dates].sort());
  });
});

describe("nextMonday", () => {
  it("returns the same day when it is Monday", () => {
    expect(nextMonday(new Date("2026-07-13T10:00:00Z")).toISOString()).toBe(
      "2026-07-13T00:00:00.000Z",
    );
  });

  it("returns the upcoming Monday mid-week", () => {
    // Saturday 2026-07-18 → Monday 2026-07-20
    expect(nextMonday(new Date("2026-07-18T10:00:00Z")).toISOString()).toBe(
      "2026-07-20T00:00:00.000Z",
    );
  });

  it("returns the next day when it is Sunday", () => {
    expect(nextMonday(new Date("2026-07-19T10:00:00Z")).toISOString()).toBe(
      "2026-07-20T00:00:00.000Z",
    );
  });
});

describe("addDays", () => {
  it("adds days across a month boundary", () => {
    expect(
      addDays(new Date("2026-07-31T00:00:00Z"), 1).toISOString(),
    ).toBe("2026-08-01T00:00:00.000Z");
  });
});

describe("buildWeek1Progress", () => {
  it("seeds Mon–Sun dates from the upcoming Monday", () => {
    const progress = buildWeek1Progress(
      sampleProgram,
      new Date("2026-07-19T12:00:00Z"),
    );
    expect(progress.current_week).toBe(1);
    expect(progress.finished).toBe(false);
    expect(progress.start_date).toBe("2026-07-20");
    expect(progress.end_date).toBe("2026-07-26");
    expect(progress.program.map((d) => d.date)).toEqual([
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
    ]);
    expect(progress.program.every((d) => d.completed === false)).toBe(true);
  });

  it("formats ISO dates as YYYY-MM-DD", () => {
    expect(toIsoDate(new Date("2026-07-20T00:00:00.000Z"))).toBe("2026-07-20");
  });
});

describe("mergeProgressDay", () => {
  it("replaces the matching day and keeps other days", () => {
    const updated = {
      ...sampleWeek.program[0]!,
      completed: true,
      routine: [
        {
          name: "PRESS",
          series: 3,
          reps: 8,
          rest_time: 90,
          weight_kg: 30,
          performed_reps: [8, 8, 8],
        },
      ],
    };
    const merged = mergeProgressDay(sampleWeek, updated);
    expect(merged.program[0]).toEqual(updated);
    expect(merged.program[1]).toEqual(sampleWeek.program[1]);
    expect(merged).not.toBe(sampleWeek);
  });

  it("throws when dayId is missing", () => {
    expect(() =>
      mergeProgressDay(sampleWeek, {
        id: 99,
        type: "rest",
        completed: true,
        routine: [],
      }),
    ).toThrow(/Day id 99 not found/);
  });
});
