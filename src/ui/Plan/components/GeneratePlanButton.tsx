import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shadcn/ui/button";
import { Spinner } from "@/shadcn/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Textarea } from "@/shadcn/ui/textarea";
import MarkdownRenderer from "@/ChatPanel/chat/MarkdownRenderer";

const TEMPORAL_API_URL =
  import.meta.env.VITE_TEMPORAL_API_URL ?? "http://localhost:3001";

interface PlanGenerationResponse {
  workflowId?: string;
  programFileName?: string;
  rationale?: string;
  error?: string;
}

export function GeneratePlanButton() {
  const [open, setOpen] = useState(false);
  const [quizNotes, setQuizNotes] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [rationale, setRationale] = useState<string | null>(null);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setQuizNotes("");
      setRationale(null);
    }
  }

  async function generatePlan() {
    setIsRunning(true);
    try {
      const response = await fetch(
        `${TEMPORAL_API_URL}/api/workflows/plan-generation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizNotes }),
        },
      );
      const data = (await response.json()) as PlanGenerationResponse;
      if (!response.ok) {
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }
      setRationale(data.rationale ?? null);
    } catch (err) {
      toast.error("No se pudo generar el plan", {
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Generar plan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar nuevo plan</DialogTitle>
          <DialogDescription>
            {rationale
              ? "Tu nuevo bloque ya está activo. Cambios clave:"
              : "Opcional: contanos preferencias, molestias o cambios de actividad para este bloque."}
          </DialogDescription>
        </DialogHeader>
        {rationale ? (
          <div className="max-h-72 overflow-y-auto">
            <MarkdownRenderer content={rationale} />
          </div>
        ) : (
          <Textarea
            placeholder="Ej.: me molesta el hombro en press banca, quiero mantener natación 2x/semana…"
            value={quizNotes}
            onChange={(e) => setQuizNotes(e.target.value)}
            disabled={isRunning}
          />
        )}
        <DialogFooter>
          {rationale ? (
            <Button size="sm" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
          ) : (
            <Button size="sm" onClick={generatePlan} disabled={isRunning}>
              {isRunning && <Spinner />}
              {isRunning ? "Generando…" : "Generar plan"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
