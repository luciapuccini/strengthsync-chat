type Weight = {
  baseline: number;
  current_weight_kg: number;
  updated_at: Date;
};

type StrengthProgramStructure = {
  current_week: number;
  total_weeks: number;
  training_days_per_week: number;
  rest_days_per_week: number;
  program: ExcersiseDay[];
};

// bloque de ejercicios - 1 dia/ rutina
type ExcersiseDay = {
  routine: WeightExcersise[];
  type: "leg day" | "upper body";
};

type WeightExcersise = {
  name: string;
  series: number;
  reps: number;
  rest_time: number;
  notes?: string;
};

export type { Weight, StrengthProgramStructure, WeightExcersise, ExcersiseDay };
