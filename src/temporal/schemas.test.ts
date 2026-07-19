import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  resolveCurrentProgramPath,
  resolveLatestProgressPath,
} from "./progressFile.ts";
import { programSchema, progressWeekSchema } from "./schemas.ts";

describe("programSchema", () => {
  it("parses the active program file (drift guard)", async () => {
    const raw = JSON.parse(
      await readFile(await resolveCurrentProgramPath(), "utf8"),
    );
    expect(() => programSchema.parse(raw)).not.toThrow();
  });
});

describe("progressWeekSchema", () => {
  it("parses the latest progress file (drift guard)", async () => {
    const raw = JSON.parse(
      await readFile(await resolveLatestProgressPath(), "utf8"),
    );
    expect(() => progressWeekSchema.parse(raw)).not.toThrow();
  });
});
