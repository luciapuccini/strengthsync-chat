import { useState, type Dispatch } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Button } from "@/shadcn/ui/button";
import { Spinner } from "@/shadcn/ui/spinner";
import { cn } from "@/shadcn/lib/utils";
import type {
  ExcersiseDay,
  StrengthProgramStructure,
  WeightExcersise,
} from "../../../types/types";
import { TEMPORAL_API_URL } from "@/api/temporalApi";
import { parsePlanToMd } from "@/utils/parsePlanToMd";
import {
  isExerciseComplete,
  performedCount,
  remainingSets,
  type TrackingAction,
} from "../tracking/trackingReducer";

const dayTypeLabels: Record<string, string> = {
  "upper body": "Tren superior",
  "leg day": "Pierna",
  swimming: "Natación",
  cardio: "Cardio",
  rest: "Descanso",
};

interface ProgramProps {
  week: StrengthProgramStructure;
  dispatch: Dispatch<TrackingAction>;
}

function copyPlan(week: StrengthProgramStructure) {
  const asMarkdown = parsePlanToMd(week);
  navigator.clipboard.writeText(asMarkdown).catch(console.error);
}

export function Program({ week, dispatch }: ProgramProps) {
  const { program: days } = week;
  return (
    <Card>
      <CardContent className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border/50 py-3">
          <span className="text-sm font-bold text-foreground/90">
            Semana actual
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/40 bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary"
            onClick={() => copyPlan(week)}
          >
            <Copy className="size-3.5" />
            Copiar semana
          </Button>
        </div>
        {days.map((day, i) => (
          <DayBlock
            key={day.id}
            day={day}
            isFirst={i === 0}
            dispatch={dispatch}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function DayBlock({
  day,
  isFirst,
  dispatch,
}: {
  day: ExcersiseDay;
  isFirst: boolean;
  dispatch: Dispatch<TrackingAction>;
}) {
  const isUpperBody = day.type === "upper body";
  const [isSaving, setIsSaving] = useState(false);

  async function saveDay() {
    setIsSaving(true);
    try {
      const dayToSave =
        day.routine.length === 0 ? { ...day, completed: true } : day;
      const response = await fetch(`${TEMPORAL_API_URL}/api/progress/day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: dayToSave.id, day: dayToSave }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }
      if (day.routine.length === 0 && !day.completed) {
        dispatch({ type: "MARK_DAY_COMPLETE", dayId: day.id });
      }
      toast.success(`Día ${day.id} guardado`);
    } catch (err) {
      toast.error("No se pudo guardar el día", {
        description:
          err instanceof Error
            ? `${err.message} — is the Temporal API running? (pnpm temporal:api)`
            : "Is the Temporal API running? (pnpm temporal:api)",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={cn("py-4", !isFirst && "border-t border-border/50")}>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-1 text-[10px] font-bold tracking-wide uppercase",
            isUpperBody
              ? "bg-primary/15 text-primary"
              : "bg-foreground/10 text-foreground/70",
          )}
        >
          {dayTypeLabels[day.type] ?? day.type}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">
          Día {day.id}
          {day.date ? ` · ${day.date}` : ""}
        </span>
        {day.completed && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
            Hecho
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={saveDay}
          disabled={isSaving}
        >
          {isSaving && <Spinner />}
          {isSaving ? "Guardando…" : "Guardar día"}
        </Button>
      </div>
      {day.notes && (
        <p className="mb-3 text-sm text-muted-foreground">{day.notes}</p>
      )}
      <div className="flex flex-col gap-3">
        {day.routine.map((exercise, i) => (
          <ExerciseRow
            key={exercise.name}
            index={i}
            dayId={day.id}
            exercise={exercise}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}

function ExerciseRow({
  index,
  dayId,
  exercise,
  dispatch,
}: {
  index: number;
  dayId: number;
  exercise: WeightExcersise;
  dispatch: Dispatch<TrackingAction>;
}) {
  const done = performedCount(exercise);
  const remaining = remainingSets(exercise);
  const complete = isExerciseComplete(exercise);
  const weightLabel =
    exercise.weight_kg != null ? `${exercise.weight_kg} kg` : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-1",
        complete && "text-muted-foreground",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 w-4 shrink-0 text-xs font-bold text-muted-foreground/70">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-base font-semibold md:text-lg",
              complete && "line-through",
            )}
          >
            {exercise.name}
            {exercise.notes && (
              <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wide text-primary uppercase no-underline">
                {exercise.notes}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-sm font-medium text-muted-foreground">
            {exercise.series}×{exercise.reps} · {exercise.rest_time}s
            {weightLabel ? ` · ${weightLabel}` : ""}
            {" · "}
            {remaining === 0
              ? "Completado"
              : `${remaining} restante${remaining === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>
      <div className="ml-6 flex flex-wrap gap-1.5">
        {Array.from({ length: exercise.series }, (_, setIndex) => {
          const isDone = setIndex < done;
          const isNext = setIndex === done;
          const isLastDone = setIndex === done - 1;
          const interactive = isNext || isLastDone;
          return (
            <Button
              key={setIndex}
              type="button"
              size="sm"
              variant={isDone ? "default" : "outline"}
              disabled={!interactive}
              className={cn(
                "h-8 min-w-8 px-2 text-sm font-bold",
                !interactive && "opacity-40",
              )}
              onClick={() =>
                dispatch({
                  type: "TOGGLE_SET",
                  dayId,
                  exerciseName: exercise.name,
                  setIndex,
                })
              }
            >
              {setIndex + 1}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
