import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  deltaTone = "success",
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "success" | "muted" | "danger";
  icon?: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div
        className={cn(
          "mt-4 text-3xl md:text-4xl font-semibold font-stat tracking-tight",
          accent ? "text-accent" : "text-foreground",
        )}
      >
        {value}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-2 text-xs font-stat",
            deltaTone === "success" && "text-success",
            deltaTone === "muted" && "text-muted-foreground",
            deltaTone === "danger" && "text-destructive",
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
