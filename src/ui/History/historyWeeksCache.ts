import { fetchHistoryWeeks, type HistoryWeeksResponse } from "@/api/temporalApi";

let historyPromise: Promise<HistoryWeeksResponse> | null = null;

export function getHistoryWeeksPromise(): Promise<HistoryWeeksResponse> {
  if (!historyPromise) {
    historyPromise = fetchHistoryWeeks();
  }
  return historyPromise;
}

export function resetHistoryWeeksPromise(): void {
  historyPromise = null;
}
