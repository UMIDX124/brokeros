import { sendSms } from "@/lib/integrations/twilio";
import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

export async function handleSendSms(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const data = node.data as { to?: string; body?: string };
  const to = renderTemplate(data.to ?? "{{lead.phone}}", ctx);
  const body = renderTemplate(data.body ?? "", ctx);
  if (!to || !body) {
    return { status: "FAILED", error: "SMS requires 'to' and 'body'" };
  }
  const res = await sendSms(to, body);
  if (!res.ok) {
    return { status: "FAILED", error: res.error, output: { simulated: res.simulated } };
  }
  return {
    status: "SUCCESS",
    output: { to, body, simulated: res.simulated, sid: res.data.sid },
  };
}
