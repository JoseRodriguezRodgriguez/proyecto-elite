"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Users,
  Wrench,
  Package,
  Calendar,
  ClipboardList,
  ReceiptText,
  LogOut,
} from "lucide-react";
import { ADMIN_ROLE } from "@/lib/auth/constants";

type SidebarProps = {
  currentUser: {
    name: string;
    username: string;
    role: string;
  };
};

type MenuItem = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  href: string;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  {
    icon: Users,
    label: "Clientes",
    href: "/clients",
  },
  {
    icon: Users,
    label: "Empleados",
    href: "/employees",
    adminOnly: true,
  },
  {
    icon: Wrench,
    label: "Maquinaria",
    href: "/machinery",
  },
  {
    icon: Package,
    label: "Suministros",
    href: "/supplies",
  },
  {
    icon: Calendar,
    label: "Calendario de trabajos",
    href: "/scheduled-jobs",
  },
  {
    icon: ClipboardList,
    label: "Trabajos finalizados",
    href: "/worked-jobs",
  },
  {
    icon: ReceiptText,
    label: "Cotización",
    href: "/quote",
  },
];

export default function Sidebar({
  currentUser,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const visibleItems = menuItems.filter(
    (item) => !item.adminOnly || currentUser.role === ADMIN_ROLE
  );

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);

      await signOut({
        callbackUrl: "/login",
      });
    } catch {
      console.error("Unable to sign out.");
      setIsSigningOut(false);
    }
  }

  return (
    <aside
      className={`
        flex flex-col
        bg-[#262451]
        shadow-md
        transition-all
        duration-300
        ease-in-out
        ${isExpanded ? "w-64" : "w-16"}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="p-4">
        <Image
          src="/EliteLogo.svg"
          alt="Elite Logo"
          width={128}
          height={128}
          priority
          className={`
            transition-all
            duration-300
            ease-in-out
            ${isExpanded ? "w-32" : "w-8"}
          `}
        />
      </div>

      <nav className="mt-4 flex flex-grow flex-col space-y-2">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center
              rounded-r-full
              px-2 py-2
              text-[#d2c9ff]
              transition-all
              duration-300
              hover:bg-[#4e497a]
              ${isExpanded ? "px-4" : "justify-center"}
            `}
          >
            <item.icon className="h-5 w-5 shrink-0" />

            <span
              className={`
                ml-2
                whitespace-nowrap
                transition-all
                duration-300
                ${
                  isExpanded
                    ? "w-auto opacity-100"
                    : "w-0 overflow-hidden opacity-0"
                }
              `}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#4e497a] p-2">
        {isExpanded && (
          <div className="mb-3 px-2 text-[#d2c9ff]">
            <p className="truncate text-sm font-medium">
              {currentUser.name}
            </p>

            <p className="truncate text-xs opacity-80">
              {currentUser.username}
            </p>

            <p className="text-xs opacity-70">
              {currentUser.role}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Cerrar sesión"
          className={`
            flex w-full items-center
            rounded-md px-2 py-2
            text-[#d2c9ff]
            transition-colors
            hover:bg-[#4e497a]
            disabled:cursor-not-allowed
            disabled:opacity-60
            ${isExpanded ? "justify-start" : "justify-center"}
          `}
        >
          <LogOut className="h-5 w-5 shrink-0" />

          {isExpanded && (
            <span className="ml-2">
              {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </span>
          )}
        </button>

        {isExpanded && (
          <p className="mt-3 px-2 text-xs text-[#d2c9ff] opacity-70">
            v0.1.2
          </p>
        )}
      </div>
    </aside>
  );
}