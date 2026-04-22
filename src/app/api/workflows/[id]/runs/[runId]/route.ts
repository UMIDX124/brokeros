import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string; runId: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, runId } = await ctx.params;

  const wf = await prisma.workflow.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const run = await prisma.workflowRun.findFirst({
    where: { id: runId, workflowId: id },
    include: {
      lead: { select: { id: true, businessName: true, ownerName: true } },
      steps: { orderBy: { startedAt: "asc" } },
    },
  });
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  return NextResponse.json({ run });
}
