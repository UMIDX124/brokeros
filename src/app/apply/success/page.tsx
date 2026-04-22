import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Calendar, ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Application received",
};

type Search = {
  lead?: string;
  score?: string;
  tier?: "HOT" | "WARM" | "COOL" | "COLD";
};

const TIER_COPY: Record<NonNullable<Search["tier"]>, { label: string; body: string; tone: string }> = {
  HOT: {
    label: "Hot lead",
    body: "Your file looks strong. Expect a call from a licensed broker within a few hours.",
    tone: "bg-success/15 text-success",
  },
  WARM: {
    label: "Warm lead",
    body: "You qualify for several lenders. A broker will call within 1 business day to walk through options.",
    tone: "bg-accent/15 text-accent",
  },
  COOL: {
    label: "Under review",
    body: "We may have non-prime options that fit. A broker will reach out within 1–2 business days.",
    tone: "bg-muted text-muted-foreground",
  },
  COLD: {
    label: "Under review",
    body: "We&rsquo;ll review your file against our lender network and follow up with options if we find a fit.",
    tone: "bg-muted text-muted-foreground",
  },
};

export default async function ApplySuccessPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const leadId = sp.lead ?? "—";
  const score = sp.score ? Number(sp.score) : undefined;
  const tier = sp.tier ?? "WARM";
  const copy = TIER_COPY[tier];

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-14 sm:py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground font-stat">
        Application received
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
        You&rsquo;re in — we&rsquo;ll call within 24 hours.
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Our AI underwriter scored your file in seconds. A licensed broker will call you at the time you
        picked to walk through lender options.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-left space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-stat">Reference</div>
            <div className="mt-1 font-stat text-sm">{leadId}</div>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${copy.tone}`}>
            {copy.label}{score !== undefined ? ` · ${score}/100` : ""}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{copy.body}</p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Button size="lg" className="h-12 bg-accent text-accent-foreground hover:bg-accent/90" disabled>
          <Calendar className="h-4 w-4 mr-2" /> Book a call slot
          <span className="ml-2 text-xs text-accent-foreground/70">(coming soon)</span>
        </Button>
        <Button size="lg" variant="outline" className="h-12" disabled>
          <Upload className="h-4 w-4 mr-2" /> Upload documents
          <span className="ml-2 text-xs text-muted-foreground">(secure link emailed)</span>
        </Button>
      </div>

      <div className="mt-10 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center hover:text-foreground">
          Back to home <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
