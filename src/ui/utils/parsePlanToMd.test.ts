import { describe, expect, it } from "vitest";
import { parsePlanToMd } from "./parsePlanToMd";
import type { StrengthProgramStructure } from "../../types/types";

const samplePlan: StrengthProgramStructure = {
  current_week: 3,
  total_weeks: 6,
  training_days_per_week: 4,
  rest_days_per_week: 3,
  program: [
    {
      id: 1,
      type: "upper body",
      routine: [
        { name: "PRES BANCA PLANO", series: 4, reps: 8, rest_time: 90 },
        { name: "JALÓN AL PECHO", series: 4, reps: 12, rest_time: 90, weight_kg: 30 },
        { name: "REMO GIRONDA", series: 3, reps: 12, rest_time: 90 },
        { name: "PRES HOMBRO BARRA BAJA", series: 3, reps: 10, rest_time: 90 },
        { name: "CURL DE BICEPS", series: 3, reps: 12, rest_time: 90 },
        { name: "EXTENSIÓN TRICEPS POLEA", series: 3, reps: 12, rest_time: 90 },
        { name: "FLEXIONES", series: 3, reps: 8, rest_time: 90 },
      ],
    },
    {
      id: 2,
      type: "leg day",
      routine: [
        { name: "SENTADILLA FRONTAL", series: 3, reps: 10, rest_time: 90 },
        { name: "PESO MUERTO", series: 4, reps: 10, rest_time: 90 },
        { name: "ZANCADAS", series: 4, reps: 15, rest_time: 90 },
        { name: "HIPEREXTENSIÓN", series: 3, reps: 12, rest_time: 90 },
        { name: "EXTENSIÓN CUÁDRICEPS", series: 3, reps: 12, rest_time: 90 },
        { name: "LEG CURL", series: 3, reps: 12, rest_time: 90 },
      ],
    },
    {
      id: 3,
      type: "upper body",
      routine: [
        { name: "DOMINADAS", series: 4, reps: 6, rest_time: 90, notes: "CON GOMA" },
        { name: "REMO 45", series: 4, reps: 10, rest_time: 90 },
        { name: "ELEVACIÓN LATERAL", series: 3, reps: 8, rest_time: 90 },
        { name: "DOMINADAS BARRA BAJA", series: 3, reps: 8, rest_time: 90 },
        { name: "EXTENSIÓN TRICEPS TRAS NUCA", series: 3, reps: 12, rest_time: 90 },
        { name: "FACE PULL", series: 3, reps: 12, rest_time: 90 },
      ],
    },
    {
      id: 4,
      type: "leg day",
      routine: [
        { name: "SENTADILLA", series: 4, reps: 10, rest_time: 90 },
        { name: "PESO MUERTO", series: 4, reps: 10, rest_time: 90 },
        { name: "SUMO", series: 3, reps: 8, rest_time: 90 },
        { name: "HIPTHRUST", series: 3, reps: 10, rest_time: 90 },
        { name: "PATADA DE GRUTEO", series: 3, reps: 10, rest_time: 90 },
        { name: "STEP UP", series: 3, reps: 8, rest_time: 90 },
        { name: "EXTENSIÓN DE CUÁDRICEPS", series: 3, reps: 12, rest_time: 90 },
      ],
    },
  ],
};

describe("parsePlanToMd", () => {
  it("returns the plan as plain text", () => {
    const result = parsePlanToMd(samplePlan);
    expect(typeof result).toBe("string");
  });

  it("starts with a markdown title showing week progress", () => {
    const result = parsePlanToMd(samplePlan);
    expect(result).toMatch(/^# /);
    expect(result).toContain("Week 3/6");
  });

  it("renders a bordered header for each day", () => {
    const result = parsePlanToMd(samplePlan);
    const BORDER = "═".repeat(10);

    expect(result).toContain(`${BORDER}\nLUNES — Dia 1  upper body —\n${BORDER}`);
    expect(result).toContain(`${BORDER}\nMARTES — Dia 2  leg day —\n${BORDER}`);
    expect(result).toContain(`${BORDER}\nMIÉRCOLES — Dia 3  upper body —\n${BORDER}`);
    expect(result).toContain(`${BORDER}\nJUEVES — Dia 4  leg day —\n${BORDER}`);
  });

  it("renders each exercise, with weight left empty when unknown", () => {
    const result = parsePlanToMd(samplePlan);

    expect(result).toContain("JALÓN AL PECHO— 4x12 — 30kg");
    expect(result).toContain("PRES BANCA PLANO— 4x8");
    expect(result).not.toContain("PRES BANCA PLANO— 4x8 —");
  });
});
