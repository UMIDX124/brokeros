import { format } from "date-fns";
import { type DemoInteraction } from "@/lib/demo/data";

export function LeadTimeline({ interactions }: { interactions: DemoInteraction[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
      <h2 className="text-lg font-semibold">Timeline</h2>
      <p className="text-sm text-muted-foreground">
        A compact history of everything that happened on this lead.
      </p>
      <ol className="relative mt-8 border-l border-border pl-6 space-y-6">
        {interactions.map((i) => (
          <li key={i.id} className="relative">
            <span className="absolute -left-[30px] top-1 grid h-3 w-3 place-items-center rounded-full bg-accent ring-4 ring-surface" />
            <div className="text-xs text-muted-foreground font-stat">
              {format(new Date(i.createdAt), "MMM d, yyyy · p")}
            </div>
            <div className="mt-1 font-medium">
              {i.subject ?? labelForType(i.type)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {i.content}
            </p>
            <div className="mt-1 text-xs text-muted-foreground">by {i.actor}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function labelForType(t: DemoInteraction["type"]) {
  switch (t) {
    case "EMAIL":
      return "Email";
    case "SMS":
      return "SMS";
    case "CALL":
      return "Call";
    case "NOTE":
      return "Internal note";
    case "STATUS_CHANGE":
      return "Status change";
    case "AI_ACTION":
      return "AI action";
  }
}
