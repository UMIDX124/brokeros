"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Users, CheckCircle2, Percent, Banknote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { LeadsAreaChart } from "@/components/dashboard/leads-area-chart";
import { StatusBadge, ScoreChip } from "@/components/dashboard/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Kpi = {
  totalLeads: number;
  qualifiedLeads: number;
  conversionPct: number;
  pipelineUsd: number;
  closedRevenue: number;
  openPipeline: number;
  series: { date: string; leads: number; qualified: number }[];
};

type RecentLead = {
  id: string;
  businessName: string;
  ownerName: string | null;
  email: string;
  product: string;
  loanAmount: number;
  score: number | null;
  status:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "IN_APPLICATION"
    | "CLOSED"
    | "LOST";
  source: string | null;
  createdAt: string;
};

const PRODUCT_LABEL: Record<string, string> = {
  SBA: "SBA",
  MCA: "MCA",
  EQUIPMENT: "Equipment",
  WORKING_CAPITAL: "Working capital",
  LINE_OF_CREDIT: "Line of credit",
  OTHER: "Other",
};

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `$${n}`;
}

export function LiveDashboard() {
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [recent, setRecent] = useState<RecentLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justArrivedId, setJustArrivedId] = useState<string | null>(null);

  const knownIds = useRef<Set<string>>(new Set());
  const seenFirstFetch = useRef(false);

  async function refresh() {
    try {
      const [kpiRes, recentRes] = await Promise.all([
        fetch("/api/leads/kpi", { cache: "no-store" }),
        fetch("/api/leads/recent?limit=10", { cache: "no-store" }),
      ]);
      if (!kpiRes.ok || !recentRes.ok) {
        throw new Error(`HTTP ${kpiRes.status}/${recentRes.status}`);
      }
      const kpiData = (await kpiRes.json()) as Kpi;
      const recentData = (await recentRes.json()) as { leads: RecentLead[] };

      setKpi(kpiData);
      setRecent(recentData.leads);
      setError(null);

      if (seenFirstFetch.current) {
        for (const l of recentData.leads) {
          if (!knownIds.current.has(l.id)) {
            toast.success(
              `New lead: ${l.businessName}${l.score !== null ? ` · scored ${l.score}` : ""}`,
              { description: PRODUCT_LABEL[l.product] ?? l.product, duration: 6000 },
            );
            setJustArrivedId(l.id);
            setTimeout(() => setJustArrivedId(null), 4000);
          }
        }
      }
      knownIds.current = new Set(recentData.leads.map((l) => l.id));
      seenFirstFetch.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, 5_000);
    return () => clearInterval(t);
  }, []);

  if (error && !kpi) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Couldn&rsquo;t load dashboard data</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => void refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi ? (
          <>
            <KpiCard label="Total leads" value={String(kpi.totalLeads)} icon={Users} />
            <KpiCard
              label="Qualified"
              value={String(kpi.qualifiedLeads)}
              icon={CheckCircle2}
              delta={`${kpi.totalLeads === 0 ? 0 : Math.round((kpi.qualifiedLeads / kpi.totalLeads) * 100)}% of total`}
              deltaTone="muted"
            />
            <KpiCard
              label="Conversion"
              value={`${kpi.conversionPct}%`}
              icon={Percent}
              delta="Closed / Total"
              deltaTone="muted"
            />
            <KpiCard
              label="Pipeline"
              value={formatMoney(kpi.pipelineUsd)}
              icon={Banknote}
              accent
              delta={`${formatMoney(kpi.closedRevenue)} closed + ${formatMoney(kpi.openPipeline)} open`}
              deltaTone="muted"
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        )}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Leads over last 30 days</h2>
            <p className="text-sm text-muted-foreground">
              Live from your database. Polled every 5 seconds.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <LegendDot color="var(--chart-1)" label="Leads" />
            <LegendDot color="var(--chart-2)" label="Qualified (≥70)" />
          </div>
        </div>
        {kpi ? <LeadsAreaChart data={kpi.series} /> : <Skeleton className="h-72 w-full" />}
      </div>

      {/* Recent */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Recent leads</h2>
            <p className="text-sm text-muted-foreground">
              Newest first — updates as applications land.
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
                <th className="px-6 py-3 font-medium hidden lg:table-cell">Submitted</th>
                <th className="px-6 py-3 w-10" aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {recent === null &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-6 py-4" colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))}

              {recent?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      No leads yet. Share{" "}
                      <Link href="/apply" className="underline text-foreground">
                        /apply
                      </Link>{" "}
                      to start capturing.
                    </p>
                  </td>
                </tr>
              )}

              {recent?.slice(0, 5).map((l) => (
                <tr
                  key={l.id}
                  className={cn(
                    "border-t border-border hover:bg-background/60 transition",
                    justArrivedId === l.id && "bg-accent/5 animate-in fade-in duration-500",
                  )}
                >
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/leads/${l.id}`} className="font-medium hover:text-accent">
                      {l.businessName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{l.ownerName}</div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                    {PRODUCT_LABEL[l.product] ?? l.product}
                  </td>
                  <td className="px-6 py-4 font-stat">{formatMoney(l.loanAmount)}</td>
                  <td className="px-6 py-4">
                    {l.score !== null ? <ScoreChip score={l.score} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                  <td className="px-6 py-4 hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/leads/${l.id}`} className="text-muted-foreground hover:text-foreground">
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
