import { describe, expect, it } from "vitest";
import { buildProgressFileName } from "./progressFile.ts";

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
