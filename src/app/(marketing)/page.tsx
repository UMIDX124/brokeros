import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Zap,
  Mail,
  FileText,
  Gauge,
  ShieldCheck,
  Brain,
  Clock,
  CheckCircle2,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--accent)/0.08,transparent_50%)]"
        />
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground mb-8">
            <Zap className="h-3 w-3 text-accent" />
            For SBA · MCA · Equipment · Working-capital brokers
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.05]">
            Turn loan applications <br className="hidden md:block" />
            into <span className="text-accent">closed deals.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            BrokerOS captures leads, scores them with AI, follows up automatically, collects documents,
            and shows you the dollars you&rsquo;re closing — all from one dashboard your team will actually use.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-6 text-base shadow-sm"
            >
              <Link href="/apply">
                Start a loan application
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link href="/login">Broker sign-in</Link>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <SocialProof label="Live on Neon + Vercel" />
            <SocialProof label="SOC 2-ready stack" />
            <SocialProof label="US-hosted data" />
            <SocialProof label="Built for closers" />
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="mx-auto max-w-5xl px-6 -mt-8 md:-mt-12">
          <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-background">
              <div className="h-2.5 w-2.5 rounded-full bg-[#E8E6E1]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#E8E6E1]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#E8E6E1]" />
              <div className="ml-3 text-xs text-muted-foreground font-stat">app.brokeros.io/dashboard</div>
            </div>
            <div className="grid md:grid-cols-4 gap-4 p-6">
              <PreviewKpi label="New leads" value="47" delta="+12" />
              <PreviewKpi label="Closed this month" value="$284K" delta="+18%" accent />
              <PreviewKpi label="Qualified" value="31" delta="+6" />
              <PreviewKpi label="Avg deal size" value="$23.6K" delta="+$2.1K" />
            </div>
            <div className="px-6 pb-6">
              <div className="rounded-xl border border-border overflow-hidden">
                {[
                  { biz: "Desert Sun Landscaping", amt: "$120,000", score: 94, stage: "In application" },
                  { biz: "Harbor Point Cafe", amt: "$45,000", score: 87, stage: "Docs requested" },
                  { biz: "Pillar Logistics LLC", amt: "$280,000", score: 81, stage: "Qualified" },
                  { biz: "Vera Dental Group", amt: "$65,000", score: 72, stage: "Contacted" },
                ].map((r, i) => (
                  <div
                    key={r.biz}
                    className={`grid grid-cols-[1fr_120px_80px_140px] items-center px-4 py-3 text-sm ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div className="font-medium truncate">{r.biz}</div>
                    <div className="font-stat text-muted-foreground">{r.amt}</div>
                    <ScoreChip score={r.score} />
                    <Badge variant="secondary" className="w-fit">{r.stage}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section className="border-t border-border mt-20 md:mt-28">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-stat mb-4">
            The brokerage problem
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Your pipeline is a spreadsheet, <br />
            your inbox is your CRM, <br />
            and the best leads go cold.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Modern brokers are expected to quote SBAs, MCAs, equipment loans, and working capital — all
            while juggling lenders, underwriters, and a constant stream of half-qualified leads. BrokerOS
            replaces 6 tools and a hundred follow-up reminders with a single system that scores, contacts,
            and closes for you.
          </p>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-stat mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Built for how brokers <span className="text-accent">actually work.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Brain}
              title="AI lead scoring"
              body="Every lead is scored 0–100 the moment it lands — based on revenue, time in business, loan-fit, and credit signals. See your highest-intent borrowers first."
            />
            <FeatureCard
              icon={Mail}
              title="Automated outreach"
              body="High-score leads get a personalized welcome + document request email within seconds. No more leaving money on the table while you&rsquo;re in a meeting."
            />
            <FeatureCard
              icon={FileText}
              title="Secure document collection"
              body="Borrowers upload bank statements, tax returns, and voided checks via secure one-time links. OCR-ready, audit-friendly."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Revenue dashboard"
              body="Closed deals, cost per close, average deal size, AI hours saved. Numbers in dollars — not vanity clicks."
            />
            <FeatureCard
              icon={Gauge}
              title="Pipeline that never sleeps"
              body="Kanban stages from new lead to funded. Drag, drop, filter, and never lose track of a $50K deal again."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Compliance-friendly"
              body="US-hosted data on Neon + Vercel, TLS everywhere, role-based access, and audit logs. Your lenders will thank you."
            />
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-stat mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              From lead to funded — <span className="text-accent">automated.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <Step
              n={1}
              title="Capture"
              body="Embed the BrokerOS application form on your site. Borrowers fill it in under 3 minutes."
            />
            <Step
              n={2}
              title="Score"
              body="Groq-powered AI scores the lead 0–100 in seconds, with a written rationale."
            />
            <Step
              n={3}
              title="Follow up"
              body="Above 70? Instant branded email with a document-upload link. Below? Queued for you."
            />
            <Step
              n={4}
              title="Close"
              body="Documents collected, lender matched, pipeline tracked, revenue logged. Rinse, repeat."
            />
          </div>
        </div>
      </section>

      {/* ─── Testimonials placeholder ─── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-stat mb-3">
              Early access
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Loved by brokers who <span className="text-accent">close.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "We replaced our spreadsheet + Mailchimp + HelloSign stack in a week. First month we closed 3 extra deals just from leads we would have forgotten.",
                name: "Marcus R.",
                role: "Principal broker, Phoenix AZ",
              },
              {
                quote:
                  "The AI scoring is the killer feature. I know which leads to call first and which ones can wait — and I&rsquo;m never wrong.",
                name: "Ariana S.",
                role: "Owner, Working-capital broker",
              },
              {
                quote:
                  "Finally a CRM that speaks broker, not generic real-estate. The SBA workflow alone paid for it.",
                name: "Derek L.",
                role: "VP, Equipment finance brokerage",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-background p-8">
                <Quote className="h-6 w-6 text-accent mb-4" />
                <p className="text-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 text-sm">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Early-access testimonials shown for illustration. Real customer quotes land after GA.
          </p>
        </div>
      </section>

      {/* ─── Pricing tease ─── */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-stat mb-3">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Simple pricing. <span className="text-accent">Close one deal, it pays for the year.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              name="Solo"
              price="$199"
              cadence="/mo"
              body="For the one-broker shop. Everything you need to stop losing leads."
              cta="Start free trial"
              features={[
                "Up to 500 leads / mo",
                "AI scoring + auto outreach",
                "Secure document collection",
                "1 user seat",
              ]}
            />
            <PricingCard
              name="Team"
              price="$499"
              cadence="/mo"
              body="For brokerages with 2–10 agents. Shared pipeline, roles, and audit logs."
              cta="Start free trial"
              highlight
              features={[
                "Up to 5,000 leads / mo",
                "Everything in Solo",
                "Role-based access",
                "Up to 10 user seats",
                "Priority email support",
              ]}
            />
            <PricingCard
              name="Brokerage"
              price="Talk to us"
              cadence=""
              body="For multi-office shops and platforms. White-label, SSO, custom lenders."
              cta="Book a demo"
              features={[
                "Unlimited leads",
                "Everything in Team",
                "White-label + SSO",
                "Custom lender integrations",
                "Dedicated success manager",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Your next closed deal is <span className="text-accent">one form away.</span>
          </h2>
          <p className="mt-6 text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            Spin up your broker dashboard in under 5 minutes. First 30 days free — no card required.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-6 text-base"
            >
              <Link href="/register">
                Start free trial <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-primary-foreground/60 flex-wrap">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-accent" /> No credit card</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-accent" /> 5-minute setup</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-accent" /> Cancel anytime</span>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function SocialProof({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
      <span>{label}</span>
    </div>
  );
}

function PreviewKpi({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`mt-2 text-2xl font-semibold font-stat ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs font-stat text-success">{delta}</div>
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-success/10 text-success" : score >= 60 ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground";
  return (
    <div className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-stat font-semibold ${color}`}>
      {score}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-8">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="text-sm font-semibold font-stat text-accent">0{n}.</div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  cadence,
  body,
  cta,
  features,
  highlight,
}: {
  name: string;
  price: string;
  cadence: string;
  body: string;
  cta: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-8 flex flex-col ${
        highlight
          ? "bg-primary text-primary-foreground shadow-md ring-1 ring-accent/40"
          : "border border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        {highlight && (
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">Most popular</Badge>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-semibold font-stat">{price}</span>
        <span className={highlight ? "text-primary-foreground/60" : "text-muted-foreground"}>
          {cadence}
        </span>
      </div>
      <p className={`mt-3 text-sm ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        {body}
      </p>
      <ul className="mt-6 space-y-2 text-sm flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckCircle2
              className={`h-4 w-4 mt-0.5 shrink-0 ${highlight ? "text-accent" : "text-success"}`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        className={`mt-6 h-11 ${
          highlight
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        <Link href="/register">{cta}</Link>
      </Button>
    </div>
  );
}
