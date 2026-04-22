import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function DashboardHomePage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-stat">
            BrokerOS dashboard
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">
            Welcome back, {session?.user?.name ?? session?.user?.email ?? "broker"}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Phase 3 lands the real KPI dashboard. For now, you&rsquo;re authenticated.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="outline">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-8">
        <h2 className="text-lg font-semibold">You&rsquo;re in.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Role: <span className="font-stat">{session?.user?.role ?? "BROKER"}</span>
        </p>
      </div>
    </div>
  );
}
