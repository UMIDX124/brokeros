import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { RunStatusBadge } from "@/components/workflow/run-status-badge";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const w = await prisma.workflow.findUnique({ where: { id }, select: { name: true } });
  return { title: w ? `Runs · ${w.name}` : "Workflow runs" };
}

export default async function RunsListPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/dashboard/automations/${id}/runs`);

  const wf = await prisma.workflow.findFirst({
    where: { id, ownerId: session.user.id },
    include: { _count: { select: { runs: true } } },
  });
  if (!wf) notFound();

  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: wf.id },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: {
      lead: { select: { id: true, businessName: true, ownerName: true } },
      _count: { select: { steps: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-8 md:py-10 space-y-6">
      <Link
        href={`/dashboard/automations/${wf.id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to builder
      </Link>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-stat">
            Run history
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">{wf.name}</h1>
          <p className="mt-2 text-muted-foreground">{wf._count.runs} total runs.</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/automations/${wf.id}`}>Open builder</Link>
        </Button>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No runs yet. Submit a lead matching the trigger, or click Test Run in the builder.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background text-muted-foreground">
                <tr className="text-left">
                  <th className="px-6 py-3 font-medium">Started</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Steps</th>
                  <th className="px-6 py-3 font-medium">Lead</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Duration</th>
                  <th className="px-6 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const durMs = r.completedAt
                    ? r.completedAt.getTime() - r.startedAt.getTime()
                    : null;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border hover:bg-background/60 transition"
                    >
                      <td className="px-6 py-4 text-xs text-muted-foreground font-stat">
                        {formatDistanceToNow(r.startedAt, { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4"><RunStatusBadge status={r.status} /></td>
                      <td className="px-6 py-4 font-stat">{r._count.steps}</td>
                      <td className="px-6 py-4 text-sm">
                        {r.lead ? (
                          <Link
                            href={`/dashboard/leads/${r.lead.id}`}
                            className="hover:text-accent"
                          >
                            {r.lead.businessName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell font-stat text-xs text-muted-foreground">
                        {durMs != null ? `${(durMs / 1000).toFixed(2)}s` : r.resumeAt ? `waiting → ${r.resumeAt.toISOString().slice(0, 16)}` : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/automations/${wf.id}/runs/${r.id}`}
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
    </div>
  );
}
