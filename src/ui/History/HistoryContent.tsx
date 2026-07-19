import { use } from "react";
import { Spinner } from "@/shadcn/ui/spinner";
import { buildExerciseProgression } from "./buildExerciseProgression";
import { ExerciseProgressChart } from "./ExerciseProgressChart";
import { getHistoryWeeksPromise } from "./historyWeeksCache";

export function HistoryFallback() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      Loading history…
    </div>
  );
}

function HistoryEmpty() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
      No finished weeks with enough completed sessions to chart yet.
    </div>
  );
}

export function HistoryContent() {
  const { weeks } = use(getHistoryWeeksPromise());
  const series = buildExerciseProgression(weeks);

  if (series.length === 0) {
    return <HistoryEmpty />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {series.map((item) => (
        <ExerciseProgressChart key={item.name} series={item} />
      ))}
    </div>
  );
}
