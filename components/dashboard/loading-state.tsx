import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: string;
  description?: string;
  cardCount?: number;
  rowCount?: number;
  className?: string;
};

export default function LoadingState({
  title = "Cargando información",
  description = "Espere un momento mientras obtenemos los datos.",
  cardCount = 4,
  rowCount = 6,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "space-y-6 p-4 sm:p-6 lg:p-8",
        className
      )}
    >
      {/* Encabezado */}
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded-md bg-primary/10" />
        <div className="mt-3 h-4 w-full max-w-md rounded-md bg-muted" />
      </div>

      {/* Tarjetas estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: cardCount,
        }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="mt-4 h-8 w-16 rounded bg-primary/10" />
                <div className="mt-3 h-3 w-36 rounded bg-muted" />
              </div>

              <div className="h-11 w-11 rounded-xl bg-primary/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="animate-pulse border-b border-border p-5">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="mt-2 h-3 w-72 max-w-full rounded bg-muted" />
        </div>

        <div className="animate-pulse border-b border-border p-5">
          <div className="h-10 w-full max-w-md rounded-md bg-muted" />
        </div>

        <div className="divide-y divide-border">
          {Array.from({
            length: rowCount,
          }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-4 gap-4 px-5 py-4"
            >
              <div className="h-4 animate-pulse rounded bg-muted" />
              <div className="h-4 animate-pulse rounded bg-muted" />
              <div className="hidden h-4 animate-pulse rounded bg-muted sm:block" />
              <div className="hidden h-4 animate-pulse rounded bg-muted sm:block" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">
        {title}. {description}
      </span>
    </div>
  );
}