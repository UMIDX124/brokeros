import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&rsquo;ll email you a secure sign-in link. Click it, set a new password from settings.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-sm text-muted-foreground text-center">
        Remembered?{" "}
        <Link href="/login" className="font-medium text-foreground hover:text-accent transition">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
