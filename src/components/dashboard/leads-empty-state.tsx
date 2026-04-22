"use client";

import { useState } from "react";
import { Link as LinkIcon, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LeadsEmptyState() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/apply` : "/apply";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Apply link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically. Grab the link from the address bar.");
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <LinkIcon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">No leads yet</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        Share the BrokerOS apply link with prospects, embed the form on your site, or send it in
        follow-up emails. Every submission lands here, scored and ready to work.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
        <Button onClick={copy} className="bg-accent text-accent-foreground hover:bg-accent/90 h-11">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy apply link"}
        </Button>
        <Button asChild variant="outline" className="h-11">
          <a href="/apply" target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" /> Open apply form
          </a>
        </Button>
      </div>
    </div>
  );
}
