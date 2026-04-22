import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Users, CheckCircle2, Percent, Banknote, ArrowRight, Plus } from "lucide-react";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LeadsAreaChart } from "@/components/dashboard/leads-area-chart";
import { StatusBadge, ScoreChip } from "@/components/dashboard/status-badge";
import {
  KPI,
  leadsOver30Days,
  leads,
  formatMoney,
  PRODUCT_LABEL,
} from "@/lib/demo/data";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const session = await auth();
  const recent = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-stat">
            Overview
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Here&rsquo;s what&rsquo;s happening across your pipeline in the last 30 days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-10">
            <Link href="/apply" target="_blank">
              <Plus className="h-4 w-4 mr-2" /> New lead form
            </Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" className="h-10 text-muted-foreground">
              Sign out
            </Button>
          </form>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total leads" value={String(KPI.totalLeads)} delta="+12 this week" icon={Users} />
        <KpiCard
          label="Qualified"
          value={String(KPI.qualifiedLeads)}
          delta="+6 this week"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Conversion"
          value={`${KPI.conversionPct}%`}
          delta="+3.2% vs last 30d"
          icon={Percent}
        />
        <KpiCard
          label="Pipeline"
          value={formatMoney(KPI.pipelineUsd)}
          delta="+$42K vs last 30d"
          icon={Banknote}
          accent
        />
      </div>

      {/* Chart + recent */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Leads over last 30 days</h2>
              <p className="text-sm text-muted-foreground">
                Total new leads vs. AI-qualified (score ≥ 70).
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <LegendDot color="var(--chart-1)" label="Leads" />
              <LegendDot color="var(--chart-2)" label="Qualified" />
            </div>
          </div>
          <LeadsAreaChart data={leadsOver30Days} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Top sources</h2>
          </div>
          <ul className="space-y-4">
            {[
              { label: "Website form", count: 58, pct: 46 },
              { label: "Referral", count: 41, pct: 32 },
              { label: "Google Ads", count: 18, pct: 14 },
              { label: "Lender partner", count: 10, pct: 8 },
            ].map((s) => (
              <li key={s.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-stat text-muted-foreground">{s.count}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent leads */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Recent leads</h2>
            <p className="text-sm text-muted-foreground">
              Latest five applications. Ordered by submission time.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/leads">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-muted-foreground">
              <tr className="text-left">
                <th className="px-6 py-3 font-medium">Business</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Product</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Score</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium hidden lg:table-cell">Created</th>
                <th className="px-6 py-3 w-10" aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {recent.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-background/60 transition">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/leads/${l.id}`} className="font-medium hover:text-accent">
                      {l.businessName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{l.ownerName}</div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                    {PRODUCT_LABEL[l.product]}
                  </td>
                  <td className="px-6 py-4 font-stat">{formatMoney(l.loanAmount)}</td>
                  <td className="px-6 py-4">
                    <ScoreChip score={l.score} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/leads/${l.id}`}
                      className="inline-flex items-center text-muted-foreground hover:text-foreground"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
