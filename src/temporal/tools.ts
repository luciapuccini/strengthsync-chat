import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { tool } from "ai";
import { z } from "zod";
import {
  PROGRESS_DIR,
  resolveCurrentProgramPath,
  TRAINING_RULES_FILE,
} from "./progressFile.ts";

async function readJsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

// Tools for the weekly analysis agent. Node-only (fs) — the Worker's chat
// tools live in src/worker/agent/tools/ and read statically bundled JSON.
export function buildAnalysisTools() {
  return {
    getCurrentProgram: tool({
      description:
        "Get the user's current strength plan template (training days, exercises, target series/reps).",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          return await readJsonFile(await resolveCurrentProgramPath());
        } catch (err) {
          return { error: `Could not read program: ${errMessage(err)}` };
        }
      },
    }),
    getProgressFile: tool({
      description:
        "Read one archived weekly progress file by file name (see listProgressFiles). Contains per-day completed flags, weights, performed reps and notes.",
      inputSchema: z.object({
        fileName: z
          .string()
          .describe(
            "Progress file name, e.g. progress_2026-07-18T14-32-05-000Z.json",
          ),
      }),
      execute: async ({ fileName }) => {
        try {
          // basename only — no path traversal outside PROGRESS_DIR.
          return await readJsonFile(join(PROGRESS_DIR, basename(fileName)));
        } catch (err) {
          return { error: `Could not read progress file: ${errMessage(err)}` };
        }
      },
    }),
    listProgressFiles: tool({
      description:
        "List archived weekly progress files (progress_<datetimestamp>.json), newest first.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const files = (await readdir(PROGRESS_DIR))
            .filter((f) => f.startsWith("progress_") && f.endsWith(".json"))
            .sort()
            .reverse();
          return { files };
        } catch (err) {
          return { error: `Could not list progress files: ${errMessage(err)}` };
        }
      },
    }),
    getTrainingRules: tool({
      description:
        "Read the StrengthSync coaching rules (progression, nutrition, fatigue, rest-day prescriptions).",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          return { rules: await readFile(TRAINING_RULES_FILE, "utf8") };
        } catch (err) {
          return {
            error: `Could not read training rules: ${errMessage(err)}`,
          };
        }
      },
    }),
  };
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
