"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CheckSquare2,
  Clock3,
  Package,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  format,
  isSameDay,
  isValid,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import EmptyState from "@/components/dashboard/empty-state";
import LoadingState from "@/components/dashboard/loading-state";
import PageHeader from "@/components/dashboard/page-header";
import SectionCard from "@/components/dashboard/section-card";
import StatCard from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

interface UpcomingJob {
  id: number;
  service: string;
  date: string;
  hour: string;
  clientId: number;
  client: {
    name: string;
  };
}

interface DashboardSummary {
  totalClients: number;
  totalScheduledJobs: number;
  todayJobs: number;
  totalWorkedJobs: number;
  outOfStockSupplies: number;
  upcomingJobs: UpcomingJob[];
}

function formatUpcomingJobDate(
  value: string
) {
  const parsedDate = parseISO(value);

  if (!isValid(parsedDate)) {
    return value;
  }

  if (
    isSameDay(
      parsedDate,
      new Date()
    )
  ) {
    return "Hoy";
  }

  return format(
    parsedDate,
    "dd MMM yyyy",
    {
      locale: es,
    }
  );
}

export default function HomePage() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(
      null
    );
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const loadSummary =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const today = format(
          new Date(),
          "yyyy-MM-dd"
        );

        const timezoneOffset =
          new Date().getTimezoneOffset();

        const response = await fetch(
          `/api/summary?date=${today}&timezoneOffset=${timezoneOffset}`,
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "No se pudo cargar el resumen."
          );
        }

        setSummary(data);
      } catch (caughtError: unknown) {
        setError(
          getErrorMessage(
            caughtError,
            "No se pudo cargar el resumen general."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  if (loading) {
    return (
      <LoadingState
        title="Cargando resumen..."
        description="Obteniendo la información actual de clientes, trabajos e inventario."
        cardCount={4}
        rowCount={5}
      />
    );
  }

  if (error || !summary) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          icon={AlertTriangle}
          title="No se pudo cargar el resumen"
          description={
            error ||
            "No se encontró información para mostrar."
          }
          action={
            <Button
              type="button"
              variant="outline"
              onClick={loadSummary}
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  const todayLabel = format(
    new Date(),
    "EEEE, dd 'de' MMMM 'de' yyyy",
    {
      locale: es,
    }
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Resumen general"
        description={`Estado actual de clientes, trabajos e inventario · ${todayLabel}`}
      />

      <section
        aria-label="Estadísticas principales"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Clientes registrados"
          value={summary.totalClients}
          icon={Users}
          tone="primary"
          helperText="Clientes en el sistema"
        />

        <StatCard
          label="Trabajos programados"
          value={
            summary.totalScheduledJobs
          }
          icon={CalendarDays}
          tone="warning"
          helperText="Pendientes en el calendario"
        />

        <StatCard
          label="Trabajos para hoy"
          value={summary.todayJobs}
          icon={Clock3}
          tone="success"
          helperText="Servicios de este día"
        />

        <StatCard
          label="Trabajos finalizados"
          value={
            summary.totalWorkedJobs
          }
          icon={CheckSquare2}
          tone="neutral"
          helperText="Servicios completados"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <SectionCard
          title="Próximos trabajos"
          description="Los cinco servicios programados más cercanos."
          contentClassName="p-0"
        >
          {summary.upcomingJobs.length ===
          0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No hay trabajos próximos"
              description="Actualmente no existen trabajos pendientes en el calendario."
            />
          ) : (
            <>
              <div className="divide-y divide-border">
                {summary.upcomingJobs.map(
                  (job) => (
                    <Link
                      key={job.id}
                      href="/scheduled-jobs"
                      className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {job.service}
                        </p>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {job.client.name}
                        </p>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <p className="text-sm font-semibold text-primary">
                          {job.hour}
                        </p>

                        <p className="text-xs capitalize text-muted-foreground">
                          {formatUpcomingJobDate(
                            job.date
                          )}
                        </p>
                      </div>
                    </Link>
                  )
                )}
              </div>

              <div className="border-t border-border px-5 py-4">
                <Button
                  asChild
                  variant="outline"
                >
                  <Link href="/scheduled-jobs">
                    Ver calendario completo
                  </Link>
                </Button>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Estado de suministros"
          description="Compruebe si existen suministros agotados."
        >
          {summary.outOfStockSupplies >
          0 ? (
            <Link
              href="/supplies"
              className="flex items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <Package className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-red-800">
                  Hay suministros agotados
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {summary.outOfStockSupplies}{" "}
                  {summary.outOfStockSupplies ===
                  1
                    ? "suministro tiene"
                    : "suministros tienen"}{" "}
                  cantidad cero.
                </p>
              </div>

              <AlertTriangle className="ml-auto h-5 w-5 shrink-0 text-red-600" />
            </Link>
          ) : (
            <div className="flex items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold text-emerald-800">
                  Sin suministros agotados
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  Todos los suministros tienen existencias disponibles.
                </p>
              </div>

              <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-600" />
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}