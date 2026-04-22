"use client";

import { useState } from "react";
import { Menu, Search, Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarNav } from "./sidebar-nav";

export function Topbar({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail?: string | null;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur">
      <div className="h-full px-4 md:px-6 flex items-center gap-4">
        {/* Mobile menu trigger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>BrokerOS dashboard navigation</SheetDescription>
            </SheetHeader>
            <SidebarNav onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search leads, businesses, emails…"
            className="pl-9 h-10 bg-surface"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 pl-2 border-l border-border">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium leading-tight">{userName ?? "Broker"}</div>
              <div className="text-xs text-muted-foreground leading-tight">
                {userEmail ?? "—"}
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
              {(userName ?? userEmail ?? "B")
                .trim()
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
