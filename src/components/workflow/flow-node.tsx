"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_CATALOG } from "./node-catalog";
import type { NodeType } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

type Data = {
  label?: string;
  nodeType: NodeType;
  selected?: boolean;
  [k: string]: unknown;
};

export function FlowNode(props: NodeProps) {
  const data = props.data as Data;
  const meta = NODE_CATALOG[data.nodeType];
  if (!meta) return null;
  const Icon = meta.icon;
  const isCondition = meta.handles?.kind === "condition";
  const isTrigger = meta.group === "Trigger";

  const summary = buildSummary(data);

  return (
    <div
      className={cn(
        "rounded-xl border bg-surface shadow-sm w-56 transition",
        props.selected ? "border-accent ring-2 ring-accent/40" : "border-border",
      )}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2.5 !h-2.5 !bg-accent !border-none"
        />
      )}

      <div className="px-3 pt-3 flex items-center gap-2">
        <span className={cn("grid h-7 w-7 place-items-center rounded-md shrink-0", meta.accent)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-stat">
            {meta.group}
          </div>
          <div className="text-sm font-medium truncate">{data.label ?? meta.label}</div>
        </div>
      </div>

      {summary && (
        <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground line-clamp-2">
          {summary}
        </div>
      )}

      {isCondition ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            style={{ left: "30%" }}
            className="!w-2.5 !h-2.5 !bg-success !border-none"
          />
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            style={{ left: "70%" }}
            className="!w-2.5 !h-2.5 !bg-destructive !border-none"
          />
          <div className="px-3 pb-2 flex justify-between text-[10px] text-muted-foreground font-stat">
            <span>true</span>
            <span>false</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-2.5 !h-2.5 !bg-accent !border-none"
        />
      )}
    </div>
  );
}

function buildSummary(data: Record<string, unknown>): string | null {
  const { nodeType, ...rest } = data;
  switch (nodeType) {
    case "SEND_EMAIL":
      return typeof rest.subject === "string" ? rest.subject : "Subject not set";
    case "SEND_SMS":
      return typeof rest.body === "string" ? rest.body.slice(0, 64) : null;
    case "MAKE_VOICE_CALL":
      return typeof rest.message === "string" ? rest.message.slice(0, 64) : null;
    case "WAIT": {
      const a = rest.amount ?? "?";
      const u = rest.unit ?? "hours";
      return `${a} ${u}`;
    }
    case "CONDITION": {
      const l = rest.left ?? "";
      const op = rest.op ?? "eq";
      const r = rest.right ?? "";
      return `${l} ${op} ${r}`;
    }
    case "UPDATE_LEAD":
      return typeof rest.status === "string" && rest.status
        ? `Status → ${rest.status}`
        : typeof rest.score === "number"
          ? `Score → ${rest.score}`
          : null;
    case "CREATE_INTERACTION":
      return typeof rest.subject === "string" ? rest.subject : (rest.type as string | undefined) ?? null;
    case "HTTP_REQUEST":
      return `${rest.method ?? "POST"} ${rest.url ?? "(url not set)"}`;
    case "SLACK_NOTIFY":
      return typeof rest.text === "string" ? rest.text.slice(0, 64) : null;
    case "GROQ_GENERATE":
      return typeof rest.prompt === "string" ? rest.prompt.slice(0, 64) : null;
    default:
      return null;
  }
}
