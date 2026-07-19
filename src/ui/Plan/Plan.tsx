import { getCurrentProgram } from "../utils/getCurrentProgram";
import { PageHeading } from "./components/PageHeading";
import { Program } from "./components/Program";

const program = getCurrentProgram();

export default function Plan() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeading
        currentWeek={program.current_week}
        totalWeeks={program.total_weeks}
        trainingDays={program.training_days_per_week}
        restDays={program.rest_days_per_week}
      />
      <Program program={program} />
    </div>
  );
}
