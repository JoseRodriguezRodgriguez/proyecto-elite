"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  CheckSquare2,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings2,
  UserCog,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_ROLE } from "@/lib/auth/constants";
import { cn } from "@/lib/utils";

export type DashboardUser = {
  name: string;
  username: string;
  role: string;
};

type AppSidebarProps = {
  currentUser: DashboardUser;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  {
    label: "Inicio",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Clientes",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Empleados",
    href: "/employees",
    icon: UserCog,
    adminOnly: true,
  },
  {
    label: "Maquinaria",
    href: "/machinery",
    icon: Wrench,
  },
  {
    label: "Suministros",
    href: "/supplies",
    icon: Package,
  },
  {
    label: "Calendario de trabajos",
    href: "/scheduled-jobs",
    icon: CalendarDays,
  },
  {
    label: "Trabajos finalizados",
    href: "/worked-jobs",
    icon: CheckSquare2,
  },
  {
    label: "Cotización",
    href: "/quote",
    icon: FileText,
  },
];

function isRouteActive(
  pathname: string,
  href: string
) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href ||
    pathname.startsWith(`${href}/`);
}

export default function AppSidebar({
  currentUser,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  const pathname = usePathname();

  const visibleItems = menuItems.filter(
    (item) =>
      !item.adminOnly ||
      currentUser.role === ADMIN_ROLE
  );

  async function handleSignOut() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  function renderSidebarContent() {
    return (
      <>
        <div className="flex min-h-24 items-center border-b border-sidebar-border px-5">
          <Link
            href="/"
            onClick={onMobileClose}
            className="flex min-w-0 items-center gap-4"
          >
            <Image
              src="/EliteLogo.svg"
              alt="Logo de Elite Company"
              width={140}
              height={70}
              priority
              unoptimized
              className="h-auto w-28 shrink-0 object-contain"
            />
        
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide text-white">
                Administración Elite
              </p>
            
              <p className="truncate text-xs text-sidebar-foreground/65">
                Panel administrativo
              </p>
            </div>
          </Link>
        </div>

        <nav
          aria-label="Navegación principal"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        >
          {visibleItems.map((item) => {
            const active = isRouteActive(
              pathname,
              item.href
            );

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
                }
                onClick={onMobileClose}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-active text-white shadow-sm"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-hover hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active
                      ? "text-white"
                      : "text-sidebar-foreground/65 group-hover:text-white"
                  )}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-3 rounded-xl bg-white/10 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
                {currentUser.name
                  .trim()
                  .charAt(0)
                  .toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {currentUser.name}
                </p>

                <p className="truncate text-xs text-sidebar-foreground/65">
                  {currentUser.username}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5">
              <Settings2 className="h-3.5 w-3.5 text-sidebar-foreground/70" />

              <span className="truncate text-xs font-medium text-sidebar-foreground/75">
                {currentUser.role === ADMIN_ROLE
                  ? "Administrador"
                  : "Empleado"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-hover hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Cerrar sesión
          </button>

          <p className="mt-3 text-center text-[11px] text-sidebar-foreground/45">
            Elite · v0.1.2
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-sidebar lg:flex">
      {renderSidebarContent()}
    </aside>

      {/* Sidebar móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
        >
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onMobileClose}
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          />

          <aside className="relative z-10 flex h-full w-[86%] max-w-72 flex-col bg-sidebar">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={onMobileClose}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {renderSidebarContent()}
          </aside>
        </div>
      )}
    </>
  );
}