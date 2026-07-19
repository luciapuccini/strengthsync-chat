import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shadcn/ui/button";
import { Spinner } from "@/shadcn/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shadcn/ui/sheet";
import { TEMPORAL_API_URL } from "@/api/temporalApi";
import MarkdownRenderer from "@/ChatPanel/chat/MarkdownRenderer";

interface WeeklyProgressResponse {
  workflowId?: string;
  fileName?: string;
  week?: number;
  planComplete?: boolean;
  analysis?: string;
  error?: string;
}

export function CompleteWeekButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<WeeklyProgressResponse | null>(null);

  async function completeWeek() {
    setIsRunning(true);
    try {
      const response = await fetch(
        `${TEMPORAL_API_URL}/api/workflows/weekly-progress`,
        { method: "POST" },
      );
      const data = (await response.json()) as WeeklyProgressResponse;
      if (!response.ok) {
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }
      setResult(data);
    } catch (err) {
      toast.error("No se pudo completar la semana", {
        description:
          err instanceof Error
            ? `${err.message} — is the Temporal API running? (pnpm temporal:api)`
            : "Is the Temporal API running? (pnpm temporal:api)",
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={completeWeek} disabled={isRunning}>
        {isRunning && <Spinner />}
        {isRunning ? "Analizando…" : "Completar semana"}
      </Button>
      <Sheet
        open={result !== null}
        onOpenChange={(open) => {
          if (!open) setResult(null);
        }}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Semana {result?.week} — análisis</SheetTitle>
            <SheetDescription>
              {result?.planComplete
                ? "Plan completo — no quedan más semanas. Próximo paso: generar un nuevo plan."
                : `Semana archivada como ${result?.fileName}`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {result?.analysis && <MarkdownRenderer content={result.analysis} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
