"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ChevronDown, Loader2, Play, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { FlowNode } from "./flow-node";
import { NODE_CATALOG, GROUPS, nodesForGroup, type FieldSchema } from "./node-catalog";
import type { NodeType, WorkflowTrigger } from "@/lib/workflow/types";

const nodeTypes = { custom: FlowNode };

type SavedWorkflow = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  trigger: WorkflowTrigger;
  nodes: Node[];
  edges: Edge[];
};

export type BuilderProps = {
  workflowId?: string; // undefined for /new
  initial?: SavedWorkflow;
};

const TRIGGER_NODE_TYPES: NodeType[] = [
  "TRIGGER_LEAD_CREATED",
  "TRIGGER_LEAD_SCORED",
  "TRIGGER_LEAD_STATUS_CHANGED",
  "TRIGGER_MANUAL",
  "TRIGGER_WEBHOOK_RECEIVED",
  "TRIGGER_SCHEDULE_CRON",
];

function triggerTypeToNodeType(t: WorkflowTrigger["type"]): NodeType {
  switch (t) {
    case "LEAD_CREATED": return "TRIGGER_LEAD_CREATED";
    case "LEAD_SCORED": return "TRIGGER_LEAD_SCORED";
    case "LEAD_STATUS_CHANGED": return "TRIGGER_LEAD_STATUS_CHANGED";
    case "SCHEDULE_CRON": return "TRIGGER_SCHEDULE_CRON";
    case "WEBHOOK_RECEIVED": return "TRIGGER_WEBHOOK_RECEIVED";
    case "MANUAL": return "TRIGGER_MANUAL";
  }
}

function defaultWorkflow(): SavedWorkflow {
  const triggerId = "trigger";
  const actionId = "node_1";
  return {
    id: "new",
    name: "Untitled workflow",
    description: "",
    enabled: true,
    trigger: { type: "LEAD_SCORED", config: { minScore: 70 } },
    nodes: [
      {
        id: triggerId,
        type: "custom",
        position: { x: 80, y: 60 },
        data: { nodeType: "TRIGGER_LEAD_SCORED", label: "Lead Scored" },
      },
      {
        id: actionId,
        type: "custom",
        position: { x: 80, y: 220 },
        data: {
          nodeType: "SEND_EMAIL",
          label: "Send Email",
          to: "{{lead.email}}",
          subject: "Next steps for {{lead.businessName}}",
          body: "Hi {{lead.ownerName}},\n\nThanks for applying — a broker will reach out within 1 business day.\n\n— BrokerOS",
        },
      },
    ],
    edges: [
      { id: `${triggerId}-${actionId}`, source: triggerId, target: actionId },
    ],
  };
}

export function WorkflowBuilder(props: BuilderProps) {
  return (
    <ReactFlowProvider>
      <BuilderInner {...props} />
    </ReactFlowProvider>
  );
}

