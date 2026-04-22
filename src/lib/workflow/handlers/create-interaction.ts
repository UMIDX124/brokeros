import { InteractionType, InteractionDirection } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

const ALLOWED_TYPES = new Set<InteractionType>(
  Object.values(InteractionType),
);
const ALLOWED_DIRECTIONS = new Set<InteractionDirection>(
  Object.values(InteractionDirection),
);

export async function handleCreateInteraction(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const leadId =
    (ctx.triggerData["leadId"] as string | undefined) ??
    ((ctx.lead?.["id"] as string | undefined) ?? undefined);

  if (!leadId) return { status: "SKIPPED", output: { reason: "No lead in context" } };

  const data = node.data as {
    type?: string;
    direction?: string;
    subject?: string;
    content?: string;
    outcome?: string;
  };

  const typeCandidate = (data.type ?? "NOTE") as InteractionType;
  const dirCandidate = (data.direction ?? "INTERNAL") as InteractionDirection;

  const type = ALLOWED_TYPES.has(typeCandidate) ? typeCandidate : InteractionType.NOTE;
  const direction = ALLOWED_DIRECTIONS.has(dirCandidate) ? dirCandidate : InteractionDirection.INTERNAL;

  const created = await prisma.interaction.create({
    data: {
      leadId,
      type,
      direction,
      subject: data.subject ? renderTemplate(data.subject, ctx) : null,
      content: renderTemplate(data.content ?? "Workflow-logged interaction.", ctx),
      outcome: data.outcome ? renderTemplate(data.outcome, ctx) : null,
      metadata: { via: "workflow", runId: ctx.runId },
    },
  });
  return { status: "SUCCESS", output: { interactionId: created.id } };
}
