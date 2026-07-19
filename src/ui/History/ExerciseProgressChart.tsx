import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shadcn/ui/chart";
import type { ExerciseProgression } from "./buildExerciseProgression";

type Props = {
  series: ExerciseProgression;
};

export function ExerciseProgressChart({ series }: Props) {
  const unitLabel = series.unit === "kg" ? "kg" : "reps";
  const chartConfig = {
    value: {
      label: unitLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{series.name}</CardTitle>
        <CardDescription>
          {series.unit === "kg" ? "Weight" : "Reps"} over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
          <LineChart
            data={series.points}
            margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value: string) => {
                const d = new Date(`${value}T00:00:00`);
                return d.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(value: number) => `${value}`}
              label={{
                value: unitLabel,
                angle: -90,
                position: "insideLeft",
                offset: 8,
                style: { textAnchor: "middle", fontSize: 11 },
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => {
                    const d = new Date(`${String(value)}T00:00:00`);
                    return d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
