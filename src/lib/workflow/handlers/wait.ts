import type { HandlerResult, WorkflowNode } from "../types";

/** WAIT parks the run. Engine sees status=WAITING and persists resumeAt. */
export async function handleWait(node: WorkflowNode): Promise<HandlerResult> {
  const data = node.data as {
    amount?: number;
    unit?: "minutes" | "hours" | "days";
  };
  const amount = Math.max(1, Number(data.amount ?? 1));
  const unit = data.unit ?? "minutes";
  const minutes =
    unit === "minutes" ? amount : unit === "hours" ? amount * 60 : amount * 60 * 24;
  const resumeAt = new Date(Date.now() + minutes * 60_000).toISOString();
  return {
    status: "WAITING",
    output: { amount, unit, resumeAt },
    resumeAt,
  };
}
