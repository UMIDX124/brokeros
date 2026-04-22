"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  applySchema,
  stepOneSchema,
  stepTwoSchema,
  stepThreeSchema,
  type ApplyInput,
} from "@/lib/leads/schema";
import { StepBusiness } from "./step-business";
import { StepFunding } from "./step-funding";
import { StepContact } from "./step-contact";

type FieldKeys = (keyof ApplyInput)[];

const STEP_FIELDS: FieldKeys[] = [
  ["legalName", "dba", "state", "industry", "timeInBusiness", "monthlyRevenueBand"] as FieldKeys,
  ["loanAmount", "useOfFunds", "fundingTimeline", "creditScoreRange"] as FieldKeys,
  ["firstName", "lastName", "email", "phone", "bestTimeToCall"] as FieldKeys,
];

const STEP_TITLES = [
  { eyebrow: "Step 1 of 3", title: "Business profile" },
  { eyebrow: "Step 2 of 3", title: "Funding need" },
  { eyebrow: "Step 3 of 3", title: "How can we reach you?" },
];

export function ApplyWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [submitting, startSubmit] = useTransition();

  const methods = useForm<ApplyInput>({
    mode: "onTouched",
    resolver: zodResolver(applySchema) as unknown as Resolver<ApplyInput>,
    defaultValues: {
      legalName: "",
      dba: "",
      state: undefined as unknown as ApplyInput["state"],
      industry: undefined as unknown as ApplyInput["industry"],
      timeInBusiness: undefined as unknown as ApplyInput["timeInBusiness"],
      monthlyRevenueBand: undefined as unknown as ApplyInput["monthlyRevenueBand"],
      loanAmount: 75_000,
      useOfFunds: undefined as unknown as ApplyInput["useOfFunds"],
      fundingTimeline: "WITHIN_30",
      creditScoreRange: undefined as unknown as ApplyInput["creditScoreRange"],
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bestTimeToCall: "",
      website: "", // honeypot — must stay empty for humans
      turnstileToken: "",
    },
  });

  const progress = useMemo(() => ((step + 1) / 3) * 100, [step]);

  async function next() {
    const fields = STEP_FIELDS[step] ?? [];
    const ok = await methods.trigger(fields, { shouldFocus: true });
    if (!ok) return;

    if (step < 2) {
      setDirection("forward");
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  function back() {
    if (step === 0) return;
    setDirection("back");
    setStep(step - 1);
  }

  function handleSubmit() {
    startSubmit(async () => {
      const values = methods.getValues();
      const parsed = applySchema.safeParse(values);
      if (!parsed.success) {
        toast.error("Please review the form — some fields need attention.");
        return;
      }

      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
            retryAfter?: number;
          };
          if (res.status === 429) {
            const wait = body.retryAfter ?? 60;
            toast.error(
              body.error ?? `Too many submissions. Please try again in ${wait} seconds.`,
            );
          } else {
            toast.error(body.error ?? "Something went wrong. Try again.");
          }
          return;
        }

        const body = (await res.json()) as {
          leadId: string;
          score: number;
          tier: "HOT" | "WARM" | "COOL" | "COLD";
        };

        toast.success(`Application received — scored ${body.score} (${body.tier}).`);
        const params = new URLSearchParams({
          lead: body.leadId,
          score: String(body.score),
          tier: body.tier,
        });
        router.push(`/apply/success?${params.toString()}`);
      } catch (err) {
        console.error(err);
        toast.error("Network error. Please try again in a moment.");
      }
    });
  }

  return (
    <FormProvider {...methods}>
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 pt-8 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-stat">
              {STEP_TITLES[step]?.eyebrow}
            </p>
            <span className="text-xs text-muted-foreground font-stat">
              {Math.round(progress)}% complete
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {STEP_TITLES[step]?.title}
          </h2>
          <Progress value={progress} className="mt-4 h-1.5" />
        </div>

        <form
          className="px-6 sm:px-8 pt-6 pb-8"
          onSubmit={(e) => {
            e.preventDefault();
            void next();
          }}
        >
          <div
            key={step}
            className={cn(
              "min-h-[420px]",
              direction === "forward" ? "animate-in slide-in-from-right-3 fade-in" : "animate-in slide-in-from-left-3 fade-in",
              "duration-200",
            )}
          >
            {step === 0 && <StepBusiness />}
            {step === 1 && <StepFunding />}
            {step === 2 && <StepContact />}
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 0 || submitting}
              className="sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition",
                    i <= step ? "bg-accent" : "bg-border",
                  )}
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scoring your file…
                </>
              ) : step === 2 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Submit application
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
        By submitting, you agree to our terms and consent to be contacted by a licensed broker.
        We never run a hard credit pull at this stage.
      </p>
    </FormProvider>
  );
}

// Re-export step schemas so step components can use them for client-side error UX
export { stepOneSchema, stepTwoSchema, stepThreeSchema };
