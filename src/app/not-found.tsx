import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col min-h-[80vh] items-center justify-center px-6 py-24 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground font-stat">
        404
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">
        We couldn&rsquo;t find that page.
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
        The link might be stale, or the page was moved. Head back to the homepage or the dashboard.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 h-11">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back home</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
