import Link from "next/link";
import type { Metadata } from "next";
import { Copy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { LeadsEmptyState } from "@/components/dashboard/leads-empty-state";
import type { LoanProduct } from "@prisma/client";
import type { DemoLead, LeadStatus, LoanProduct as DemoLoanProduct } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

function toTableRow(l: {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  industry: string;
  product: LoanProduct;
  loanAmount: number;
  monthlyRevenue: number;
  timeInBusinessMonths: number;
  creditScoreRange: DemoLead["creditScoreRange"];
  loanPurpose: string;
  score: number | null;
  scoreReason: string | null;
  status: LeadStatus;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: unknown;
}): DemoLead {
  const meta = (l.metadata ?? {}) as { state?: string };
  return {
    id: l.id,
    businessName: l.businessName,
    ownerName: l.ownerName,
    email: l.email,
    phone: l.phone,
    industry: l.industry,
    product: l.product as DemoLoanProduct,
    loanAmount: l.loanAmount,
    monthlyRevenue: l.monthlyRevenue,
    timeInBusinessMonths: l.timeInBusinessMonths,
    creditScoreRange: l.creditScoreRange,
    loanPurpose: l.loanPurpose,
    score: l.score ?? 0,
    scoreReason: l.scoreReason ?? "",
    status: l.status,
    source: l.source ?? "Unknown",
    city: "",
    state: meta.state ?? "—",
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  const rows = leads.map(toTableRow);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-stat">Pipeline</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-2 text-muted-foreground">
            All applications — sortable, searchable, and filterable by pipeline stage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-10">
            <Link href="/apply" target="_blank">
              <Copy className="h-4 w-4 mr-2" /> Open apply form
            </Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? <LeadsEmptyState /> : <LeadsTable leads={rows} />}
    </div>
  );
}
