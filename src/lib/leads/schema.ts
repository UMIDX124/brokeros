import { z } from "zod";

export const INDUSTRIES = [
  "Construction & trades",
  "Food & beverage",
  "Healthcare",
  "Professional services",
  "Retail",
  "Transportation & logistics",
  "Manufacturing",
  "Agriculture",
  "Automotive",
  "Wholesale",
  "Fitness",
  "Landscaping",
  "Hospitality",
  "Other",
] as const;

export const REVENUE_BANDS = [
  { value: "UNDER_10K", label: "Under $10K / mo", midpoint: 5_000 },
  { value: "BETWEEN_10K_25K", label: "$10K – $25K / mo", midpoint: 17_500 },
  { value: "BETWEEN_25K_50K", label: "$25K – $50K / mo", midpoint: 37_500 },
  { value: "BETWEEN_50K_100K", label: "$50K – $100K / mo", midpoint: 75_000 },
  { value: "BETWEEN_100K_250K", label: "$100K – $250K / mo", midpoint: 175_000 },
  { value: "OVER_250K", label: "Over $250K / mo", midpoint: 350_000 },
] as const;

export const TIME_IN_BUSINESS = [
  { value: "UNDER_6", label: "Under 6 months", months: 3 },
  { value: "BETWEEN_6_12", label: "6 – 12 months", months: 9 },
  { value: "BETWEEN_12_24", label: "1 – 2 years", months: 18 },
  { value: "BETWEEN_24_60", label: "2 – 5 years", months: 42 },
  { value: "OVER_60", label: "5+ years", months: 84 },
] as const;

export const USE_OF_FUNDS = [
  "Working capital",
  "Equipment purchase",
  "Inventory",
  "Hiring / payroll",
  "Marketing",
  "Expansion / new location",
  "Real estate",
  "Refinance existing debt",
  "Other",
] as const;

export const FUNDING_TIMELINE = [
  { value: "ASAP", label: "ASAP (within a week)" },
  { value: "WITHIN_30", label: "Within 30 days" },
  { value: "WITHIN_90", label: "Within 90 days" },
  { value: "EXPLORING", label: "Just exploring options" },
] as const;

export const CREDIT_RANGES = [
  { value: "SCORE_750_PLUS", label: "750 +" },
  { value: "SCORE_700_749", label: "700 – 749" },
  { value: "SCORE_650_699", label: "650 – 699" },
  { value: "SCORE_600_649", label: "600 – 649" },
  { value: "UNDER_600", label: "Under 600" },
  { value: "UNKNOWN", label: "Not sure" },
] as const;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA",
  "RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC","PR",
] as const;

export const stepOneSchema = z.object({
  legalName: z.string().min(2, "Required"),
  dba: z.string().optional().or(z.literal("")),
  state: z.enum(US_STATES, { message: "Pick your state" }),
  industry: z.enum(INDUSTRIES, { message: "Pick an industry" }),
  timeInBusiness: z.enum(TIME_IN_BUSINESS.map((t) => t.value) as [string, ...string[]], {
    message: "Pick a time range",
  }),
  monthlyRevenueBand: z.enum(
    REVENUE_BANDS.map((r) => r.value) as [string, ...string[]],
    { message: "Pick a revenue range" },
  ),
});

export const stepTwoSchema = z.object({
  loanAmount: z.coerce
    .number({ message: "Pick an amount" })
    .min(10_000, "Minimum $10,000")
    .max(5_000_000, "Maximum $5,000,000"),
  useOfFunds: z.enum(USE_OF_FUNDS, { message: "Pick a use of funds" }),
  fundingTimeline: z.enum(
    FUNDING_TIMELINE.map((t) => t.value) as [string, ...string[]],
    { message: "Pick a timeline" },
  ),
  creditScoreRange: z.enum(
    CREDIT_RANGES.map((c) => c.value) as [string, ...string[]],
    { message: "Pick a credit range" },
  ),
});

export const stepThreeSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(7, "Enter a phone number")
    .regex(/[\d() +\-.]+/, "Digits only please"),
  bestTimeToCall: z.string().min(1, "Pick a time"),
  // Honeypot — real users never see or touch this. Bots auto-fill every input.
  // Zod allows empty; server rejects any non-empty value silently.
  website: z.string().optional(),
  // Cloudflare Turnstile token captured client-side; server verifies.
  // Optional because keys may not be configured (bypass path preserves demo safety).
  turnstileToken: z.string().optional(),
});

export const applySchema = stepOneSchema.merge(stepTwoSchema).merge(stepThreeSchema);
export type ApplyInput = z.infer<typeof applySchema>;

export const BEST_TIME_TO_CALL = [
  "Morning (8am – 12pm)",
  "Afternoon (12pm – 5pm)",
  "Evening (5pm – 8pm)",
  "Anytime",
] as const;

/** Convert wizard payload into the Lead-shape the DB expects. */
export function applyToLead(input: ApplyInput) {
  const revenue =
    REVENUE_BANDS.find((r) => r.value === input.monthlyRevenueBand)?.midpoint ?? 25_000;
  const months =
    TIME_IN_BUSINESS.find((t) => t.value === input.timeInBusiness)?.months ?? 24;

  return {
    businessName: input.dba?.trim() ? input.dba.trim() : input.legalName.trim(),
    legalName: input.legalName.trim(),
    ownerName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    loanAmount: Math.round(input.loanAmount),
    monthlyRevenue: revenue,
    timeInBusinessMonths: months,
    industry: input.industry,
    loanPurpose: input.useOfFunds,
    creditScoreRange: input.creditScoreRange as
      | "UNDER_600"
      | "SCORE_600_649"
      | "SCORE_650_699"
      | "SCORE_700_749"
      | "SCORE_750_PLUS"
      | "UNKNOWN",
    state: input.state,
    bestTimeToCall: input.bestTimeToCall,
    fundingTimeline: input.fundingTimeline,
  };
}
