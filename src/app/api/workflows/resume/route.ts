import { NextResponse } from "next/server";
import { RunStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resumeRun } from "@/lib/workflow/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Invoked by Vercel Cron every minute. Finds all WAITING runs whose
 *  resumeAt has passed and continues execution. Protected by CRON_SECRET
 *  so external callers can't spam it. Also accepts Vercel's cron User-Agent
 *  header as a convenience. */
async function handleResume(request: Request) {
  const url = new URL(request.url);
  const providedSecret =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret");
  const isVercelCron =
    request.headers.get("user-agent")?.startsWith("vercel-cron") === true;

  const expected = process.env.CRON_SECRET;
  if (expected && providedSecret !== expected && !isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.workflowRun.findMany({
    where: {
      status: RunStatus.WAITING,
      resumeAt: { lte: now },
    },
    take: 50,
    select: { id: true },
  });

  const results: { runId: string; status: string; stepsExecuted: number }[] = [];
  for (const row of due) {
    try {
      const r = await resumeRun(row.id);
      results.push({ runId: r.runId, status: r.status, stepsExecuted: r.stepsExecuted });
    } catch (err) {
      results.push({
        runId: row.id,
        status: "ERROR",
        stepsExecuted: 0,
      });
      console.warn(`[workflow.resume] ${row.id} failed:`, err);
    }
  }

  return NextResponse.json({
    processed: results.length,
    scannedAt: now.toISOString(),
    results,
  });
}

export async function GET(request: Request) {
  return handleResume(request);
}

export async function POST(request: Request) {
  return handleResume(request);
}
