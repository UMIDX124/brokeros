import { hasRealKey } from "@/lib/env";
import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

export async function handleSlackNotify(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const data = node.data as { webhookUrl?: string; text?: string };
  const url = data.webhookUrl ?? process.env.SLACK_WEBHOOK_URL ?? "";
  const text = renderTemplate(data.text ?? "", ctx);

  if (!text) return { status: "FAILED", error: "Slack requires 'text'" };

  if (!hasRealKey(url)) {
    console.info("[workflow.slack] simulating", { text: text.slice(0, 200) });
    return { status: "SUCCESS", output: { simulated: true, text } };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { status: "FAILED", error: `slack ${res.status}: ${body.slice(0, 200)}` };
    }
    return { status: "SUCCESS", output: { simulated: false, text } };
  } catch (err) {
    return {
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
