import { CheckIcon, XIcon } from "lucide-react";
import { Badge } from "@/shadcn/ui/badge";
import { Spinner } from "@/shadcn/ui/spinner";

interface ToolStatusProps {
  name: string;
  status: "running" | "complete" | "error";
}

const variantByStatus = {
  running: "secondary",
  complete: "outline",
  error: "destructive",
} as const;

export default function ToolStatus({ name, status }: ToolStatusProps) {
  return (
    <Badge variant={variantByStatus[status]} className="w-fit">
      {status === "running" && <Spinner data-icon="inline-start" />}
      {status === "complete" && <CheckIcon data-icon="inline-start" />}
      {status === "error" && <XIcon data-icon="inline-start" />}
      {name}
    </Badge>
  );
}
