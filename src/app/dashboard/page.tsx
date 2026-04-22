import Link from "next/link";
import { Plus } from "lucide-react";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LiveDashboard } from "@/components/dashboard/live-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-stat">
            Overview
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">
            Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Live view of your pipeline — refreshed every 5 seconds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-10">
            <Link href="/apply" target="_blank">
              <Plus className="h-4 w-4 mr-2" /> Open apply form
            </Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" className="h-10 text-muted-foreground">
              Sign out
            </Button>
          </form>
        </div>
      </div>

      <LiveDashboard />
    </div>
  );
}