function BuilderInner({ workflowId, initial }: BuilderProps) {
  const router = useRouter();
  const { screenToFlowPosition } = useReactFlow();
  const [wf, setWf] = useState<SavedWorkflow>(initial ?? defaultWorkflow());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  const selectedNode = useMemo(
    () => wf.nodes.find((n) => n.id === selectedId) ?? null,
    [wf.nodes, selectedId],
  );
  const selectedMeta = selectedNode
    ? NODE_CATALOG[selectedNode.data.nodeType as NodeType]
    : null;

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setWf((prev) => ({ ...prev, nodes: applyNodeChanges(changes, prev.nodes) }));
  }, []);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setWf((prev) => ({ ...prev, edges: applyEdgeChanges(changes, prev.edges) }));
  }, []);
  const onConnect = useCallback(
    (c: Connection) => {
      setWf((prev) => ({ ...prev, edges: addEdge({ ...c, id: `e_${Date.now()}` }, prev.edges) }));
    },
    [],
  );

  const onDragStart = (e: React.DragEvent, t: NodeType) => {
    e.dataTransfer.setData("application/brokeros-node", t);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const t = event.dataTransfer.getData("application/brokeros-node") as NodeType;
      if (!t || !NODE_CATALOG[t]) return;

      // Prevent multiple triggers
      if (NODE_CATALOG[t].group === "Trigger") {
        const existingTrigger = wf.nodes.find((n) =>
          TRIGGER_NODE_TYPES.includes(n.data.nodeType as NodeType),
        );
        if (existingTrigger) {
          toast.error("A workflow can only have one trigger. Delete the existing one first.");
          return;
        }
      }

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const id = `node_${Date.now()}`;
      const meta = NODE_CATALOG[t];
      const data: Record<string, unknown> = { nodeType: t, label: meta.label };
      for (const f of meta.fields) {
        if ("default" in f && f.default !== undefined) data[f.key] = f.default;
      }
      setWf((prev) => ({
        ...prev,
        nodes: [
          ...prev.nodes,
          { id, type: "custom", position, data },
        ],
      }));
      setSelectedId(id);

      // If we just dropped a new trigger, sync wf.trigger
      if (meta.group === "Trigger") {
        const triggerType = t.replace("TRIGGER_", "") as WorkflowTrigger["type"];
        setWf((prev) => ({ ...prev, trigger: { type: triggerType, config: {} } }));
      }
    },
    [screenToFlowPosition, wf.nodes],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const updateSelectedField = (key: string, value: unknown) => {
    if (!selectedNode) return;
    setWf((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: value } } : n,
      ),
    }));

    // Sync trigger config if editing a trigger node
    if (selectedMeta?.group === "Trigger") {
      const triggerType = (selectedNode.data.nodeType as string).replace(
        "TRIGGER_",
        "",
      ) as WorkflowTrigger["type"];
      setWf((prev) => {
        const current = (prev.trigger.config ?? {}) as Record<string, unknown>;
        return {
          ...prev,
          trigger: {
            type: triggerType,
            config: { ...current, [key]: value },
          },
        };
      });
    }
  };

  const deleteSelected = () => {
    if (!selectedNode) return;
    setWf((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== selectedNode.id),
      edges: prev.edges.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
      ),
    }));
    setSelectedId(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: wf.name,
        description: wf.description,
        enabled: wf.enabled,
        trigger: wf.trigger,
        nodes: wf.nodes.map((n) => ({
          id: n.id,
          type: n.data.nodeType as string,
          position: n.position,
          data: n.data as Record<string, unknown>,
        })),
        edges: wf.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? undefined,
          label: typeof e.label === "string" ? e.label : undefined,
        })),
      };

      const res = await fetch(
        workflowId ? `/api/workflows/${workflowId}` : "/api/workflows",
        {
          method: workflowId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? "Save failed");
        return;
      }
      const body = (await res.json()) as { workflow?: { id: string } };
      toast.success("Workflow saved.");
      if (!workflowId && body.workflow) {
        router.push(`/dashboard/automations/${body.workflow.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    if (!workflowId) {
      toast.error("Save the workflow before running a test.");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/test`, { method: "POST" });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? "Test run failed");
        return;
      }
      const body = (await res.json()) as { runId: string; status: string; stepsExecuted: number };
      toast.success(`Test run ${body.status.toLowerCase()} — ${body.stepsExecuted} step(s).`, {
        action: {
          label: "Open",
          onClick: () => router.push(`/dashboard/automations/${workflowId}/runs/${body.runId}`),
        },
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="border-b border-border bg-surface px-4 md:px-6 h-14 flex items-center gap-3">
        <Link
          href="/dashboard/automations"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All automations
        </Link>
        <Input
          value={wf.name}
          onChange={(e) => setWf((p) => ({ ...p, name: e.target.value }))}
          className="h-9 max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
          <input
            type="checkbox"
            checked={wf.enabled}
            onChange={(e) => setWf((p) => ({ ...p, enabled: e.target.checked }))}
            className="h-4 w-4 accent-[color:var(--accent)]"
          />
          Enabled
        </label>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runTest}
            disabled={testing || !workflowId}
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1.5" />}
            Test Run
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left palette */}
        <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-border bg-background overflow-y-auto">
          <div className="p-4 text-xs uppercase tracking-widest text-muted-foreground font-stat">
            Drag to canvas
          </div>
          {GROUPS.map((g) => (
            <div key={g} className="px-3 pb-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1">
                {g}
              </div>
              <div className="space-y-1.5">
                {nodesForGroup(g).map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, n.type)}
                      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-sm cursor-grab hover:border-accent transition"
                    >
                      <span className={cn("grid h-6 w-6 place-items-center rounded-md shrink-0", n.accent)}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="truncate">{n.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Canvas */}
        <div
          ref={wrapper}
          className="flex-1 min-w-0 relative"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={wf.nodes}
            edges={wf.edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "var(--accent)", strokeWidth: 1.5 },
            }}
          >
            <Background color="var(--border)" gap={20} size={1} />
            <Controls position="bottom-right" className="!bg-surface !border !border-border !rounded-lg" />
            <MiniMap
              pannable
              zoomable
              className="!bg-surface !border !border-border !rounded-lg"
              maskColor="rgba(26,26,46,0.08)"
            />
          </ReactFlow>
        </div>

        {/* Right config panel */}
        <aside className="hidden lg:flex lg:flex-col w-80 shrink-0 border-l border-border bg-surface overflow-y-auto">
          {selectedNode && selectedMeta ? (
            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-stat">
                    {selectedMeta.group}
                  </div>
                  <h3 className="text-lg font-semibold">{selectedMeta.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {selectedMeta.description}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={deleteSelected} aria-label="Delete node">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Display name</Label>
                <Input
                  value={(selectedNode.data.label as string) ?? selectedMeta.label}
                  onChange={(e) => updateSelectedField("label", e.target.value)}
                />
              </div>

              {selectedMeta.fields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={selectedNode.data[f.key]}
                  onChange={(v) => updateSelectedField(f.key, v)}
                />
              ))}

              <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                <div className="font-medium text-foreground">Merge tags</div>
                <div className="font-stat text-[11px]">
                  <code>{"{{lead.firstName}}"}</code>, <code>{"{{lead.email}}"}</code>,{" "}
                  <code>{"{{lead.businessName}}"}</code>, <code>{"{{trigger.score}}"}</code>,{" "}
                  <code>{"{{trigger.tier}}"}</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              <ChevronDown className="h-4 w-4 mb-2 opacity-60" />
              Select a node to configure it, or drag one in from the left palette.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSchema;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "text") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">{field.label}</Label>
        <Input
          value={(value as string | undefined) ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>}
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">{field.label}</Label>
        <Input
          type="number"
          value={(value as number | undefined) ?? ""}
          min={field.min}
          max={field.max}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Number(e.target.value);
            onChange(n);
          }}
        />
        {field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>}
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">{field.label}</Label>
        <Textarea
          value={(value as string | undefined) ?? ""}
          placeholder={field.placeholder}
          rows={5}
          onChange={(e) => onChange(e.target.value)}
          className="font-stat text-[13px]"
        />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">{field.label}</Label>
        <Select
          value={((value as string | undefined) ?? "__empty") as string}
          onValueChange={(v) => onChange(v === "__empty" ? "" : v)}
        >
          <SelectTrigger className="h-9"><SelectValue placeholder="Pick..." /></SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o || "__empty"} value={o || "__empty"}>
                {o || "— any —"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>}
      </div>
    );
  }
  return null;
}
