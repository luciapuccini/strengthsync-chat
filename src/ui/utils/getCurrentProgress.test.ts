import { describe, expect, it } from "vitest";
import { getCurrentProgress } from "./getCurrentProgress";

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
