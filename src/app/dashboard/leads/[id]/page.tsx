import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, ScoreChip } from "@/components/dashboard/status-badge";
import { LeadInteractions } from "@/components/dashboard/lead-interactions";
import { LeadDocuments } from "@/components/dashboard/lead-documents";
import { LeadTimeline } from "@/components/dashboard/lead-timeline";
import {
  getLeadById,
  getInteractions,
  getDocuments,
  PRODUCT_LABEL,
  formatMoney,
} from "@/lib/demo/data";

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await props.params;
  const lead = getLeadById(id);
  return { title: lead ? `${lead.businessName}` : "Lead not found" };
}

export default async function LeadDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const lead = getLeadById(id);
  if (!lead) notFound();

  const interactions = getInteractions(id);
  const documents = getDocuments(id);
  const creditLabel: Record<typeof lead.creditScoreRange, string> = {
    UNDER_600: "Under 600",
    SCORE_600_649: "600–649",
    SCORE_650_699: "650–699",
    SCORE_700_749: "700–749",
    SCORE_750_PLUS: "750+",
    UNKNOWN: "Not provided",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-8 py-8 md:py-10 space-y-6">
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> All leads
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-stat text-muted-foreground">
              <span>{lead.id}</span>
              <span>•</span>
              <span>{PRODUCT_LABEL[lead.product]}</span>
              <span>•</span>
              <span>{lead.source}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {lead.businessName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> {lead.industry}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {lead.city}, {lead.state}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />{" "}
                Submitted {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-stat">AI score</div>
              <div className="mt-1"><ScoreChip score={lead.score} /></div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-stat">Status</div>
              <div className="mt-1"><StatusBadge status={lead.status} /></div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBlock
            icon={DollarSign}
            label="Loan amount"
            value={formatMoney(lead.loanAmount)}
          />
          <StatBlock
            icon={TrendingUp}
            label="Monthly revenue"
            value={formatMoney(lead.monthlyRevenue)}
          />
          <StatBlock
            icon={Clock}
            label="Time in business"
            value={`${Math.floor(lead.timeInBusinessMonths / 12)} yrs ${lead.timeInBusinessMonths % 12} mo`}
          />
          <StatBlock
            icon={TrendingUp}
            label="Credit range"
            value={creditLabel[lead.creditScoreRange]}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="interactions">Interactions ({interactions.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border border-border bg-surface p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">AI score rationale</h2>
                <p className="mt-1 text-xs text-muted-foreground font-stat">
                  Generated by Groq llama-3.3-70b at submission.
                </p>
                <div className="mt-4 rounded-xl border border-border bg-background p-4 flex gap-4 items-start">
                  <ScoreChip score={lead.score} />
                  <p className="text-sm leading-relaxed flex-1">{lead.scoreReason}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold">Loan request</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Product" value={PRODUCT_LABEL[lead.product]} />
                  <InfoRow label="Amount requested" value={formatMoney(lead.loanAmount)} />
                  <InfoRow label="Monthly revenue" value={formatMoney(lead.monthlyRevenue)} />
                  <InfoRow
                    label="Time in business"
                    value={`${Math.floor(lead.timeInBusinessMonths / 12)} yrs ${lead.timeInBusinessMonths % 12} mo`}
                  />
                  <InfoRow label="Credit range" value={creditLabel[lead.creditScoreRange]} />
                  <InfoRow label="Industry" value={lead.industry} />
                </dl>
                <div className="mt-4 rounded-xl border border-border bg-background p-4">
                  <div className="text-xs text-muted-foreground font-stat mb-1">Purpose of funds</div>
                  <p className="text-sm">{lead.loanPurpose}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <h2 className="text-lg font-semibold">Contact</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{lead.ownerName}</div>
                    <div className="text-xs text-muted-foreground">Owner</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="hover:text-accent break-all">
                    {lead.email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <a href={`tel:${lead.phone.replace(/\D/g, "")}`} className="hover:text-accent">
                    {lead.phone}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    {lead.city}, {lead.state}
                  </span>
                </li>
              </ul>

              <Separator />

              <div className="space-y-2">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Mail className="h-4 w-4 mr-2" /> Email borrower
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" /> Log call
                </Button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Last activity {format(new Date(lead.updatedAt), "MMM d, yyyy 'at' p")}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <LeadDocuments documents={documents} />
        </TabsContent>

        <TabsContent value="interactions">
          <LeadInteractions interactions={interactions} />
        </TabsContent>

        <TabsContent value="timeline">
          <LeadTimeline interactions={interactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground font-stat">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-stat">{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold font-stat tracking-tight">{value}</div>
    </div>
  );
}
