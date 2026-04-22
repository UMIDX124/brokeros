import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="flex flex-1 min-h-[calc(100vh-1px)]">
      <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 border-r border-border bg-surface">
        <SidebarNav />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userName={session.user.name} userEmail={session.user.email} />
        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
