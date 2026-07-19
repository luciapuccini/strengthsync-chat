import { useReducer } from "react";
import { getCurrentWeekProgress } from "../utils/getCurrentProgress";
import { PageHeading } from "./components/PageHeading";
import { Program } from "./components/Program";
import { trackingReducer } from "./tracking/trackingReducer";

const initialWeek = getCurrentWeekProgress();

export default function Plan() {
  const [week, dispatch] = useReducer(trackingReducer, initialWeek);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeading
        currentWeek={week.current_week}
        totalWeeks={week.total_weeks}
        trainingDays={week.training_days_per_week}
        restDays={week.rest_days_per_week}
      />
      <Program week={week} dispatch={dispatch} />
    </div>
  );
}
