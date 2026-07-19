import { useEffect, useReducer } from "react";
import { getCurrentWeekProgress } from "../utils/getCurrentProgress";
import { PageHeading } from "./components/PageHeading";
import { Program } from "./components/Program";
import { trackingReducer } from "./tracking/trackingReducer";
import {
  loadTrackingDraft,
  saveTrackingDraft,
} from "./tracking/trackingStorage";

export default function Plan() {
  const [week, dispatch] = useReducer(trackingReducer, null, () => {
    const fileWeek = getCurrentWeekProgress();
    return loadTrackingDraft(fileWeek) ?? fileWeek;
  });

  useEffect(() => {
    saveTrackingDraft(week);
  }, [week]);

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
