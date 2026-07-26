"use client";

import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Home,
  Menu,
} from "lucide-react";

import { ADMIN_ROLE } from "@/lib/auth/constants";
import type { DashboardUser } from "@/components/dashboard/app-sidebar";

type DashboardHeaderProps = {
  currentUser: DashboardUser;
  onOpenSidebar: () => void;
};

const PAGE_TITLES: Record<string, string> = {
  "/": "Panel principal",
  "/clients": "Clientes",
  "/employees": "Empleados",
  "/machinery": "Maquinaria",
  "/supplies": "Suministros",
  "/scheduled-jobs": "Calendario de trabajos",
  "/worked-jobs": "Trabajos finalizados",
  "/quote": "Cotización",
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const matchedRoute = Object.keys(
    PAGE_TITLES
  )
    .filter((route) => route !== "/")
    .find((route) =>
      pathname.startsWith(`${route}/`)
    );

  return matchedRoute
    ? PAGE_TITLES[matchedRoute]
    : "Administración Elite";
}

export default function DashboardHeader({
  currentUser,
  onOpenSidebar,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center border-b border-border bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-primary transition-colors hover:bg-muted lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Home className="h-3.5 w-3.5" />

            {pathname !== "/" && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="truncate">
                  {pageTitle}
                </span>
              </>
            )}
          </div>

          <h1 className="truncate text-lg font-bold text-primary sm:text-xl">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-48 truncate text-sm font-semibold text-foreground">
            {currentUser.name}
          </p>

          <p className="text-xs text-muted-foreground">
            {currentUser.role === ADMIN_ROLE
              ? "Administrador"
              : "Empleado"}
          </p>
        </div>

        <div
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-elite-gradient text-sm font-bold text-white shadow-sm"
        >
          {currentUser.name
            .trim()
            .charAt(0)
            .toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}