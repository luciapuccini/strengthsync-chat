import { Copy } from "lucide-react";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/lib/utils";
import type { ExcersiseDay } from "../../../types/types";

const dayTypeLabels: Record<string, string> = {
  "upper body": "Tren superior",
  "leg day": "Pierna",
};

interface ProgramProps {
  days: ExcersiseDay[];
}

function copyPlan() {}

export function Program({ days }: ProgramProps) {
  return (
    <Card>
      <CardContent className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border/50 py-3">
          <span className="text-sm font-bold text-foreground/90">
            Plan completo
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/40 bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary"
            onClick={copyPlan}
          >
            <Copy className="size-3.5" />
            Copiar semana
          </Button>
        </div>
        {days.map((day, i) => (
          <DayBlock key={day.id} day={day} isFirst={i === 0} />
        ))}
      </CardContent>
    </Card>
  );
}

function DayBlock({ day, isFirst }: { day: ExcersiseDay; isFirst: boolean }) {
  const isUpperBody = day.type === "upper body";
  return (
    <div className={cn("py-4", !isFirst && "border-t border-border/50")}>
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-1 text-[10px] font-bold tracking-wide uppercase",
            isUpperBody
              ? "bg-primary/15 text-primary"
              : "bg-foreground/10 text-foreground/70"
          )}
        >
          {dayTypeLabels[day.type] ?? day.type}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          Día {day.id}
        </span>
      </div>
      <div className="flex flex-col">
        {day.routine.map((exercise, i) => (
          <div key={exercise.name} className="flex items-center gap-2 py-1.5">
            <span className="w-3.5 shrink-0 text-[10px] font-bold text-muted-foreground/70">
              {i + 1}
            </span>
            <span className="flex-1 truncate text-sm font-medium">
              {exercise.name}
              {exercise.notes && (
                <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wide text-primary uppercase">
                  {exercise.notes}
                </span>
              )}
            </span>
            <span className="shrink-0 text-right text-xs font-semibold whitespace-nowrap text-muted-foreground">
              {exercise.series}×{exercise.reps} · {exercise.rest_time}s
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
