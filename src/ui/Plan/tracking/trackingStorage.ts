import type { StrengthProgramStructure } from "../../../types/types";

export const TRACKING_STORAGE_KEY = "strengthsync-tracking-v1";

/** Progress weeks carry start_date; program templates may not. */
export type TrackingWeek = StrengthProgramStructure & {
  start_date?: string;
};

type TrackingDraft = {
  current_week: number;
  start_date?: string;
  week: TrackingWeek;
};

function weekIdentity(week: TrackingWeek): {
  current_week: number;
  start_date?: string;
} {
  return {
    current_week: week.current_week,
    start_date: week.start_date,
  };
}

export function matchesWeekIdentity(
  draft: Pick<TrackingDraft, "current_week" | "start_date">,
  fileWeek: TrackingWeek,
): boolean {
  if (draft.current_week !== fileWeek.current_week) {
    return false;
  }
  if (draft.start_date !== undefined && fileWeek.start_date !== undefined) {
    return draft.start_date === fileWeek.start_date;
  }
  return true;
}

export function parseTrackingDraft(
  raw: string | null,
  fileWeek: TrackingWeek,
): TrackingWeek | null {
  if (raw == null) return null;
  try {
    const draft = JSON.parse(raw) as TrackingDraft;
    if (
      typeof draft?.current_week !== "number" ||
      draft.week == null ||
      typeof draft.week !== "object"
    ) {
      return null;
    }
    if (!matchesWeekIdentity(draft, fileWeek)) {
      return null;
    }
    return draft.week;
  } catch {
    return null;
  }
}

export function serializeTrackingDraft(week: TrackingWeek): string {
  const identity = weekIdentity(week);
  const draft: TrackingDraft = {
    current_week: identity.current_week,
    start_date: identity.start_date,
    week,
  };
  return JSON.stringify(draft);
}

export function loadTrackingDraft(
  fileWeek: TrackingWeek,
  storage: Pick<Storage, "getItem"> = localStorage,
): TrackingWeek | null {
  try {
    return parseTrackingDraft(storage.getItem(TRACKING_STORAGE_KEY), fileWeek);
  } catch {
    return null;
  }
}

export function saveTrackingDraft(
  week: TrackingWeek,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  try {
    storage.setItem(TRACKING_STORAGE_KEY, serializeTrackingDraft(week));
  } catch {
    // Private mode / quota — ignore; in-memory state still works.
  }
}
