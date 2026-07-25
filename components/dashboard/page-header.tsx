import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </section>
  );
}