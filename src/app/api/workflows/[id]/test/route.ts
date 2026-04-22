import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startRun } from "@/lib/workflow/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Kick a manual test run. Body: { leadId?, triggerData? } */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const wf = await prisma.workflow.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!wf.enabled) {
    // Allow test on disabled workflows anyway — they're being edited
    await prisma.workflow.update({ where: { id }, data: { enabled: true } });
  }

  const body = (await request.json().catch(() => ({}))) as {
    leadId?: string;
    triggerData?: Record<string, unknown>;
  };

  let leadId = body.leadId;
  if (!leadId) {
    // Pick the most recent lead as a sensible default for test runs.
    const recent = await prisma.lead.findFirst({ orderBy: { createdAt: "desc" } });
    leadId = recent?.id;
  }

  const lead = leadId ? await prisma.lead.findUnique({ where: { id: leadId } }) : null;

  const result = await startRun({
    workflowId: id,
    triggerData: {
      ...(body.triggerData ?? {}),
      leadId,
      score: lead?.score ?? null,
      tier: undefined,
      status: lead?.status,
      source: "manual-test",
    },
    leadId: leadId ?? undefined,
  });

  return NextResponse.json(result, { status: 201 });
}
