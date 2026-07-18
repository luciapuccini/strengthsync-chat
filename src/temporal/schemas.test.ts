import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROGRAM_FILE } from "./progressFile.ts";
import { programSchema } from "./schemas.ts";

describe("programSchema", () => {
  it("parses the active program.json (drift guard)", () => {
    const raw = JSON.parse(readFileSync(PROGRAM_FILE, "utf8"));
    expect(() => programSchema.parse(raw)).not.toThrow();
  });
});
