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
import { BEST_TIME_TO_CALL, type ApplyInput } from "@/lib/leads/schema";

export function StepContact() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ApplyInput>();

  const time = watch("bestTimeToCall");

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" required>
          <Input placeholder="Alex" autoComplete="given-name" {...register("firstName")} />
          <ErrorText message={errors.firstName?.message} />
        </Field>
        <Field label="Last name" required>
          <Input placeholder="Rivera" autoComplete="family-name" {...register("lastName")} />
          <ErrorText message={errors.lastName?.message} />
        </Field>
      </div>

      <Field label="Work email" required>
        <Input type="email" placeholder="alex@business.com" autoComplete="email" {...register("email")} />
        <ErrorText message={errors.email?.message} />
      </Field>

      <Field label="Phone number" required>
        <Input type="tel" placeholder="(415) 555-0132" autoComplete="tel" {...register("phone")} />
        <ErrorText message={errors.phone?.message} />
      </Field>

      <Field label="Best time to call" required>
        <Select
          value={time}
          onValueChange={(v) => setValue("bestTimeToCall", v, { shouldValidate: true })}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Pick a time window" />
          </SelectTrigger>
          <SelectContent>
            {BEST_TIME_TO_CALL.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ErrorText message={errors.bestTimeToCall?.message} />
      </Field>

      <div className="rounded-xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground leading-relaxed">
        We&rsquo;ll use this to connect you with a licensed broker within 1 business day. Your info is
        encrypted in transit and at rest, and never shared without consent.
      </div>
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
