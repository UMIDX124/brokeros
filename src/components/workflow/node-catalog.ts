import type { NodeType } from "@/lib/workflow/types";
import {
  Zap,
  Sparkles,
  UserPlus,
  RefreshCcw,
  Calendar,
  Webhook,
  Play,
  Mail,
  MessageSquare,
  Phone,
  Brain,
  UserCog,
  StickyNote,
  Send,
  Hash as Slack,
  Clock,
  GitBranch,
  Split,
  Merge,
  Repeat,
  type LucideIcon,
} from "lucide-react";

export type FieldSchema =
  | { key: string; label: string; type: "text"; placeholder?: string; default?: string; help?: string; multiline?: boolean }
  | { key: string; label: string; type: "number"; default?: number; min?: number; max?: number; help?: string }
  | { key: string; label: string; type: "select"; options: readonly string[]; default?: string; help?: string }
  | { key: string; label: string; type: "textarea"; placeholder?: string; default?: string; help?: string }
  | { key: string; label: string; type: "boolean"; default?: boolean; help?: string };

export type NodeGroup = "Trigger" | "Action" | "Flow control";

export type NodeMeta = {
  type: NodeType;
  label: string;
  description: string;
  group: NodeGroup;
  icon: LucideIcon;
  accent: string; // tailwind bg-*/10
  fields: readonly FieldSchema[];
  /** CONDITION emits 'true' + 'false' sourceHandles; others omit. */
  handles?: { kind: "single" | "condition" };
};

