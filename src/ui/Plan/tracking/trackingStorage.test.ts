import { describe, expect, it } from "vitest";
import type { TrackingWeek } from "./trackingStorage";
import {
  matchesWeekIdentity,
  parseTrackingDraft,
  serializeTrackingDraft,
} from "./trackingStorage";

function week(overrides: Partial<TrackingWeek> = {}): TrackingWeek {
  return {
    current_week: 2,
    total_weeks: 6,
    training_days_per_week: 4,
    rest_days_per_week: 3,
    start_date: "2026-07-27",
    finished: false,
    program: [],
    ...overrides,
  };
}

describe("matchesWeekIdentity", () => {
  it("accepts matching current_week and start_date", () => {
    expect(
      matchesWeekIdentity(
        { current_week: 2, start_date: "2026-07-27" },
        week(),
      ),
    ).toBe(true);
  });

  it("rejects mismatched current_week", () => {
    expect(
      matchesWeekIdentity(
        { current_week: 1, start_date: "2026-07-27" },
        week(),
      ),
    ).toBe(false);
  });

  it("rejects mismatched start_date when both are present", () => {
    expect(
      matchesWeekIdentity(
        { current_week: 2, start_date: "2026-07-20" },
        week(),
      ),
    ).toBe(false);
  });
});

describe("parseTrackingDraft / serializeTrackingDraft", () => {
  it("round-trips a matching draft", () => {
    const draftWeek = week({
      program: [
        {
          id: 1,
          type: "upper body",
          completed: false,
          routine: [
            {
              name: "PRESS",
              series: 3,
              reps: 8,
              rest_time: 90,
              performed_reps: [8, 8],
            },
          ],
        },
      ],
    });
    const parsed = parseTrackingDraft(
      serializeTrackingDraft(draftWeek),
      week(),
    );
    expect(parsed).toEqual(draftWeek);
  });

  it("returns null for a stale week identity", () => {
    const stale = serializeTrackingDraft(week({ current_week: 1 }));
    expect(parseTrackingDraft(stale, week())).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseTrackingDraft("{", week())).toBeNull();
  });
});
