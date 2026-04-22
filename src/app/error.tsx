"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground font-stat">500</p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">
        Something broke on our side.
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
        Our team has been notified. You can try again — most errors clear themselves on the next request.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground font-stat">
          Reference: {error.digest}
        </p>
      )}
      <Button
        onClick={reset}
        className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 h-11"
      >
        <RefreshCcw className="h-4 w-4 mr-2" /> Try again
      </Button>
    </div>
  );
}
