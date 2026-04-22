import { NextResponse } from "next/server";
import { LeadStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUALIFIED_STATUSES: LeadStatus[] = [
  LeadStatus.QUALIFIED,
  LeadStatus.IN_APPLICATION,
  LeadStatus.CLOSED,
];

const OPEN_PIPELINE_STATUSES: LeadStatus[] = [
  LeadStatus.QUALIFIED,
  LeadStatus.IN_APPLICATION,
];

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalLeads, qualifiedLeads, closedAgg, pipelineAgg, leadsByDay] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: { in: QUALIFIED_STATUSES } } }),
    prisma.lead.aggregate({
      where: { status: LeadStatus.CLOSED },
      _sum: { loanAmount: true },
      _count: { _all: true },
    }),
    prisma.lead.aggregate({
      where: { status: { in: OPEN_PIPELINE_STATUSES } },
      _sum: { loanAmount: true },
    }),
    prisma.$queryRaw<{ day: Date; leads: bigint; qualified: bigint }[]>`
      SELECT
        date_trunc('day', "createdAt") AS day,
        COUNT(*)::bigint AS leads,
        COUNT(*) FILTER (WHERE COALESCE("score", 0) >= 70)::bigint AS qualified
      FROM "Lead"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  const closedRevenue = closedAgg._sum.loanAmount ?? 0;
  const closedCount = closedAgg._count._all ?? 0;
  const openPipeline = pipelineAgg._sum.loanAmount ?? 0;
  const conversionPct =
    totalLeads === 0 ? 0 : Math.round((closedCount / totalLeads) * 100);

  // Fill any missing days in the 30-day window so the chart never has gaps.
  const series: { date: string; leads: number; qualified: number }[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const row = leadsByDay.find((r) => r.day.toISOString().slice(0, 10) === iso);
    series.push({
      date: iso,
      leads: row ? Number(row.leads) : 0,
      qualified: row ? Number(row.qualified) : 0,
    });
  }

  return NextResponse.json({
    totalLeads,
    qualifiedLeads,
    closedCount,
    closedRevenue,
    openPipeline,
    pipelineUsd: closedRevenue + openPipeline,
    conversionPct,
    series,
  });
}
