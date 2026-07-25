import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

type StatusBadgeProps = {
  children: ReactNode;
  variant?: StatusBadgeVariant;
  showDot?: boolean;
  className?: string;
};

const variantStyles: Record<
  StatusBadgeVariant,
  {
    container: string;
    dot: string;
  }
> = {
  primary: {
    container:
      "border-primary/20 bg-primary/10 text-primary",
    dot: "bg-primary",
  },

  success: {
    container:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },

  warning: {
    container:
      "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },

  danger: {
    container:
      "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },

  neutral: {
    container:
      "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

export default function StatusBadge({
  children,
  variant = "neutral",
  showDot = true,
  className,
}: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        styles.container,
        className
      )}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            styles.dot
          )}
        />
      )}

      {children}
    </span>
  );
}