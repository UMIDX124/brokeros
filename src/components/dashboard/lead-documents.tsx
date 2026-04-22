import { FileText, Upload, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { type DemoDocument, formatFileSize } from "@/lib/demo/data";

const TYPE_LABEL: Record<DemoDocument["type"], string> = {
  BANK_STATEMENT: "Bank statement",
  TAX_RETURN: "Tax return",
  DRIVERS_LICENSE: "Driver's license",
  VOIDED_CHECK: "Voided check",
  PROFIT_LOSS: "P&L",
  BALANCE_SHEET: "Balance sheet",
  OTHER: "Other",
};

export function LeadDocuments({ documents }: { documents: DemoDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
          <Upload className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No documents yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Send this borrower a secure document-upload link to collect bank statements, tax returns, and a voided check.
        </p>
        <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
          <Upload className="h-4 w-4 mr-2" /> Send upload link
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="text-sm text-muted-foreground">
            Uploaded via secure link. Audit-ready, encrypted at rest.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" /> Request more
        </Button>
      </div>
      <ul>
        {documents.map((d, i) => (
          <li
            key={d.id}
            className={`flex items-center gap-4 px-6 py-4 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground shrink-0">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{d.filename}</div>
              <div className="text-xs text-muted-foreground font-stat">
                {TYPE_LABEL[d.type]} · {formatFileSize(d.sizeBytes)} ·{" "}
                uploaded {format(new Date(d.uploadedAt), "MMM d, yyyy")}
              </div>
            </div>
            <Button variant="ghost" size="sm" aria-label={`Download ${d.filename}`}>
              <Download className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
