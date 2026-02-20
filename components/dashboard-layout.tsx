"use client";

import type React from "react";

import { useContext, useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUser } from "@/hooks/useUser";
import { AuthDebug } from "./auth-debug";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-50">
        <DashboardSidebar className="w-64 shadow-sm" />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <DashboardSidebar mobile onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        <DashboardHeader setSidebarOpen={setSidebarOpen} />
        <main className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto">{children}</main>
      </div>
      <AuthDebug />
    </div>
  );
}
