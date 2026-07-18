import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shadcn/ui/button";
import { Spinner } from "@/shadcn/ui/spinner";

const TEMPORAL_API_URL =
  import.meta.env.VITE_TEMPORAL_API_URL ?? "http://localhost:3001";

export function TestWorkflowButton() {
  const [isRunning, setIsRunning] = useState(false);

  async function runSampleWorkflow() {
    setIsRunning(true);
    try {
      const response = await fetch(
        `${TEMPORAL_API_URL}/api/workflows/sample`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "StrengthSync" }),
        },
      );
      const data = (await response.json()) as {
        workflowId?: string;
        result?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }
      toast.success("Sample workflow completed", {
        description: `${data.workflowId}\n${data.result}`,
      });
    } catch (err) {
      toast.error("Sample workflow failed", {
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
    <Button
      variant="outline"
      size="sm"
      onClick={runSampleWorkflow}
      disabled={isRunning}
    >
      {isRunning && <Spinner />}
      {isRunning ? "Running…" : "Run sample workflow"}
    </Button>
  );
}
