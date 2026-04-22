import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
import type { Node, Edge } from "@xyflow/react";
import type { WorkflowTrigger } from "@/lib/workflow/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const w = await prisma.workflow.findUnique({ where: { id }, select: { name: true } });
  return { title: w?.name ?? "Workflow" };
}

export default async function EditAutomationPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/dashboard/automations/${id}`);

  const wf = await prisma.workflow.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!wf) notFound();

  type PersistedNode = { id: string; type: string; position: { x: number; y: number }; data: Record<string, unknown> };
  type PersistedEdge = { id: string; source: string; target: string; sourceHandle?: string; label?: string };

  const persistedNodes = (wf.nodes as unknown as PersistedNode[]) ?? [];
  const persistedEdges = (wf.edges as unknown as PersistedEdge[]) ?? [];

  const nodes: Node[] = persistedNodes.map((n) => ({
    id: n.id,
    type: "custom",
    position: n.position,
    data: { ...n.data, nodeType: n.type },
  }));

  const edges: Edge[] = persistedEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    label: e.label,
  }));

  return (
    <WorkflowBuilder
      workflowId={wf.id}
      initial={{
        id: wf.id,
        name: wf.name,
        description: wf.description,
        enabled: wf.enabled,
        trigger: wf.trigger as unknown as WorkflowTrigger,
        nodes,
        edges,
      }}
    />
  );
}
