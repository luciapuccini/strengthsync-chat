import type { StrengthProgramStructure } from "../../types/types";

export const TEMPORAL_API_URL =
  import.meta.env.VITE_TEMPORAL_API_URL ?? "http://localhost:3001";

export type HistoryWeeksResponse = {
  weeks: StrengthProgramStructure[];
  error?: string;
};

export async function fetchHistoryWeeks(): Promise<HistoryWeeksResponse> {
  const response = await fetch(`${TEMPORAL_API_URL}/api/progress/history`);
  const data = (await response.json()) as HistoryWeeksResponse;
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data;
}
