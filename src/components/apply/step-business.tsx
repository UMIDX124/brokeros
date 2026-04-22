"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorText } from "./error-text";
import {
  INDUSTRIES,
  REVENUE_BANDS,
  TIME_IN_BUSINESS,
  US_STATES,
  type ApplyInput,
} from "@/lib/leads/schema";

export function StepBusiness() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ApplyInput>();

  const state = watch("state");
  const industry = watch("industry");
  const timeInBusiness = watch("timeInBusiness");
  const revenue = watch("monthlyRevenueBand");

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Legal business name" required>
          <Input placeholder="Acme Trucking LLC" autoComplete="organization" {...register("legalName")} />
          <ErrorText message={errors.legalName?.message} />
        </Field>
        <Field label="DBA (optional)">
          <Input placeholder="Acme Fast Delivery" {...register("dba")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="State" required>
          <Select value={state} onValueChange={(v) => setValue("state", v as ApplyInput["state"], { shouldValidate: true })}>
            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Pick your state" /></SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorText message={errors.state?.message} />
        </Field>

        <Field label="Industry" required>
          <Select
            value={industry}
            onValueChange={(v) => setValue("industry", v as ApplyInput["industry"], { shouldValidate: true })}
          >
            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Pick an industry" /></SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorText message={errors.industry?.message} />
        </Field>
      </div>

      <Field label="How long have you been in business?" required>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TIME_IN_BUSINESS.map((t) => (
            <OptionButton
              key={t.value}
              active={timeInBusiness === t.value}
              onClick={() => setValue("timeInBusiness", t.value, { shouldValidate: true })}
            >
              {t.label}
            </OptionButton>
          ))}
        </div>
        <ErrorText message={errors.timeInBusiness?.message} />
      </Field>

      <Field label="Approximate monthly revenue" required>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REVENUE_BANDS.map((r) => (
            <OptionButton
              key={r.value}
              active={revenue === r.value}
              onClick={() => setValue("monthlyRevenueBand", r.value, { shouldValidate: true })}
            >
              {r.label}
            </OptionButton>
          ))}
        </div>
        <ErrorText message={errors.monthlyRevenueBand?.message} />
      </Field>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-muted-foreground"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border px-3 py-2.5 text-sm text-left transition " +
        (active
          ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
          : "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}
