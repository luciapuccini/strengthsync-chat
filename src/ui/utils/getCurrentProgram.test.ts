import { describe, expect, it } from "vitest";
import { getCurrentProgram } from "./getCurrentProgram";

describe("getCurrentProgram", () => {
  it("returns the program file from dashboard/program", () => {
    expect(getCurrentProgram()).toBeDefined();
  });
});