export const NODE_CATALOG: Readonly<Record<NodeType, NodeMeta>> = {
  // ─── Triggers ─────────────────────────────────────────────
  TRIGGER_LEAD_CREATED: {
    type: "TRIGGER_LEAD_CREATED",
    label: "Lead Created",
    description: "Fires when a new lead submits the apply form.",
    group: "Trigger",
    icon: UserPlus,
    accent: "bg-accent/10 text-accent",
    fields: [],
  },
  TRIGGER_LEAD_SCORED: {
    type: "TRIGGER_LEAD_SCORED",
    label: "Lead Scored",
    description: "Fires after AI scoring completes.",
    group: "Trigger",
    icon: Sparkles,
    accent: "bg-accent/10 text-accent",
    fields: [
      { key: "minScore", label: "Min score (optional)", type: "number", min: 0, max: 100, help: "Only fire when score ≥ this value." },
      { key: "tier", label: "Tier filter", type: "select", options: ["", "HOT", "WARM", "COOL", "COLD"] as const, help: "Only fire when tier matches." },
    ],
  },
  TRIGGER_LEAD_STATUS_CHANGED: {
    type: "TRIGGER_LEAD_STATUS_CHANGED",
    label: "Lead Status Changed",
    description: "Fires when a lead moves between pipeline stages.",
    group: "Trigger",
    icon: RefreshCcw,
    accent: "bg-accent/10 text-accent",
    fields: [
      {
        key: "toStatus",
        label: "When status becomes",
        type: "select",
        options: ["", "NEW", "CONTACTED", "QUALIFIED", "IN_APPLICATION", "CLOSED", "LOST"] as const,
      },
    ],
  },
  TRIGGER_SCHEDULE_CRON: {
    type: "TRIGGER_SCHEDULE_CRON",
    label: "Schedule",
    description: "Fires on a cron schedule.",
    group: "Trigger",
    icon: Calendar,
    accent: "bg-accent/10 text-accent",
    fields: [
      { key: "cron", label: "Cron expression", type: "text", placeholder: "0 9 * * 1", help: "Standard 5-field cron. Uses UTC." },
    ],
  },
  TRIGGER_WEBHOOK_RECEIVED: {
    type: "TRIGGER_WEBHOOK_RECEIVED",
    label: "Webhook",
    description: "Fires on POST to /api/hooks/<workflowId>.",
    group: "Trigger",
    icon: Webhook,
    accent: "bg-accent/10 text-accent",
    fields: [],
  },
  TRIGGER_MANUAL: {
    type: "TRIGGER_MANUAL",
    label: "Manual",
    description: "Only fires when you click Test Run.",
    group: "Trigger",
    icon: Play,
    accent: "bg-accent/10 text-accent",
    fields: [],
  },

  // ─── Actions ──────────────────────────────────────────────
  SEND_EMAIL: {
    type: "SEND_EMAIL",
    label: "Send Email",
    description: "Send a branded email via Resend. Supports merge tags.",
    group: "Action",
    icon: Mail,
    accent: "bg-chart-1/10 text-[color:var(--chart-1)]",
    fields: [
      { key: "to", label: "To", type: "text", default: "{{lead.email}}", placeholder: "{{lead.email}} or fixed@x.com", help: "Uses RESEND_TO_OVERRIDE in production demo." },
      { key: "subject", label: "Subject", type: "text", placeholder: "Next steps for your {{lead.businessName}} application" },
      { key: "body", label: "Body (plain text + merge tags)", type: "textarea", placeholder: "Hi {{lead.ownerName}},\n\n…" },
    ],
  },
  SEND_SMS: {
    type: "SEND_SMS",
    label: "Send SMS",
    description: "Send an SMS via Twilio. Simulates when keys missing.",
    group: "Action",
    icon: MessageSquare,
    accent: "bg-chart-2/10 text-[color:var(--chart-2)]",
    fields: [
      { key: "to", label: "Phone", type: "text", default: "{{lead.phone}}" },
      { key: "body", label: "Message (≤ 160 chars)", type: "textarea", placeholder: "Hi {{lead.ownerName}}, quick follow-up…" },
    ],
  },
  MAKE_VOICE_CALL: {
    type: "MAKE_VOICE_CALL",
    label: "Voice Call",
    description: "Place an AI voice call via Twilio + ElevenLabs. Simulates cleanly.",
    group: "Action",
    icon: Phone,
    accent: "bg-chart-2/10 text-[color:var(--chart-2)]",
    fields: [
      { key: "to", label: "Phone", type: "text", default: "{{lead.phone}}" },
      { key: "message", label: "Script", type: "textarea", placeholder: "Hello {{lead.ownerName}}, this is BrokerOS calling about your funding application…" },
      { key: "voiceId", label: "ElevenLabs voice ID (optional)", type: "text", placeholder: "EXAVITQu4vr4xnSDxMaL" },
    ],
  },
  GROQ_GENERATE: {
    type: "GROQ_GENERATE",
    label: "AI Generate",
    description: "Ask Llama-3.3-70B to write a personalized message.",
    group: "Action",
    icon: Brain,
    accent: "bg-primary/10 text-primary",
    fields: [
      { key: "system", label: "System prompt", type: "textarea", default: "You are a concise, professional US small-business loan broker assistant." },
      { key: "prompt", label: "User prompt (supports merge tags)", type: "textarea", placeholder: "Write a 3-sentence friendly nudge to {{lead.ownerName}} about their {{lead.loanAmount}} request." },
      { key: "temperature", label: "Temperature", type: "number", default: 0.4, min: 0, max: 1 },
      { key: "maxTokens", label: "Max tokens", type: "number", default: 400, min: 50, max: 4000 },
    ],
  },
  UPDATE_LEAD: {
    type: "UPDATE_LEAD",
    label: "Update Lead",
    description: "Patch status / score / notes on the lead in context.",
    group: "Action",
    icon: UserCog,
    accent: "bg-success/10 text-success",
    fields: [
      {
        key: "status",
        label: "New status",
        type: "select",
        options: ["", "NEW", "CONTACTED", "QUALIFIED", "IN_APPLICATION", "CLOSED", "LOST"] as const,
      },
      { key: "score", label: "Override score", type: "number", min: 0, max: 100 },
      { key: "notes", label: "Append note", type: "textarea", placeholder: "Free text (merge tags ok)" },
    ],
  },
  CREATE_INTERACTION: {
    type: "CREATE_INTERACTION",
    label: "Log Interaction",
    description: "Add an entry to the lead's interaction timeline.",
    group: "Action",
    icon: StickyNote,
    accent: "bg-success/10 text-success",
    fields: [
      {
        key: "type",
        label: "Type",
        type: "select",
        options: ["NOTE", "EMAIL", "SMS", "CALL", "STATUS_CHANGE", "AI_ACTION"] as const,
        default: "NOTE",
      },
      {
        key: "direction",
        label: "Direction",
        type: "select",
        options: ["INTERNAL", "INBOUND", "OUTBOUND"] as const,
        default: "INTERNAL",
      },
      { key: "subject", label: "Subject", type: "text" },
      { key: "content", label: "Content", type: "textarea" },
      { key: "outcome", label: "Outcome", type: "text" },
    ],
  },
  HTTP_REQUEST: {
    type: "HTTP_REQUEST",
    label: "HTTP Request",
    description: "Call any URL. Zapier in one node.",
    group: "Action",
    icon: Send,
    accent: "bg-chart-4/20 text-primary",
    fields: [
      { key: "method", label: "Method", type: "select", options: ["GET", "POST", "PUT", "DELETE", "PATCH"] as const, default: "POST" },
      { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com/hook" },
      { key: "bearer", label: "Bearer token (optional)", type: "text", placeholder: "{{lead.apiKey}} or static" },
      { key: "body", label: "Body (JSON or text, merge tags ok)", type: "textarea" },
    ],
  },
  SLACK_NOTIFY: {
    type: "SLACK_NOTIFY",
    label: "Slack Notify",
    description: "Post to a Slack incoming webhook.",
    group: "Action",
    icon: Slack,
    accent: "bg-chart-4/20 text-primary",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", type: "text", placeholder: "https://hooks.slack.com/services/..." },
      { key: "text", label: "Message (merge tags ok)", type: "textarea", placeholder: "🔥 New HOT lead: {{lead.businessName}} — score {{trigger.score}}" },
    ],
  },

  // ─── Flow control ─────────────────────────────────────────
  WAIT: {
    type: "WAIT",
    label: "Wait",
    description: "Park the run, resume on schedule.",
    group: "Flow control",
    icon: Clock,
    accent: "bg-muted text-muted-foreground",
    fields: [
      { key: "amount", label: "Amount", type: "number", default: 2, min: 1 },
      { key: "unit", label: "Unit", type: "select", options: ["minutes", "hours", "days"] as const, default: "hours" },
    ],
  },
  CONDITION: {
    type: "CONDITION",
    label: "Condition",
    description: "Branch on a comparison. Emits true / false edges.",
    group: "Flow control",
    icon: GitBranch,
    accent: "bg-muted text-muted-foreground",
    handles: { kind: "condition" },
    fields: [
      { key: "left", label: "Left", type: "text", placeholder: "{{lead.score}}" },
      {
        key: "op",
        label: "Operator",
        type: "select",
        options: ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "regex", "exists"] as const,
        default: "gte",
      },
      { key: "right", label: "Right", type: "text", placeholder: "70" },
    ],
  },
  SPLIT: {
    type: "SPLIT",
    label: "Split",
    description: "Fan out to parallel branches (MVP: first branch).",
    group: "Flow control",
    icon: Split,
    accent: "bg-muted text-muted-foreground",
    fields: [],
  },
  MERGE: {
    type: "MERGE",
    label: "Merge",
    description: "Gather parallel branches back (MVP: pass-through).",
    group: "Flow control",
    icon: Merge,
    accent: "bg-muted text-muted-foreground",
    fields: [],
  },
  LOOP: {
    type: "LOOP",
    label: "Loop",
    description: "Iterate over an array (MVP: first-item only).",
    group: "Flow control",
    icon: Repeat,
    accent: "bg-muted text-muted-foreground",
    fields: [
      { key: "itemsPath", label: "Items (JSON array template)", type: "text", placeholder: "{{trigger.items}}" },
    ],
  },
};

export const GROUPS: readonly NodeGroup[] = ["Trigger", "Action", "Flow control"];

export function nodesForGroup(group: NodeGroup): NodeMeta[] {
  return Object.values(NODE_CATALOG).filter((n) => n.group === group);
}

export { Zap };
