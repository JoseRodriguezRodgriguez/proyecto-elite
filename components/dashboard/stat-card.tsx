import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

type StatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  helperText?: string;
  tone?: StatCardTone;
  className?: string;
};

const toneStyles: Record<
  StatCardTone,
  {
    iconContainer: string;
    icon: string;
    accent: string;
  }
> = {
  primary: {
    iconContainer: "bg-primary/10",
    icon: "text-primary",
    accent: "from-primary to-secondary",
  },

  success: {
    iconContainer: "bg-emerald-100",
    icon: "text-emerald-700",
    accent: "from-emerald-500 to-emerald-600",
  },

  warning: {
    iconContainer: "bg-amber-100",
    icon: "text-amber-700",
    accent: "from-amber-400 to-amber-500",
  },

  danger: {
    iconContainer: "bg-red-100",
    icon: "text-red-700",
    accent: "from-red-500 to-red-600",
  },

  neutral: {
    iconContainer: "bg-slate-100",
    icon: "text-slate-600",
    accent: "from-slate-400 to-slate-500",
  },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  helperText,
  tone = "primary",
  className,
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-panel",
        className
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          styles.accent
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>

          {helperText && (
            <p className="mt-1 text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            styles.iconContainer
          )}
        >
          <Icon
            aria-hidden="true"
            className={cn(
              "h-5 w-5",
              styles.icon
            )}
          />
        </div>
      </div>
    </article>
  );
}