import programData from "../../app/dashboard/program.json";
import { Badge } from "@/shadcn/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import type { ExcersiseDay, StrengthProgramStructure } from "../../types/types";

const program = programData as StrengthProgramStructure;

const dayTypeLabels: Record<string, string> = {
  "upper body": "Upper Body",
  "leg day": "Leg Day",
};

const weekDayLabels = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// 2 training days followed by 1 rest day, starting Monday. Only 4 training
// days available this week, so the pattern stops early and Sunday rests too.
const restDayPattern = [false, false, true, false, false, true, true];
const weekSchedule = weekDayLabels.map((label, i) => ({
  label,
  isRestDay: restDayPattern[i],
}));

function RestDayCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-muted-foreground">Rest Day</CardTitle>
      </CardHeader>
    </Card>
  );
}

function DayCard({ day }: { day: ExcersiseDay }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{dayTypeLabels[day.type] ?? day.type}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5">
          {day.routine.map((exercise) => (
            <li
              key={exercise.name}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="truncate">
                {exercise.name}
                {exercise.notes && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {exercise.notes}
                  </span>
                )}
              </span>
              <span className="shrink-0 whitespace-nowrap text-muted-foreground">
                {exercise.series}x{exercise.reps} · {exercise.rest_time}s
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Plan() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-medium">Hola Lucia!</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Plan actual</span>
          <Badge variant="secondary">
            Semana {program.current_week}/{program.total_weeks}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {program.program.map((day, i) => (
          <DayCard key={i} day={day} />
        ))}
      </div>

      <Tabs defaultValue="0">
        <TabsList>
          {weekSchedule.map((day, i) => (
            <TabsTrigger key={i} value={String(i)}>
              {day.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {(() => {
          let trainingIndex = 0;
          return weekSchedule.map((day, i) => {
            const content = day.isRestDay ? (
              <RestDayCard />
            ) : (
              <DayCard day={program.program[trainingIndex++]} />
            );
            return (
              <TabsContent key={i} value={String(i)}>
                {content}
              </TabsContent>
            );
          });
        })()}
      </Tabs>
    </div>
  );
}
