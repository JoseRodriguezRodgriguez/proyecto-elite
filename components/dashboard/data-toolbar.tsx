"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DataToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;

  searchPlaceholder?: string;
  searchLabel?: string;

  resultCount?: number;
  totalCount?: number;
  resultNoun?: string;

  filters?: ReactNode;
  actions?: ReactNode;

  className?: string;
};

export default function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  searchLabel = "Buscar registros",
  resultCount,
  totalCount,
  resultNoun = "registros",
  filters,
  actions,
  className,
}: DataToolbarProps) {
  const showResultCount =
    typeof resultCount === "number" &&
    typeof totalCount === "number";

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border px-5 py-4",
        "lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Campo de búsqueda */}
        <div className="relative w-full sm:max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            type="search"
            value={searchValue}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
            className={cn(
              "h-10 bg-muted/40 pl-9",
              searchValue ? "pr-10" : "pr-3"
            )}
          />

          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>
          )}
        </div>

        {/* Filtros futuros */}
        {filters && (
          <div className="flex flex-wrap items-center gap-2">
            {filters}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        {/* Contador de resultados */}
        {showResultCount && (
          <p
            aria-live="polite"
            className="whitespace-nowrap text-sm text-muted-foreground"
          >
            Mostrando{" "}
            <span className="font-semibold text-foreground">
              {resultCount}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-foreground">
              {totalCount}
            </span>{" "}
            {resultNoun}
          </p>
        )}

        {/* Acciones futuras */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}