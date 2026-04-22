import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

/** LOOP iterates over an array (resolved from `items` template path) and stores
 *  the length + first item in output. The engine executes the outgoing edge once
 *  per item, injecting `item` into context.stepOutputs[<loopId>.item]. */
export async function handleLoop(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const data = node.data as { itemsPath?: string };
  const raw = renderTemplate(data.itemsPath ?? "", ctx);
  let arr: unknown[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) arr = parsed;
  } catch {
    arr = raw ? [raw] : [];
  }
  return {
    status: "SUCCESS",
    output: { count: arr.length, sample: arr.slice(0, 3) },
  };
}
