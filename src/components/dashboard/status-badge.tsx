import { cn } from "@/lib/utils";
import { STATUS_META, type LeadStatus } from "@/lib/demo/data";

const TONE_CLASSES: Record<
  (typeof STATUS_META)[LeadStatus]["tone"],
  string
> = {
  info: "bg-[color:var(--chart-4)]/20 text-[color:var(--brand-primary)]",
  slate: "bg-muted text-muted-foreground",
  amber: "bg-accent/15 text-accent",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success/15 text-success",
  danger: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function ScoreChip({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-success/15 text-success"
      : score >= 60
        ? "bg-accent/15 text-accent"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex min-w-10 justify-center items-center rounded-full px-2.5 py-0.5 text-xs font-stat font-semibold",
        tone,
      )}
    >
      {score}
    </span>
  );
}
