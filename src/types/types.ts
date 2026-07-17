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
  id: number;
  routine: WeightExcersise[];
  type: "leg day" | "upper body" | "rest";
  date?: string;
  completed?: boolean;
};

type WeightExcersise = {
  name: string;
  series: number;
  reps: number;
  rest_time: number;
  notes?: string;
  weight_kg?: number;
  performed_reps?: number[];
};

export type { Weight, StrengthProgramStructure, WeightExcersise, ExcersiseDay };
