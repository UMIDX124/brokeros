"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpDown, ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge, ScoreChip } from "@/components/dashboard/status-badge";
import {
  type DemoLead,
  type LeadStatus,
  STATUS_META,
  PRODUCT_LABEL,
  formatMoney,
} from "@/lib/demo/data";

type SortKey = "createdAt" | "score" | "loanAmount" | "businessName";
type SortDir = "asc" | "desc";

const STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "IN_APPLICATION",
  "CLOSED",
  "LOST",
];

export function LeadsTable({ leads }: { leads: DemoLead[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = leads;

    if (statusFilter !== "ALL") {
      out = out.filter((l) => l.status === statusFilter);
    }
    if (q) {
      out = out.filter((l) =>
        [l.businessName, l.ownerName, l.email, l.industry, l.id, l.city, l.state]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    const sign = sortDir === "asc" ? 1 : -1;
    return [...out].sort((a, b) => {
      if (sortKey === "createdAt") {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sign;
      }
      if (sortKey === "businessName") {
        return a.businessName.localeCompare(b.businessName) * sign;
      }
      return (a[sortKey] - b[sortKey]) * sign;
    });
  }, [leads, query, statusFilter, sortKey, sortDir]);

  const counts: Record<LeadStatus | "ALL", number> = useMemo(() => {
    const c = { ALL: leads.length } as Record<LeadStatus | "ALL", number>;
    for (const s of STATUSES) c[s] = 0;
    for (const l of leads) c[l.status] += 1;
    return c;
  }, [leads]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "businessName" ? "asc" : "desc");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search business, owner, email, industry…"
            className="pl-9 h-10 bg-surface"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPill
            label={`All (${counts.ALL})`}
            active={statusFilter === "ALL"}
            onClick={() => setStatusFilter("ALL")}
          />
          {STATUSES.map((s) => (
            <FilterPill
              key={s}
              label={`${STATUS_META[s].label} (${counts[s]})`}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-muted-foreground">
              <tr className="text-left">
                <SortableTh
                  label="Business"
                  active={sortKey === "businessName"}
                  dir={sortDir}
                  onClick={() => toggleSort("businessName")}
                />
                <th className="px-6 py-3 font-medium hidden md:table-cell">Product</th>
                <SortableTh
                  label="Amount"
                  active={sortKey === "loanAmount"}
                  dir={sortDir}
                  onClick={() => toggleSort("loanAmount")}
                />
                <SortableTh
                  label="Score"
                  active={sortKey === "score"}
                  dir={sortDir}
                  onClick={() => toggleSort("score")}
                />
                <th className="px-6 py-3 font-medium">Status</th>
                <SortableTh
                  label="Submitted"
                  className="hidden lg:table-cell"
                  active={sortKey === "createdAt"}
                  dir={sortDir}
                  onClick={() => toggleSort("createdAt")}
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-border hover:bg-background/60 transition cursor-pointer"
                  onClick={() => router.push(`/dashboard/leads/${l.id}`)}
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/leads/${l.id}`}
                      className="font-medium hover:text-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {l.businessName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {l.ownerName} &middot; {l.city}, {l.state}
                    </div>
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
                  <td className="px-6 py-4 hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-muted-foreground">
                      No leads match your filters.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("ALL");
                      }}
                    >
                      Clear filters
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-stat">
            Showing {filtered.length} of {leads.length}
          </span>
          <span className="font-stat">
            Sort: {sortKey} · {sortDir}
          </span>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs transition",
        active
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-surface border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={cn("px-6 py-3 font-medium", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 transition",
          active ? "text-foreground" : "hover:text-foreground",
        )}
      >
        {label}
        {active ? (
          <ChevronDown className={cn("h-3.5 w-3.5 transition", dir === "asc" && "rotate-180")} />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </th>
  );
}
