import type { StrengthProgramStructure } from "../../types/types";

const WEEKDAYS = [
  "LUNES",
  "MARTES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SÁBADO",
  "DOMINGO",
];

const BORDER = "═".repeat(10);

export function parsePlanToMd(program: StrengthProgramStructure): string {
  const title = `# Week ${program.current_week}/${program.total_weeks}`;

  const days = program.program.map((day) => {
    const weekday = WEEKDAYS[(day.id - 1) % 7];
    const header = `${BORDER}\n${weekday} — Dia ${day.id}  ${day.type} —\n${BORDER}`;
    const exercises = day.routine.map((exercise) => {
      const weight = exercise.weight_kg != null ? ` — ${exercise.weight_kg}kg` : "";
      return `${exercise.name}— ${exercise.series}x${exercise.reps}${weight}`;
    });
    return [header, ...exercises].join("\n");
  });

  return [title, ...days].join("\n\n");
}
