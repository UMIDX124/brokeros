import { evalCondition, renderTemplate, type ConditionOp } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

export async function handleCondition(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const data = node.data as {
    left?: string;
    op?: ConditionOp;
    right?: string;
  };
  const leftRendered = renderTemplate(data.left ?? "", ctx);
  const rightRendered = renderTemplate(data.right ?? "", ctx);

  // Auto-cast numeric strings so gt/lt behave intuitively
  const toNumberish = (s: string): string | number => {
    if (s === "" || isNaN(Number(s))) return s;
    return Number(s);
  };

  const result = evalCondition(
    toNumberish(leftRendered),
    data.op ?? "eq",
    toNumberish(rightRendered),
  );
  return {
    status: "SUCCESS",
    branch: result ? "true" : "false",
    output: { left: leftRendered, op: data.op, right: rightRendered, result },
  };
}
