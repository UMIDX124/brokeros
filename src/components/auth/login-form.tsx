"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [pending, startTransition] = useTransition();
  const [magicLoading, setMagicLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: values.email.toLowerCase(),
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password.");
        return;
      }
      toast.success("Welcome back.");
      router.push(callbackUrl);
      router.refresh();
    });
  }

  async function sendMagicLink() {
    const email = form.getValues("email").trim().toLowerCase();
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      form.setError("email", { message: "Enter your email above first" });
      return;
    }
    setMagicLoading(true);
    try {
      await signIn("resend", { email, redirect: false, callbackUrl });
      toast.success("Magic link sent. Check your inbox.");
    } catch {
      toast.error("Couldn't send the magic link. Try again in a minute.");
    } finally {
      setMagicLoading(false);
    }
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
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
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>

        <div className="relative py-2">
          <Separator />
          <span className="absolute inset-0 grid place-items-center">
            <span className="bg-background px-2 text-xs text-muted-foreground">or</span>
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11"
          onClick={sendMagicLink}
          disabled={magicLoading}
        >
          {magicLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" /> Email me a magic link
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
