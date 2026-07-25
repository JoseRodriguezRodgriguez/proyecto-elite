import type {
  ReactNode,
} from "react";
import type {
  LucideIcon,
} from "lucide-react";
import {
  Inbox,
} from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Icon
          aria-hidden="true"
          className="h-8 w-8 text-primary"
        />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-foreground">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}