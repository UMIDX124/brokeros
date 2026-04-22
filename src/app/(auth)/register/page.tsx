import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create your broker account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          30-day free trial. No credit card required.
        </p>
      </div>

      <RegisterForm />

      <p className="text-sm text-muted-foreground text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:text-accent transition">
          Sign in
        </Link>
      </p>
    </div>
  );
}
