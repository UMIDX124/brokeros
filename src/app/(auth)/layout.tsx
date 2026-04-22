import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-[calc(100vh-1px)] bg-background">
      {/* Left: form */}
      <div className="flex-1 flex flex-col px-6 py-10 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-lg w-fit"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          BrokerOS
        </Link>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} BrokerOS · Built for brokers who close.
        </div>
      </div>
      {/* Right: pitch */}
      <div className="hidden md:flex flex-1 relative bg-primary text-primary-foreground p-12 flex-col justify-between">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--accent)/0.25,transparent_55%)]"
        />
        <div className="relative text-sm uppercase tracking-widest text-primary-foreground/60 font-stat">
          Loan broker OS
        </div>
        <div className="relative">
          <p className="text-3xl md:text-4xl font-semibold leading-tight">
            &ldquo;We replaced 6 tools in a week and closed 3 extra deals the first month.&rdquo;
          </p>
          <div className="mt-6 text-sm">
            <div className="font-medium">Marcus R.</div>
            <div className="text-primary-foreground/60">Principal broker, Phoenix AZ</div>
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/50 font-stat">
          Hearth Mode · Vercel · Neon · Groq
        </div>
      </div>
    </div>
  );
}
