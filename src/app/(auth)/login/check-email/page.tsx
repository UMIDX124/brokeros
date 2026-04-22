import Link from "next/link";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <Mail className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a secure sign-in link. It expires in 15 minutes.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Didn&rsquo;t get it?{" "}
        <Link href="/login" className="font-medium text-foreground hover:text-accent transition">
          Try again
        </Link>
      </p>
    </div>
  );
}
