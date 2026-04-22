import { RunStatus, StepStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HANDLERS } from "./handlers";
import type {
  HandlerResult,
  NodeType,
  RunContext,
  WorkflowEdge,
  WorkflowNode,
  WorkflowTrigger,
} from "./types";

const TRIGGER_NODE_TYPES: ReadonlySet<NodeType> = new Set([
  "TRIGGER_LEAD_CREATED",
  "TRIGGER_LEAD_SCORED",
  "TRIGGER_LEAD_STATUS_CHANGED",
  "TRIGGER_SCHEDULE_CRON",
  "TRIGGER_WEBHOOK_RECEIVED",
  "TRIGGER_MANUAL",
]);

const MAX_STEPS_PER_RUN = 64;

export type RunSummary = {
  runId: string;
  status: RunStatus;
  stepsExecuted: number;
};

export type StartRunInput = {
  workflowId: string;
  triggerData: Record<string, unknown>;
  leadId?: string;
};

/** Kicks off a new WorkflowRun and drives it until completion or WAIT. */
export async function startRun(input: StartRunInput): Promise<RunSummary> {
  const wf = await prisma.workflow.findUnique({ where: { id: input.workflowId } });
  if (!wf) throw new Error(`Workflow ${input.workflowId} not found`);
  if (!wf.enabled) throw new Error(`Workflow ${wf.id} is disabled`);

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: wf.id,
      triggerData: input.triggerData as Prisma.InputJsonValue,
      leadId: input.leadId ?? null,
      status: RunStatus.RUNNING,
    },
  });

  const nodes = (wf.nodes as unknown as WorkflowNode[]) ?? [];
  const edges = (wf.edges as unknown as WorkflowEdge[]) ?? [];
  const entry = findEntryNode(nodes);
  if (!entry) {
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: RunStatus.FAILED, completedAt: new Date() },
    });
    return { runId: run.id, status: RunStatus.FAILED, stepsExecuted: 0 };
  }

  return await drive(run.id, wf.ownerId, nodes, edges, entry.id, input.triggerData, input.leadId);
}

/** Picks the first outgoing edge from the trigger and walks the graph. */
async function drive(
  runId: string,
  ownerId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  startNodeId: string,
  triggerData: Record<string, unknown>,
  leadId: string | undefined,
): Promise<RunSummary> {
  // Hydrate lead into context if we have one — handlers read this.
  let lead: Record<string, unknown> | null = null;
  if (leadId) {
    const l = await prisma.lead.findUnique({ where: { id: leadId } });
    lead = l ? (l as unknown as Record<string, unknown>) : null;
  }

  const ctx: RunContext = {
    runId,
    workflowId: "",
    ownerId,
    triggerData,
    lead,
    stepOutputs: {},
  };

  // Start from the first successor of the trigger node (trigger itself is
  // a pass-through; don't record a step for it to keep the log tidy).
  let cursor: string | undefined = startNodeId;
  let stepsExecuted = 0;
  const visited = new Set<string>();

  while (cursor && stepsExecuted < MAX_STEPS_PER_RUN) {
    const node = nodes.find((n) => n.id === cursor);
    if (!node) break;

    if (TRIGGER_NODE_TYPES.has(node.type)) {
      cursor = nextNodeId(edges, node.id);
      continue;
    }

    if (visited.has(node.id)) {
      // Protect against accidental cycles in the graph.
      break;
    }
    visited.add(node.id);

    const step = await prisma.workflowStep.create({
      data: {
        runId,
        nodeId: node.id,
        nodeType: node.type,
        label: typeof node.data?.label === "string" ? (node.data.label as string) : null,
        input: (node.data ?? {}) as Prisma.InputJsonValue,
        status: StepStatus.RUNNING,
      },
    });

    let result: HandlerResult;
    try {
      const handler = HANDLERS[node.type];
      if (!handler) throw new Error(`No handler for ${node.type}`);
      result = await handler(node, ctx);
    } catch (err) {
      result = {
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const completedAt = new Date();

    if (result.status === "WAITING") {
      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: StepStatus.SUCCESS,
          output: (result.output ?? null) as Prisma.InputJsonValue,
          completedAt,
        },
      });
      const nextId = nextNodeId(edges, node.id);
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: RunStatus.WAITING,
          resumeAt: result.resumeAt ? new Date(result.resumeAt) : null,
          cursorNode: nextId ?? null,
        },
      });
      return { runId, status: RunStatus.WAITING, stepsExecuted: stepsExecuted + 1 };
    }

    await prisma.workflowStep.update({
      where: { id: step.id },
      data: {
        status: result.status === "SUCCESS" ? StepStatus.SUCCESS : result.status === "SKIPPED" ? StepStatus.SKIPPED : StepStatus.FAILED,
        output: (result.output ?? null) as Prisma.InputJsonValue,
        error: result.error ?? null,
        completedAt,
      },
    });

    ctx.stepOutputs[node.id] = result.output;
    stepsExecuted++;

    if (result.status === "FAILED") {
      await prisma.workflowRun.update({
        where: { id: runId },
        data: { status: RunStatus.FAILED, completedAt: new Date() },
      });
      return { runId, status: RunStatus.FAILED, stepsExecuted };
    }

    cursor = nextNodeId(edges, node.id, result.branch);
  }

  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status: RunStatus.SUCCESS, completedAt: new Date() },
  });
  return { runId, status: RunStatus.SUCCESS, stepsExecuted };
}

