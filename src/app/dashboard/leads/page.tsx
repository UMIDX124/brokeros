import type { Metadata } from "next";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { leads } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default function LeadsPage() {
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
      </div>

      <LeadsTable leads={leads} />
    </div>
  );
}
