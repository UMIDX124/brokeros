import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Flat activity feed across all workflow runs owned by the user. Drives the
 *  "Recent Automations" card on the dashboard home. */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const steps = await prisma.workflowStep.findMany({
    where: { run: { workflow: { ownerId: session.user.id } } },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: {
      id: true,
      nodeType: true,
      label: true,
      status: true,
      startedAt: true,
      completedAt: true,
      output: true,
      run: {
        select: {
          id: true,
          workflowId: true,
          lead: { select: { id: true, businessName: true, ownerName: true } },
          workflow: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({
    activity: steps.map((s) => ({
      id: s.id,
      nodeType: s.nodeType,
      label: s.label,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      output: s.output,
      runId: s.run.id,
      workflowId: s.run.workflowId,
      workflowName: s.run.workflow.name,
      lead: s.run.lead,
    })),
  });
}
