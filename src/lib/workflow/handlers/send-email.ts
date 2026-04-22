import { Resend } from "resend";
import { hasRealKey } from "@/lib/env";
import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

export async function handleSendEmail(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const data = node.data as {
    to?: string;
    subject?: string;
    body?: string;
  };

  const toRaw = data.to && data.to.trim().length > 0 ? data.to : "{{lead.email}}";
  const to = renderTemplate(toRaw, ctx);
  const subject = renderTemplate(data.subject ?? "", ctx);
  const body = renderTemplate(data.body ?? "", ctx);

  if (!to) {
    return { status: "FAILED", error: "No recipient (to is empty after template render)" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const override = process.env.RESEND_TO_OVERRIDE;
  const toUsed = override?.trim() || to;

  if (!hasRealKey(apiKey)) {
    console.info("[workflow.send-email] simulating", { to: toUsed, subject });
    return {
      status: "SUCCESS",
      output: { sent: false, simulated: true, to: toUsed, subject },
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data: resp, error } = await resend.emails.send({
      from: `BrokerOS <${from}>`,
      to: [toUsed],
      replyTo: from,
      subject: subject || "(no subject)",
      text: body || "(empty)",
    });
    if (error) {
      return {
        status: "SUCCESS",
        output: { sent: false, simulated: true, to: toUsed, subject, error: error.message },
      };
    }
    return {
      status: "SUCCESS",
      output: { sent: true, simulated: false, to: toUsed, subject, providerId: resp?.id },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: "SUCCESS",
      output: { sent: false, simulated: true, to: toUsed, subject, error: message },
    };
  }
}
