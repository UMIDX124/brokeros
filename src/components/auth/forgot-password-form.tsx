"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({ email: z.string().email("Enter a valid email") });

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await signIn("resend", {
          email: values.email.trim().toLowerCase(),
          redirect: false,
          callbackUrl: "/dashboard",
        });
        toast.success("Check your inbox for a secure sign-in link.");
        form.reset();
      } catch {
        toast.error("Couldn't send the reset link. Try again in a minute.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@brokerage.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={pending}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" /> Send me a sign-in link
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
