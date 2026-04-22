import { LeadStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

export async function handleUpdateLead(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const leadId =
    (ctx.triggerData["leadId"] as string | undefined) ??
    ((ctx.lead?.["id"] as string | undefined) ?? undefined);

  if (!leadId) return { status: "SKIPPED", output: { reason: "No lead in context" } };

  const data = node.data as {
    status?: string;
    notes?: string;
    score?: number;
  };
  const updates: Prisma.LeadUpdateInput = {};
  if (data.status && data.status in LeadStatus) {
    updates.status = data.status as LeadStatus;
  }
  if (typeof data.score === "number") {
    updates.score = Math.max(0, Math.min(100, Math.round(data.score)));
  }
  if (data.notes) {
    updates.notes = renderTemplate(data.notes, ctx);
  }
  if (Object.keys(updates).length === 0) {
    return { status: "SKIPPED", output: { reason: "No updates supplied" } };
  }
  const updated = await prisma.lead.update({ where: { id: leadId }, data: updates });
  return {
    status: "SUCCESS",
    output: { leadId, status: updated.status, score: updated.score },
  };
}
