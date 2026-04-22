import type { HandlerResult, NodeType, RunContext, WorkflowNode } from "../types";

import { handleSendEmail } from "./send-email";
import { handleSendSms } from "./send-sms";
import { handleMakeVoiceCall } from "./make-voice-call";
import { handleGroqGenerate } from "./groq-generate";
import { handleUpdateLead } from "./update-lead";
import { handleCreateInteraction } from "./create-interaction";
import { handleHttpRequest } from "./http-request";
import { handleSlackNotify } from "./slack-notify";
import { handleWait } from "./wait";
import { handleCondition } from "./condition";
import { handleSplit, handleMerge } from "./split-merge";
import { handleLoop } from "./loop";

export type NodeHandler = (
  node: WorkflowNode,
  ctx: RunContext,
) => Promise<HandlerResult>;

/** Triggers are not "executed" — the engine starts from the node whose type is a trigger
 *  and immediately follows its outgoing edges. The trigger handler just passes through. */
async function handlePassThrough(): Promise<HandlerResult> {
  return { status: "SUCCESS", output: { triggered: true } };
}

export const HANDLERS: Record<NodeType, NodeHandler> = {
  TRIGGER_LEAD_CREATED: handlePassThrough,
  TRIGGER_LEAD_SCORED: handlePassThrough,
  TRIGGER_LEAD_STATUS_CHANGED: handlePassThrough,
  TRIGGER_SCHEDULE_CRON: handlePassThrough,
  TRIGGER_WEBHOOK_RECEIVED: handlePassThrough,
  TRIGGER_MANUAL: handlePassThrough,

  SEND_EMAIL: handleSendEmail,
  SEND_SMS: handleSendSms,
  MAKE_VOICE_CALL: handleMakeVoiceCall,
  GROQ_GENERATE: handleGroqGenerate,
  UPDATE_LEAD: handleUpdateLead,
  CREATE_INTERACTION: handleCreateInteraction,
  HTTP_REQUEST: handleHttpRequest,
  SLACK_NOTIFY: handleSlackNotify,

  WAIT: handleWait,
  CONDITION: handleCondition,
  SPLIT: handleSplit,
  MERGE: handleMerge,
  LOOP: handleLoop,
};
