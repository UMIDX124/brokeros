/** Shared types for the workflow engine. Kept framework-agnostic so the engine
 *  runs in API routes, cron handlers, and server actions without React deps. */

export type NodeType =
  // Triggers
  | "TRIGGER_LEAD_CREATED"
  | "TRIGGER_LEAD_SCORED"
  | "TRIGGER_LEAD_STATUS_CHANGED"
  | "TRIGGER_SCHEDULE_CRON"
  | "TRIGGER_WEBHOOK_RECEIVED"
  | "TRIGGER_MANUAL"
  // Actions
  | "SEND_EMAIL"
  | "SEND_SMS"
  | "MAKE_VOICE_CALL"
  | "GROQ_GENERATE"
  | "UPDATE_LEAD"
  | "CREATE_INTERACTION"
  | "HTTP_REQUEST"
  | "SLACK_NOTIFY"
  // Flow control
  | "WAIT"
  | "CONDITION"
  | "SPLIT"
  | "MERGE"
  | "LOOP";

export type WorkflowNode = {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  /** For CONDITION nodes: 'true' | 'false'. For SPLIT: branch name. */
  sourceHandle?: string;
  label?: string;
};

export type WorkflowTrigger =
  | { type: "LEAD_CREATED"; config?: Record<string, unknown> }
  | { type: "LEAD_SCORED"; config?: { minScore?: number; tier?: string } }
  | { type: "LEAD_STATUS_CHANGED"; config?: { toStatus?: string } }
  | { type: "SCHEDULE_CRON"; config?: { cron?: string } }
  | { type: "WEBHOOK_RECEIVED"; config?: Record<string, unknown> }
  | { type: "MANUAL"; config?: Record<string, unknown> };

export type WorkflowDefinition = {
  name: string;
  description?: string;
  enabled?: boolean;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

/** The runtime context passed to every node handler. Handlers read `lead` +
 *  `triggerData` + merged previous-step outputs, and return `{ output, next? }`. */
export type RunContext = {
  runId: string;
  workflowId: string;
  ownerId: string;
  triggerData: Record<string, unknown>;
  lead?: Record<string, unknown> | null;
  /** Accumulated step outputs keyed by nodeId. Used by merge tags + conditions. */
  stepOutputs: Record<string, unknown>;
};

export type HandlerResult = {
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "WAITING";
  output?: unknown;
  error?: string;
  /** For CONDITION: outgoing edge sourceHandle ('true' | 'false') to follow.
   *  For WAIT: ISO timestamp when to resume. */
  branch?: string;
  resumeAt?: string;
};

/** Lightweight merge-tag templater: replaces `{{lead.firstName}}` and
 *  `{{trigger.score}}` etc. with values from context. Never throws. */
export function renderTemplate(
  template: string,
  ctx: RunContext,
): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, path: string) => {
    const parts = path.split(".");
    const root = parts[0];
    let obj: unknown;
    if (root === "lead") obj = ctx.lead;
    else if (root === "trigger") obj = ctx.triggerData;
    else if (root === "steps") obj = ctx.stepOutputs;
    else return `{{${path}}}`;
    let cur: unknown = obj;
    for (let i = 1; i < parts.length; i++) {
      if (cur && typeof cur === "object") {
        cur = (cur as Record<string, unknown>)[parts[i] ?? ""];
      } else {
        cur = undefined;
      }
    }
    if (cur === undefined || cur === null) return "";
    return typeof cur === "string" ? cur : JSON.stringify(cur);
  });
}

/** Strict-comparison operators for CONDITION nodes. */
export type ConditionOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "regex" | "exists";

export function evalCondition(
  left: unknown,
  op: ConditionOp,
  right: unknown,
): boolean {
  switch (op) {
    case "eq":
      return left == right;
    case "neq":
      return left != right;
    case "gt":
      return Number(left) > Number(right);
    case "gte":
      return Number(left) >= Number(right);
    case "lt":
      return Number(left) < Number(right);
    case "lte":
      return Number(left) <= Number(right);
    case "contains":
      return String(left ?? "").includes(String(right ?? ""));
    case "regex":
      try {
        return new RegExp(String(right)).test(String(left ?? ""));
      } catch {
        return false;
      }
    case "exists":
      return left !== undefined && left !== null && left !== "";
    default:
      return false;
  }
}
