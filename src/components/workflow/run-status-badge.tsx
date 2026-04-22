import type { RunStatus, StepStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  RUNNING: "bg-accent/15 text-accent",
  WAITING: "bg-[color:var(--chart-4)]/25 text-[color:var(--brand-primary)]",
  SUCCESS: "bg-success/15 text-success",
  FAILED: "bg-destructive/10 text-destructive",
  PENDING: "bg-muted text-muted-foreground",
  SKIPPED: "bg-muted text-muted-foreground",
};

export function RunStatusBadge({ status, className }: { status: RunStatus | StepStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
