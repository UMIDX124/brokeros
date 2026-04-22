import Groq from "groq-sdk";
import { hasRealKey } from "@/lib/env";

export type LeadTier = "HOT" | "WARM" | "COOL" | "COLD";

export type ScoreInput = {
  businessName: string;
  industry: string;
  monthlyRevenue: number;
  timeInBusinessMonths: number;
  loanAmount: number;
  loanPurpose: string;
  product: string;
  creditScoreRange:
    | "UNDER_600"
    | "SCORE_600_649"
    | "SCORE_650_699"
    | "SCORE_700_749"
    | "SCORE_750_PLUS"
    | "UNKNOWN";
  state: string;
};

export type ScoreResult = {
  score: number;
  tier: LeadTier;
  reasoning: string;
  recommendedProducts: string[];
  source: "groq" | "heuristic";
  modelUsed?: string;
  attempts?: number;
};

const SYSTEM_PROMPT = `You are an expert US small-business loan underwriter and broker. You score loan-broker leads on FUNDABILITY (not just preference): how likely is this borrower to be approved by a lender, and how good a fit are they for the requested product?

Score 0-100 using these weights:
- Time in business (24+ months strong, 12-24 marginal, <12 weak)
- Monthly revenue vs loan amount (DSCR-style: monthly revenue should comfortably support monthly debt service)
- Credit score range (700+ strong for SBA/LOC, 600-699 ok for working-capital, <600 only MCA-eligible)
- Industry risk (regulated/restricted industries score lower)
- Loan amount appropriateness for stated revenue

Tiers:
- 85-100 HOT — strong fundability, recommend immediate outreach
- 70-84 WARM — qualified, follow up within 24h
- 50-69 COOL — needs work, may suit MCA / non-prime products
- 0-49 COLD — unlikely to fund as requested

Respond with STRICT JSON only:
{
  "score": <int 0-100>,
  "tier": "HOT" | "WARM" | "COOL" | "COLD",
  "reasoning": "<2-3 sentences, broker-facing, plain English>",
  "recommended_products": ["SBA" | "MCA" | "EQUIPMENT" | "WORKING_CAPITAL" | "LINE_OF_CREDIT", ...]
}
No markdown, no preamble.`;

function tierFor(score: number): LeadTier {
  if (score >= 85) return "HOT";
  if (score >= 70) return "WARM";
  if (score >= 50) return "COOL";
  return "COLD";
}

function buildUserPrompt(input: ScoreInput): string {
  const yrs = (input.timeInBusinessMonths / 12).toFixed(1);
  return `Lead to score:
- Business: ${input.businessName}
- Industry: ${input.industry}
- State: ${input.state}
- Time in business: ${yrs} years (${input.timeInBusinessMonths} months)
- Monthly revenue: $${input.monthlyRevenue.toLocaleString()}
- Self-reported credit range: ${input.creditScoreRange}
- Loan amount requested: $${input.loanAmount.toLocaleString()}
- Product requested: ${input.product}
- Use of funds: ${input.loanPurpose}

Return your JSON now.`;
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function scoreWithGroq(input: ScoreInput): Promise<ScoreResult> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  if (!hasRealKey(apiKey)) {
    throw new Error("GROQ_API_KEY missing");
  }
  const client = new Groq({ apiKey });

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
      });

      const content = res.choices?.[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(content) as {
        score: number;
        tier?: LeadTier;
        reasoning?: string;
        recommended_products?: string[];
      };

      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
      return {
        score,
        tier: parsed.tier ?? tierFor(score),
        reasoning:
          (parsed.reasoning ?? "").trim() ||
          "Scored by AI underwriter; reasoning unavailable.",
        recommendedProducts: Array.isArray(parsed.recommended_products)
          ? parsed.recommended_products.slice(0, 5)
          : [],
        source: "groq",
        modelUsed: model,
        attempts: attempt,
      };
    } catch (err) {
      lastErr = err;
      if (attempt < 3) {
        await sleep(250 * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Groq scoring failed");
}

/** Heuristic fallback — never throws. Tuned to land near a sane underwriter. */
export function scoreHeuristic(input: ScoreInput): ScoreResult {
  let score = 40;

  // Time in business — up to 25 pts
  const months = input.timeInBusinessMonths;
  if (months >= 60) score += 25;
  else if (months >= 36) score += 20;
  else if (months >= 24) score += 15;
  else if (months >= 12) score += 8;
  else score -= 5;

  // Monthly revenue vs loan amount — up to 25 pts (very rough DSCR proxy)
  const annualRevenue = input.monthlyRevenue * 12;
  const ratio = annualRevenue / Math.max(1, input.loanAmount);
  if (ratio >= 4) score += 25;
  else if (ratio >= 2.5) score += 18;
  else if (ratio >= 1.5) score += 12;
  else if (ratio >= 1) score += 5;
  else score -= 8;

  // Credit
  switch (input.creditScoreRange) {
    case "SCORE_750_PLUS":
      score += 15;
      break;
    case "SCORE_700_749":
      score += 12;
      break;
    case "SCORE_650_699":
      score += 6;
      break;
    case "SCORE_600_649":
      score -= 2;
      break;
    case "UNDER_600":
      score -= 12;
      break;
    case "UNKNOWN":
    default:
      break;
  }

  // Min revenue gate
  if (input.monthlyRevenue < 8_000) score -= 10;
  if (input.monthlyRevenue < 3_000) score -= 15;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier = tierFor(score);

  const recommended: string[] = [];
  if (months >= 24 && score >= 70) recommended.push("SBA");
  if (months >= 6) recommended.push("WORKING_CAPITAL");
  if (input.product === "EQUIPMENT") recommended.push("EQUIPMENT");
  if (months >= 24 && input.creditScoreRange !== "UNDER_600") recommended.push("LINE_OF_CREDIT");
  if (input.creditScoreRange === "UNDER_600" || months < 12) recommended.push("MCA");
  const dedup = Array.from(new Set(recommended));

  const reasoning = [
    `${(months / 12).toFixed(1)} yrs in business with $${input.monthlyRevenue.toLocaleString()}/mo revenue.`,
    `Loan request is ${ratio.toFixed(1)}× annual revenue.`,
    `Credit signal: ${input.creditScoreRange.replace(/_/g, " ").toLowerCase()}.`,
    `Heuristic underwriter assigned ${tier} (score ${score}).`,
  ].join(" ");

  return {
    score,
    tier,
    reasoning,
    recommendedProducts: dedup.slice(0, 4),
    source: "heuristic",
    attempts: 0,
  };
}

/** Public entry point — never throws. Falls back to heuristic on any error. */
export async function scoreLead(input: ScoreInput): Promise<ScoreResult> {
  if (!hasRealKey(process.env.GROQ_API_KEY)) {
    return scoreHeuristic(input);
  }
  try {
    return await scoreWithGroq(input);
  } catch (err) {
    console.warn("[score-lead] Groq failed, using heuristic:", (err as Error)?.message);
    return scoreHeuristic(input);
  }
}
