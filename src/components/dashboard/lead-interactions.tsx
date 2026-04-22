import {
  Mail,
  Phone,
  MessageSquare,
  StickyNote,
  RefreshCcw,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import { type DemoInteraction } from "@/lib/demo/data";
import { cn } from "@/lib/utils";

const ICONS: Record<DemoInteraction["type"], React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail,
  SMS: MessageSquare,
  CALL: Phone,
  NOTE: StickyNote,
  STATUS_CHANGE: RefreshCcw,
  AI_ACTION: Sparkles,
};

export function LeadInteractions({ interactions }: { interactions: DemoInteraction[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold">Interactions</h2>
        <p className="text-sm text-muted-foreground">
          Every email, call, note, and AI action — chronological.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {interactions.map((i) => {
          const Icon = ICONS[i.type];
          const isInbound = i.direction === "INBOUND";
          const isAi = i.type === "AI_ACTION";
          return (
            <li key={i.id} className="px-6 py-5 flex gap-4">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                  isAi
                    ? "bg-accent/15 text-accent"
                    : isInbound
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-medium">{i.actor}</span>
                  {i.direction !== "INTERNAL" && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                        isInbound
                          ? "bg-success/10 text-success"
                          : "bg-accent/10 text-accent",
                      )}
                    >
                      {isInbound ? (
                        <ArrowDownLeft className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                      {isInbound ? "Inbound" : "Outbound"}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground font-stat ml-auto">
                    {format(new Date(i.createdAt), "MMM d, p")}
                  </span>
                </div>
                {i.subject && <div className="mt-1 font-medium">{i.subject}</div>}
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {i.content}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
