"use client";

import { useFormContext } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorText } from "./error-text";
import {
  USE_OF_FUNDS,
  FUNDING_TIMELINE,
  CREDIT_RANGES,
  type ApplyInput,
} from "@/lib/leads/schema";

const MIN = 10_000;
const MAX = 5_000_000;

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 1_500_000 ? 1 : 2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function StepFunding() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ApplyInput>();

  const amount = watch("loanAmount") ?? 75_000;
  const useOfFunds = watch("useOfFunds");
  const timeline = watch("fundingTimeline");
  const credit = watch("creditScoreRange");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <Label className="text-sm font-medium">How much funding do you need?</Label>
          <span className="font-stat text-3xl font-semibold text-accent">
            {formatMoney(amount)}
          </span>
        </div>
        <Slider
          value={[amount]}
          min={MIN}
          max={MAX}
          step={5_000}
          onValueChange={(v) => setValue("loanAmount", v[0] ?? MIN, { shouldValidate: true })}
        />
        <div className="flex justify-between text-xs text-muted-foreground font-stat">
          <span>{formatMoney(MIN)}</span>
          <span>{formatMoney(MAX)}</span>
        </div>
        <ErrorText message={errors.loanAmount?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Primary use of funds *</Label>
          <Select
            value={useOfFunds}
            onValueChange={(v) => setValue("useOfFunds", v as ApplyInput["useOfFunds"], { shouldValidate: true })}
          >
            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Pick one" /></SelectTrigger>
            <SelectContent>
              {USE_OF_FUNDS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorText message={errors.useOfFunds?.message} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">When do you need the funds? *</Label>
          <Select
            value={timeline}
            onValueChange={(v) => setValue("fundingTimeline", v, { shouldValidate: true })}
          >
            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Pick a timeline" /></SelectTrigger>
            <SelectContent>
              {FUNDING_TIMELINE.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorText message={errors.fundingTimeline?.message} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Self-reported credit score range *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CREDIT_RANGES.map((c) => {
            const active = credit === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() =>
                  setValue("creditScoreRange", c.value as ApplyInput["creditScoreRange"], {
                    shouldValidate: true,
                  })
                }
                className={
                  "rounded-xl border px-3 py-2.5 text-sm transition " +
                  (active
                    ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground")
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          We don&rsquo;t run a hard credit pull — this helps us match you to the right lenders.
        </p>
        <ErrorText message={errors.creditScoreRange?.message} />
      </div>
    </div>
  );
}
