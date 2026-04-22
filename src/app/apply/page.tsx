import type { Metadata } from "next";
import { ApplyWizard } from "@/components/apply/apply-wizard";

export const metadata: Metadata = {
  title: "Apply for funding",
  description:
    "Get a soft offer in 48–72 hours. Bank-grade secure, no credit pull, 3-minute application.",
};

export default function ApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-stat mb-3">
          Get funded
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Tell us about your business.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Three steps. About 3 minutes. We&rsquo;ll AI-score your file the second you submit.
        </p>
      </div>

      <ApplyWizard />
    </div>
  );
}
