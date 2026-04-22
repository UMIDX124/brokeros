import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            BrokerOS
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition">Features</Link>
            <Link href="#how" className="hover:text-foreground transition">How it works</Link>
            <Link href="#pricing" className="hover:text-foreground transition">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/apply">Get funded <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground mb-8">
            <Zap className="h-3 w-3 text-accent" />
            Built for SBA, MCA &amp; working-capital brokers
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground">
            The AI operating system <br className="hidden md:block" />
            <span className="text-accent">for modern loan brokers.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Capture leads, score them with AI, auto-follow-up, collect documents, and close more deals —
            all from one beautiful dashboard your team will actually use.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-6 text-base">
              <Link href="/apply">Start a loan application <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link href="/login">Broker sign-in</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground font-stat">
            ⚡️ Phase 1 scaffold &middot; Hearth Mode theme live
          </p>
        </section>

        <section id="features" className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: "AI lead scoring", body: "Every lead is scored 0–100 the moment it lands. You see the highest-intent borrowers first." },
              { icon: TrendingUp, title: "Revenue dashboard", body: "Closed deals, cost per close, average deal size, AI hours saved — in dollars, not vanity metrics." },
              { icon: Zap, title: "Automations that close", body: "High-score leads get an instant, personalized outreach + doc request. You just review approvals." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-background p-8">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} BrokerOS. Built for brokers.</div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="mailto:hello@brokeros.app" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
