import { describe, expect, it } from "vitest";
import {
  addDays,
  buildProgressFileName,
  nextMonday,
} from "./progressFile.ts";

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
