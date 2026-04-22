import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RunStatusBadge } from "@/components/workflow/run-status-badge";
import { NODE_CATALOG } from "@/components/workflow/node-catalog";
import type { NodeType } from "@/lib/workflow/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; runId: string }>;

export default async function RunDetailPage({ params }: { params: Params }) {
  const { id, runId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/dashboard/automations/${id}/runs/${runId}`);

  const wf = await prisma.workflow.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wf) notFound();

  const run = await prisma.workflowRun.findFirst({
    where: { id: runId, workflowId: id },
    include: {
      lead: { select: { id: true, businessName: true, ownerName: true } },
      steps: { orderBy: { startedAt: "asc" } },
    },
  });
  if (!run) notFound();

  const totalMs = run.completedAt
    ? run.completedAt.getTime() - run.startedAt.getTime()
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-8 md:py-10 space-y-6">
      <Link
        href={`/dashboard/automations/${id}/runs`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> All runs
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-stat">
              Run
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">{wf.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground font-stat">
              Started {format(run.startedAt, "MMM d, yyyy 'at' p")}
              {totalMs != null ? ` · completed in ${(totalMs / 1000).toFixed(2)}s` : ""}
              {run.resumeAt ? ` · resumes ${format(run.resumeAt, "MMM d 'at' p")}` : ""}
            </p>
            {run.lead && (
              <p className="mt-1 text-sm">
                Lead:{" "}
                <Link href={`/dashboard/leads/${run.lead.id}`} className="text-accent hover:underline">
                  {run.lead.businessName}
                </Link>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <RunStatusBadge status={run.status} />
            <span className="text-xs text-muted-foreground font-stat">{run.steps.length} steps</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-background border border-border p-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-stat mb-1">
            Trigger payload
          </div>
          <pre className="text-xs font-stat overflow-x-auto">
            {JSON.stringify(run.triggerData, null, 2)}
          </pre>
        </div>
      </div>

      <ol className="space-y-3">
        {run.steps.map((s, i) => {
          const meta = NODE_CATALOG[s.nodeType as NodeType];
          const durMs =
            s.completedAt ? s.completedAt.getTime() - s.startedAt.getTime() : null;
          return (
            <li key={s.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground font-stat">
                    Step {i + 1} · {meta?.group ?? "?"}
                  </div>
                  <div className="mt-1 font-medium">
                    {s.label ?? meta?.label ?? s.nodeType}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground font-stat">
                    {s.nodeType} · {format(s.startedAt, "p")}{durMs != null ? ` · ${(durMs).toFixed(0)}ms` : ""}
                  </div>
                </div>
                <RunStatusBadge status={s.status} />
              </div>

              {s.error && (
                <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  {s.error}
                </div>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Input / Output
                </summary>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-stat mb-1">
                      Input
                    </div>
                    <pre className="text-[11px] font-stat overflow-x-auto">
                      {JSON.stringify(s.input, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-stat mb-1">
                      Output
                    </div>
                    <pre className="text-[11px] font-stat overflow-x-auto">
                      {s.output ? JSON.stringify(s.output, null, 2) : "—"}
                    </pre>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
