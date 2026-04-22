import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Plus, Zap, Activity, Power, ArrowRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Automations" };
export const dynamic = "force-dynamic";

type TriggerJson = { type?: string };

const TRIGGER_LABEL: Record<string, string> = {
  LEAD_CREATED: "Lead Created",
  LEAD_SCORED: "Lead Scored",
  LEAD_STATUS_CHANGED: "Status Changed",
  SCHEDULE_CRON: "Schedule",
  WEBHOOK_RECEIVED: "Webhook",
  MANUAL: "Manual",
};

export default async function AutomationsListPage() {
  const session = await auth();
  if (!session?.user) return null;

  const workflows = await prisma.workflow.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { runs: true } },
      runs: { orderBy: { startedAt: "desc" }, take: 1, select: { status: true, startedAt: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-8 py-8 md:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-stat">
            Automations
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">
            Workflows
          </h1>
          <p className="mt-2 text-muted-foreground">
            Build visual, no-code automations. Triggered by lead events, schedules, or webhooks.
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 h-10">
          <Link href="/dashboard/automations/new">
            <Plus className="h-4 w-4 mr-2" /> New workflow
          </Link>
        </Button>
      </div>

      {workflows.length === 0 ? <EmptyState /> : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background text-muted-foreground">
                <tr className="text-left">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Trigger</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Runs</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Last run</th>
                  <th className="px-6 py-3 w-10" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {workflows.map((w) => {
                  const t = w.trigger as TriggerJson;
                  const lastRun = w.runs[0];
                  return (
                    <tr key={w.id} className="border-t border-border hover:bg-background/60 transition">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/automations/${w.id}`} className="font-medium hover:text-accent">
                          {w.name}
                        </Link>
                        {w.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-sm">
                            {w.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {TRIGGER_LABEL[t?.type ?? ""] ?? t?.type ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium " +
                            (w.enabled
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground")
                          }
                        >
                          <Power className="h-3 w-3" />
                          {w.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-stat">{w._count.runs}</td>
                      <td className="px-6 py-4 hidden md:table-cell text-xs text-muted-foreground">
                        {lastRun
                          ? `${lastRun.status.toLowerCase()} · ${formatDistanceToNow(lastRun.startedAt, { addSuffix: true })}`
                          : "never"}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/automations/${w.id}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-border bg-background p-6">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Every action runs as a <strong className="text-foreground">WorkflowRun</strong> with a full
            step-by-step log. Waits resume via Vercel Cron every minute. Click any workflow to see its
            runs and live step execution.
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <Zap className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">No workflows yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        Start with a pre-built template like “Hot Lead Alert” or build your own from scratch.
        Every lead that hits /apply can kick off a series of emails, SMS, calls, and AI-written
        follow-ups.
      </p>
      <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 h-11">
        <Link href="/dashboard/automations/new">
          <Plus className="h-4 w-4 mr-2" /> New workflow
        </Link>
      </Button>
    </div>
  );
}
