"use client";

import {
  useState,
  type ReactNode,
} from "react";

import AppSidebar, {
  type DashboardUser,
} from "@/components/dashboard/app-sidebar";
import DashboardHeader from "@/components/dashboard/dashboard-header";

type DashboardShellProps = {
  currentUser: DashboardUser;
  children: ReactNode;
};

export default function DashboardShell({
  currentUser,
  children,
}: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        currentUser={currentUser}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() =>
          setMobileSidebarOpen(false)
        }
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <DashboardHeader
          currentUser={currentUser}
          onOpenSidebar={() =>
            setMobileSidebarOpen(true)
          }
        />

        <main className="min-w-0 flex-1 overflow-x-hidden bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}