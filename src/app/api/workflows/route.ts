import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.unknown()).default({}),
});

const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  label: z.string().optional(),
});

const triggerSchema = z.object({
  type: z.enum([
    "LEAD_CREATED",
    "LEAD_SCORED",
    "LEAD_STATUS_CHANGED",
    "SCHEDULE_CRON",
    "WEBHOOK_RECEIVED",
    "MANUAL",
  ]),
  config: z.record(z.string(), z.unknown()).optional(),
});

const workflowUpsertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  trigger: triggerSchema,
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await prisma.workflow.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { runs: true } },
      runs: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { status: true, startedAt: true },
      },
    },
  });

  return NextResponse.json({ workflows });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = workflowUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workflow", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await prisma.workflow.create({
    data: {
      ownerId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      enabled: parsed.data.enabled,
      trigger: parsed.data.trigger as Prisma.InputJsonValue,
      nodes: parsed.data.nodes as Prisma.InputJsonValue,
      edges: parsed.data.edges as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ workflow: created }, { status: 201 });
}
