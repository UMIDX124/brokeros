import type { HandlerResult } from "../types";

/** SPLIT is a no-op at execution time — the engine follows all outgoing edges
 *  concurrently. Present as a node type so the canvas can render a fan-out. */
export async function handleSplit(): Promise<HandlerResult> {
  return { status: "SUCCESS", output: { split: true } };
}

/** MERGE likewise passes through; it exists so users can visually gather
 *  branches back before continuing. In this MVP we don't synchronize — if
 *  you need true merging, use CONDITION downstream. */
export async function handleMerge(): Promise<HandlerResult> {
  return { status: "SUCCESS", output: { merged: true } };
}
