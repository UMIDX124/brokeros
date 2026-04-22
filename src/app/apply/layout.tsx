import Link from "next/link";
import { Sparkles, ShieldCheck, Lock, Clock } from "lucide-react";

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            BrokerOS
          </Link>
          <div className="hidden sm:flex items-center gap-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Bank-grade encryption</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> No credit pull</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 3 minutes</span>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-background">{children}</main>
      <footer className="border-t border-border bg-surface py-6">
        <div className="mx-auto max-w-5xl px-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} BrokerOS · Bank-grade secure intake</div>
          <div className="font-stat">Powered by AI underwriting</div>
        </div>
      </footer>
    </div>
  );
}
