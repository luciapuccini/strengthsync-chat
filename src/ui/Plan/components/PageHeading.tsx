import { Avatar, AvatarFallback } from "@/shadcn/ui/avatar";
import { CompleteWeekButton } from "./CompleteWeekButton";
import { GeneratePlanButton } from "./GeneratePlanButton";

interface PageHeadingProps {
  name?: string;
  currentWeek: number;
  totalWeeks: number;
  trainingDays: number;
  restDays: number;
}

export function PageHeading({
  name = "Lucia",
  currentWeek,
  totalWeeks,
  trainingDays,
  restDays,
}: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="border border-primary/40">
            <AvatarFallback className="bg-primary/15 text-base font-extrabold text-primary">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight md:text-2xl">
              Hola, {name}
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              Semana {currentWeek} de {totalWeeks} · Plan de fuerza
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GeneratePlanButton />
          <CompleteWeekButton />
        </div>
      </div>
      <div className="flex gap-2">
        <StatPill value={trainingDays} label="entrenos" />
        <StatPill value={restDays} label="descansos" />
      </div>
    </div>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
      <b className="font-extrabold text-foreground">{value}</b> {label}
    </div>
  );
}
