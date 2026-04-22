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

  const visited = new Set<string>();
  const counter = { steps: 0 };

  const outcome = await walk(
    runId,
    startNodeId,
    nodes,
    edges,
    ctx,
    visited,
    counter,
  );

  if (outcome === "WAITING") {
    return { runId, status: RunStatus.WAITING, stepsExecuted: counter.steps };
  }
  if (outcome === "FAILED") {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: RunStatus.FAILED, completedAt: new Date() },
    });
    return { runId, status: RunStatus.FAILED, stepsExecuted: counter.steps };
  }
  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status: RunStatus.SUCCESS, completedAt: new Date() },
  });
  return { runId, status: RunStatus.SUCCESS, stepsExecuted: counter.steps };
}

type WalkOutcome = "SUCCESS" | "FAILED" | "WAITING";

/** Depth-first walk of the graph. Executes each node, persists a step,
 *  and follows all outgoing edges (filtered by branch for CONDITION nodes).
 *  Returns WAITING as soon as any branch parks — the cron will resume it. */
async function walk(
  runId: string,
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  ctx: RunContext,
  visited: Set<string>,
  counter: { steps: number },
): Promise<WalkOutcome> {
  if (counter.steps >= MAX_STEPS_PER_RUN) return "SUCCESS";
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return "SUCCESS";

  // Triggers are pass-through — don't record a step.
  if (TRIGGER_NODE_TYPES.has(node.type)) {
    const outs = edges.filter((e) => e.source === node.id);
    for (const e of outs) {
      const out = await walk(runId, e.target, nodes, edges, ctx, visited, counter);
      if (out !== "SUCCESS") return out;
    }
    return "SUCCESS";
  }

  if (visited.has(node.id)) return "SUCCESS";
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
  counter.steps++;

  if (result.status === "WAITING") {
    await prisma.workflowStep.update({
      where: { id: step.id },
      data: {
        status: StepStatus.SUCCESS,
        output: (result.output ?? null) as Prisma.InputJsonValue,
        completedAt,
      },
    });
    // Park the whole run at the next node to execute (first downstream edge).
    const firstNext = edges.find((e) => e.source === node.id)?.target;
    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: RunStatus.WAITING,
        resumeAt: result.resumeAt ? new Date(result.resumeAt) : null,
        cursorNode: firstNext ?? null,
      },
    });
    return "WAITING";
  }

  await prisma.workflowStep.update({
    where: { id: step.id },
    data: {
      status:
        result.status === "SUCCESS"
          ? StepStatus.SUCCESS
          : result.status === "SKIPPED"
            ? StepStatus.SKIPPED
            : StepStatus.FAILED,
      output: (result.output ?? null) as Prisma.InputJsonValue,
      error: result.error ?? null,
      completedAt,
    },
  });

  ctx.stepOutputs[node.id] = result.output;

  if (result.status === "FAILED") return "FAILED";

  // Choose outgoing edges. For CONDITION, follow only the branch that matched.
  const outs = edges.filter((e) => e.source === node.id);
  const branched = result.branch
    ? outs.filter((e) => e.sourceHandle === result.branch)
    : outs;
  const toFollow = branched.length > 0 ? branched : outs;

  for (const e of toFollow) {
    const out = await walk(runId, e.target, nodes, edges, ctx, visited, counter);
    if (out !== "SUCCESS") return out;
  }
  return "SUCCESS";
}

function findEntryNode(nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find((n) => TRIGGER_NODE_TYPES.has(n.type));
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

  const cursor = run.cursorNode;
  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status: RunStatus.RUNNING, resumeAt: null, cursorNode: null },
  });

  let lead: Record<string, unknown> | null = null;
  if (run.leadId) {
    const l = await prisma.lead.findUnique({ where: { id: run.leadId } });
    lead = l ? (l as unknown as Record<string, unknown>) : null;
  }

  const ctx: RunContext = {
    runId: run.id,
    workflowId: wf.id,
    ownerId: wf.ownerId,
    triggerData: (run.triggerData ?? {}) as Record<string, unknown>,
    lead,
    stepOutputs: {},
  };

  const counter = { steps: 0 };
  const outcome = await walk(run.id, cursor, nodes, edges, ctx, new Set(), counter);
  if (outcome === "WAITING") return { runId, status: RunStatus.WAITING, stepsExecuted: counter.steps };
  if (outcome === "FAILED") {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: RunStatus.FAILED, completedAt: new Date() },
    });
    return { runId, status: RunStatus.FAILED, stepsExecuted: counter.steps };
  }
  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status: RunStatus.SUCCESS, completedAt: new Date() },
  });
  return { runId, status: RunStatus.SUCCESS, stepsExecuted: counter.steps };
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
