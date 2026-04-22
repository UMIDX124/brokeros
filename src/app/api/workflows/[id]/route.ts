import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  trigger: z
    .object({
      type: z.enum([
        "LEAD_CREATED",
        "LEAD_SCORED",
        "LEAD_STATUS_CHANGED",
        "SCHEDULE_CRON",
        "WEBHOOK_RECEIVED",
        "MANUAL",
      ]),
      config: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  nodes: z.array(z.unknown()).optional(),
  edges: z.array(z.unknown()).optional(),
});

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const wf = await prisma.workflow.findFirst({
    where: { id, ownerId: session.user.id },
    include: { _count: { select: { runs: true } } },
  });
  if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ workflow: wf });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.workflow.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Prisma.WorkflowUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.enabled !== undefined) data.enabled = parsed.data.enabled;
  if (parsed.data.trigger !== undefined) data.trigger = parsed.data.trigger as Prisma.InputJsonValue;
  if (parsed.data.nodes !== undefined) data.nodes = parsed.data.nodes as Prisma.InputJsonValue;
  if (parsed.data.edges !== undefined) data.edges = parsed.data.edges as Prisma.InputJsonValue;

  const updated = await prisma.workflow.update({ where: { id }, data });
  return NextResponse.json({ workflow: updated });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const existing = await prisma.workflow.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workflow.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