function findEntryNode(nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find((n) => TRIGGER_NODE_TYPES.has(n.type));
}

/** Returns the next node to execute. When `branch` is given (CONDITION true/false),
 *  prefers edges whose sourceHandle matches; otherwise returns the first successor. */
function nextNodeId(
  edges: WorkflowEdge[],
  from: string,
  branch?: string,
): string | undefined {
  const outgoing = edges.filter((e) => e.source === from);
  if (branch) {
    const match = outgoing.find((e) => e.sourceHandle === branch);
    if (match) return match.target;
  }
  return outgoing[0]?.target;
}

/** Resume a parked WAITING run. Invoked by the cron handler. */
export async function resumeRun(runId: string): Promise<RunSummary> {
  const run = await prisma.workflowRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error(`Run ${runId} missing`);
  if (run.status !== RunStatus.WAITING) {
    return { runId, status: run.status, stepsExecuted: 0 };
  }
  const wf = await prisma.workflow.findUnique({ where: { id: run.workflowId } });
  if (!wf) throw new Error(`Workflow ${run.workflowId} missing`);

  const nodes = (wf.nodes as unknown as WorkflowNode[]) ?? [];
  const edges = (wf.edges as unknown as WorkflowEdge[]) ?? [];
  if (!run.cursorNode) {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: RunStatus.SUCCESS, completedAt: new Date(), resumeAt: null, cursorNode: null },
    });
    return { runId, status: RunStatus.SUCCESS, stepsExecuted: 0 };
  }

  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status: RunStatus.RUNNING, resumeAt: null, cursorNode: null },
  });

  return await drive(
    run.id,
    wf.ownerId,
    nodes,
    edges,
    run.cursorNode,
    (run.triggerData ?? {}) as Record<string, unknown>,
    run.leadId ?? undefined,
  );
}

/** Trigger-side API. Called from /api/leads after scoring. */
export async function runWorkflowsForTrigger(
  triggerType: WorkflowTrigger["type"],
  payload: Record<string, unknown>,
): Promise<RunSummary[]> {
  const workflows = await prisma.workflow.findMany({
    where: { enabled: true },
    select: { id: true, trigger: true },
  });

  const matching = workflows.filter((w) => {
    const t = w.trigger as unknown as WorkflowTrigger;
    if (t?.type !== triggerType) return false;
    if (triggerType === "LEAD_SCORED") {
      const min = (t.config as { minScore?: number } | undefined)?.minScore;
      if (typeof min === "number" && typeof payload.score === "number" && (payload.score as number) < min) {
        return false;
      }
      const tier = (t.config as { tier?: string } | undefined)?.tier;
      if (tier && payload.tier !== tier) return false;
    }
    if (triggerType === "LEAD_STATUS_CHANGED") {
      const to = (t.config as { toStatus?: string } | undefined)?.toStatus;
      if (to && payload.status !== to) return false;
    }
    return true;
  });

  const results: RunSummary[] = [];
  for (const w of matching) {
    try {
      const r = await startRun({
        workflowId: w.id,
        triggerData: payload,
        leadId: typeof payload.leadId === "string" ? (payload.leadId as string) : undefined,
      });
      results.push(r);
    } catch (err) {
      console.warn(`[workflow] failed to start ${w.id}:`, err);
    }
  }
  return results;
}
