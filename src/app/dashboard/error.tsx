"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="mt-6 text-2xl sm:text-3xl font-semibold tracking-tight">
        Couldn&rsquo;t load this dashboard view.
      </h1>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        This usually means a temporary database or network hiccup. Try again — we&rsquo;ll reconnect on the next request.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground font-stat">Reference: {error.digest}</p>
      )}
      <Button
        onClick={reset}
        className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 h-11"
      >
        <RefreshCcw className="h-4 w-4 mr-2" /> Retry
      </Button>
    </div>
  );
}
