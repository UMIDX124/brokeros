import { makeCall } from "@/lib/integrations/twilio";
import { generateVoice } from "@/lib/integrations/elevenlabs";
import { renderTemplate } from "../types";
import type { HandlerResult, RunContext, WorkflowNode } from "../types";

export async function handleMakeVoiceCall(
  node: WorkflowNode,
  ctx: RunContext,
): Promise<HandlerResult> {
  const data = node.data as {
    to?: string;
    message?: string;
    voiceId?: string;
    twimlUrl?: string;
  };
  const to = renderTemplate(data.to ?? "{{lead.phone}}", ctx);
  const message = renderTemplate(data.message ?? "", ctx);
  if (!to || (!message && !data.twimlUrl)) {
    return { status: "FAILED", error: "Call requires 'to' + ('message' or 'twimlUrl')" };
  }

  // Optional: pre-generate the voice audio — useful log even when simulated.
  const voice = message ? await generateVoice(message, data.voiceId) : null;

  const res = await makeCall(to, { message, twimlUrl: data.twimlUrl });
  if (!res.ok) {
    return { status: "FAILED", error: res.error };
  }
  return {
    status: "SUCCESS",
    output: {
      to,
      simulated: res.simulated,
      callSid: res.data.sid,
      voice: voice
        ? { simulated: voice.ok ? voice.simulated : true, audioUrlPreview: voice.ok ? voice.audioUrl.slice(0, 64) + "..." : null }
        : null,
    },
  };
}
