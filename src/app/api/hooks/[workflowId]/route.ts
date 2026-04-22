import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startRun } from "@/lib/workflow/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** External webhook trigger — any POST to /api/hooks/<workflowId> starts a run
 *  if the workflow's trigger.type === 'WEBHOOK_RECEIVED' and it's enabled. */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ workflowId: string }> },
) {
  const { workflowId } = await ctx.params;
  const wf = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!wf || !wf.enabled) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const trigger = wf.trigger as { type?: string };
  if (trigger?.type !== "WEBHOOK_RECEIVED") {
    return NextResponse.json({ error: "Workflow does not accept webhooks" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    /* empty body is fine */
  }

  try {
    const r = await startRun({ workflowId, triggerData: body });
    return NextResponse.json({ runId: r.runId, status: r.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to run" },
      { status: 500 },
    );
  }
}
