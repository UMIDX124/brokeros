import { NextResponse } from "next/server";
import { LoanProduct, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applySchema, applyToLead } from "@/lib/leads/schema";
import { scoreLead, type ScoreInput } from "@/lib/ai/score-lead";
import { sendWelcomeEmail } from "@/lib/email/send-welcome";
import { runWorkflowsForTrigger } from "@/lib/workflow/engine";
import { clientIdentifier, consumeApplyRate } from "@/lib/security/ratelimit";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const runtime = "nodejs";

const HIGH_SCORE_THRESHOLD = 70;

function inferProduct(useOfFunds: string): LoanProduct {
  switch (useOfFunds) {
    case "Equipment purchase":
      return LoanProduct.EQUIPMENT;
    case "Working capital":
    case "Hiring / payroll":
    case "Marketing":
      return LoanProduct.WORKING_CAPITAL;
    case "Inventory":
      return LoanProduct.LINE_OF_CREDIT;
    case "Real estate":
    case "Expansion / new location":
      return LoanProduct.SBA;
    case "Refinance existing debt":
      return LoanProduct.WORKING_CAPITAL;
    default:
      return LoanProduct.WORKING_CAPITAL;
  }
}

export async function POST(request: Request) {
  // 1) Rate limit by IP — 5 req/min sliding window. Disabled when Upstash
  //    isn't configured so /apply keeps working during pre-wiring demos.
  const identity = clientIdentifier(request);
  const limit = await consumeApplyRate(identity);
  if (!limit.success) {
    const retryAfterSec = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    return NextResponse.json(
      {
        error: "Too many requests. Please wait a minute and try again.",
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-RateLimit-Reset": String(limit.reset),
        },
      },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = applySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // 2) Honeypot — real borrowers never see or touch the 'website' field.
  //    Any non-empty value means a bot. Respond 200 so the bot thinks it
  //    succeeded; silently drop with no DB write, no AI call, no email.
  const honeypotValue = parsed.data.website?.trim();
  if (honeypotValue) {
    console.warn("[/api/leads] honeypot hit — silently dropping", {
      identity,
      honeypotLen: honeypotValue.length,
      email: parsed.data.email,
    });
    return NextResponse.json(
      { leadId: "honeypot", message: "Application received." },
      { status: 200 },
    );
  }

  // 3) Cloudflare Turnstile — server-side token verification. Bypasses
  //    cleanly when TURNSTILE_SECRET_KEY isn't set (logged + continues).
  const turnstile = await verifyTurnstile(parsed.data.turnstileToken, identity);
  if (!turnstile.success && !turnstile.bypassed) {
    return NextResponse.json(
      {
        error: "Captcha verification failed. Please refresh and try again.",
        codes: turnstile.errorCodes,
      },
      { status: 400 },
    );
  }

  const lead = applyToLead(parsed.data);
  const product = inferProduct(parsed.data.useOfFunds);

  let created;
  try {
    created = await prisma.lead.create({
      data: {
        businessName: lead.businessName,
        ownerName: lead.ownerName,
        email: lead.email,
        phone: lead.phone,
        loanAmount: lead.loanAmount,
        monthlyRevenue: lead.monthlyRevenue,
        timeInBusinessMonths: lead.timeInBusinessMonths,
        industry: lead.industry,
        loanPurpose: lead.loanPurpose,
        creditScoreRange: lead.creditScoreRange,
        product,
        source: "Apply form",
        metadata: {
          legalName: lead.legalName,
          state: lead.state,
          fundingTimeline: lead.fundingTimeline,
          bestTimeToCall: lead.bestTimeToCall,
        } satisfies Prisma.JsonObject,
      },
    });
  } catch (err) {
    console.error("[/api/leads] create failed", err);
    return NextResponse.json({ error: "Could not save lead" }, { status: 500 });
  }

  const scoreInput: ScoreInput = {
    businessName: lead.businessName,
    industry: lead.industry,
    monthlyRevenue: lead.monthlyRevenue,
    timeInBusinessMonths: lead.timeInBusinessMonths,
    loanAmount: lead.loanAmount,
    loanPurpose: lead.loanPurpose,
    product,
    creditScoreRange: lead.creditScoreRange,
    state: lead.state,
  };

  const scored = await scoreLead(scoreInput);

  const updated = await prisma.lead.update({
    where: { id: created.id },
    data: {
      score: scored.score,
      scoreReason: scored.reasoning,
      scoredAt: new Date(),
    },
  });

  // Log AI scoring as an interaction so the timeline tells the story
  await prisma.interaction.create({
    data: {
      leadId: updated.id,
      type: "AI_ACTION",
      direction: "INTERNAL",
      subject: "Lead scored",
      content: `${scored.source === "groq" ? "AI" : "Heuristic"} underwriter scored this lead ${scored.score}/100 (${scored.tier}). ${scored.reasoning}`,
      metadata: {
        source: scored.source,
        tier: scored.tier,
        recommendedProducts: scored.recommendedProducts,
        attempts: scored.attempts ?? 0,
        modelUsed: scored.modelUsed,
      } satisfies Prisma.JsonObject,
    },
  });

  let emailResult: Awaited<ReturnType<typeof sendWelcomeEmail>> | null = null;
  if (scored.score >= HIGH_SCORE_THRESHOLD) {
    emailResult = await sendWelcomeEmail({
      to: updated.email,
      firstName: parsed.data.firstName.trim(),
      businessName: updated.businessName,
      loanAmount: updated.loanAmount,
      score: scored.score,
      tier: scored.tier,
      leadId: updated.id,
    });

    await prisma.interaction.create({
      data: {
        leadId: updated.id,
        type: "EMAIL",
        direction: "OUTBOUND",
        subject: emailResult.simulated
          ? "Welcome email (simulated — Resend key missing)"
          : "Welcome email sent",
        content: emailResult.simulated
          ? `Email payload generated for ${emailResult.toUsed} but not delivered (no real RESEND_API_KEY). Demo continues.`
          : `Welcome + document-request email delivered to ${emailResult.toUsed}.`,
        outcome: emailResult.simulated ? "simulated" : "sent",
        metadata: {
          providerId: emailResult.providerId,
          simulated: emailResult.simulated,
          toUsed: emailResult.toUsed,
          error: emailResult.error,
        } satisfies Prisma.JsonObject,
      },
    });
  }

  // Fire workflows matching LEAD_CREATED + LEAD_SCORED (non-blocking for
  // response latency but awaited so the demo shows the chain in activity feed).
  const workflowRuns = await runWorkflowsForTrigger("LEAD_CREATED", {
    leadId: updated.id,
    score: scored.score,
    tier: scored.tier,
    status: updated.status,
  }).catch((e) => {
    console.warn("[workflow] LEAD_CREATED dispatch error:", e);
    return [];
  });

  const scoredRuns = await runWorkflowsForTrigger("LEAD_SCORED", {
    leadId: updated.id,
    score: scored.score,
    tier: scored.tier,
    status: updated.status,
  }).catch((e) => {
    console.warn("[workflow] LEAD_SCORED dispatch error:", e);
    return [];
  });

  return NextResponse.json(
    {
      leadId: updated.id,
      score: scored.score,
      tier: scored.tier,
      reasoning: scored.reasoning,
      status: updated.status,
      scoringSource: scored.source,
      email: emailResult
        ? {
            triggered: true,
            sent: emailResult.sent,
            simulated: emailResult.simulated,
            to: emailResult.toUsed,
          }
        : { triggered: false, reason: `score below threshold (${HIGH_SCORE_THRESHOLD})` },
      workflows: {
        triggered: workflowRuns.length + scoredRuns.length,
        runs: [...workflowRuns, ...scoredRuns].map((r) => ({ runId: r.runId, status: r.status })),
      },
      message: "Application received.",
    },
    { status: 201 },
  );
}
