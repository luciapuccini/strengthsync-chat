// Single source of truth for Temporal connection/config.
// This is a plain Node.js process (not the Workers runtime), so process.env is fine here.

export const TASK_QUEUE = "strengthsync";
export const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE ?? "default";
export const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
export const TEMPORAL_API_PORT = Number(process.env.TEMPORAL_API_PORT ?? 3001);

/** Ensure scheme is present — bare `localhost:5173` never matches browser Origin. */
function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, "");
  return `http://${trimmed}`.replace(/\/$/, "");
}

/**
 * CORS allowlist for the Temporal Hono API.
 * Comma-separated in UI_ORIGIN, e.g. `http://localhost:5173,http://mac:5173`.
 */
export const UI_ORIGINS: string[] = (
  process.env.UI_ORIGIN ?? "http://localhost:5173"
)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

/** @deprecated Prefer UI_ORIGINS — kept for any single-origin callers. */
export const UI_ORIGIN = UI_ORIGINS[0] ?? "http://localhost:5173";

const TEMPORAL_API_KEY = process.env.TEMPORAL_API_KEY;

// Temporal Cloud requires TLS + API key auth; the local dev server uses neither.
// When TEMPORAL_API_KEY is set (via .dev.vars), worker + API connect to Cloud.
export const connectionOptions = {
  address: TEMPORAL_ADDRESS,
  ...(TEMPORAL_API_KEY ? { tls: true as const, apiKey: TEMPORAL_API_KEY } : {}),
};

export const connectionTarget = TEMPORAL_API_KEY
  ? `Temporal Cloud (${TEMPORAL_ADDRESS})`
  : `local dev server (${TEMPORAL_ADDRESS})`;
