"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Zap, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RunStatusBadge } from "@/components/workflow/run-status-badge";
import type { StepStatus } from "@prisma/client";

type ActivityItem = {
  id: string;
  nodeType: string;
  label: string | null;
  status: StepStatus;
  startedAt: string;
  completedAt: string | null;
  output: unknown;
  runId: string;
  workflowId: string;
  workflowName: string;
  lead: { id: string; businessName: string; ownerName: string } | null;
};

const VERB: Record<string, string> = {
  SEND_EMAIL: "Sent email",
  SEND_SMS: "Sent SMS",
  MAKE_VOICE_CALL: "Placed voice call",
  GROQ_GENERATE: "Generated AI copy",
  UPDATE_LEAD: "Updated lead",
  CREATE_INTERACTION: "Logged interaction",
  HTTP_REQUEST: "Sent HTTP request",
  SLACK_NOTIFY: "Notified Slack",
  WAIT: "Scheduled wait",
  CONDITION: "Evaluated condition",
  SPLIT: "Split branches",
  MERGE: "Merged branches",
  LOOP: "Looped",
};

function friendly(item: ActivityItem): string {
  const verb = VERB[item.nodeType] ?? item.nodeType;
  const who = item.lead ? ` for ${item.lead.businessName}` : "";
  return `${verb}${who}`;
}

export function AutomationActivity() {
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/workflows/activity", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as { activity: ActivityItem[] };
        if (!cancelled) setItems(body.activity);
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    void load();
    const t = setInterval(load, 3_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> Recent automations
          </h2>
          <p className="text-sm text-muted-foreground">
            Live feed of every step your workflows just ran.
          </p>
        </div>
        <Link
          href="/dashboard/automations"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          Manage <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
          No automation runs yet. Enable a workflow and submit a lead to fill this feed.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((s) => (
            <li key={s.id} className="py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm">
                  <Link
                    href={`/dashboard/automations/${s.workflowId}/runs/${s.runId}`}
                    className="font-medium hover:text-accent"
                  >
                    {friendly(s)}
                  </Link>
                  <span className="text-muted-foreground"> · via {s.workflowName}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-stat">
                  {formatDistanceToNow(new Date(s.startedAt), { addSuffix: true })}
                </div>
              </div>
              <RunStatusBadge status={s.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
