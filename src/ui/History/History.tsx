import { Suspense, useState } from "react";
import { HistoryContent, HistoryFallback } from "./HistoryContent";
import { HistoryErrorBoundary } from "./HistoryErrorBoundary";
import { resetHistoryWeeksPromise } from "./historyWeeksCache";

export default function History() {
  const [retryKey, setRetryKey] = useState(0);

  function handleRetry() {
    resetHistoryWeeksPromise();
    setRetryKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-extrabold tracking-tight md:text-2xl">
          History
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          Weight and reps progression across finished weeks
        </p>
      </div>
      <HistoryErrorBoundary onRetry={handleRetry}>
        <Suspense fallback={<HistoryFallback />} key={retryKey}>
          <HistoryContent />
        </Suspense>
      </HistoryErrorBoundary>
    </div>
  );
}
