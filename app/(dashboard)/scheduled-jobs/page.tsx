//pagina de trabajos agendados
"use client"

import { useState, useEffect } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pencil,
  PlusIcon,
  SearchX,
  Trash2,
  Users,
} from "lucide-react"
import { getErrorMessage } from "@/lib/errors"
import DataToolbar from "@/components/dashboard/data-toolbar";
import EmptyState from "@/components/dashboard/empty-state";
import LoadingState from "@/components/dashboard/loading-state";
import PageHeader from "@/components/dashboard/page-header";
import SectionCard from "@/components/dashboard/section-card";
import StatCard from "@/components/dashboard/stat-card";
import StatusBadge from "@/components/dashboard/status-badge";

interface ScheduledJob {
  id: number;
  service: string;
  date: string;
  hour: string;
  clientId: number;
  client: {
    name: string;
  };
}

interface Client {
  id: number;
  name: string;
}

type ScheduledJobForm = {
  service: string;
  date: string;
  hour: string;
  clientId: number;
};

const EMPTY_JOB_FORM: ScheduledJobForm = {
  service: "",
  date: format(
    new Date(),
    "yyyy-MM-dd"
  ),
  hour: "",
  clientId: 0,
};

export default function ScheduledJobsPage() {
  const [currentMonth, setCurrentMonth] =
  useState(new Date());

  const [jobs, setJobs] =
    useState<ScheduledJob[]>([]);

  const [allClients, setAllClients] =
    useState<Client[]>([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [newJob, setNewJob] =
    useState<ScheduledJobForm>({
      ...EMPTY_JOB_FORM,
    });

  const [selectedJob, setSelectedJob] =
    useState<ScheduledJob | null>(null);

  const [
    isAddDialogOpen,
    setIsAddDialogOpen,
  ] = useState(false);

  const [
    isViewDialogOpen,
    setIsViewDialogOpen,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPageData() {
      try {
        setLoading(true);
        setError("");

        const [
          jobsResponse,
          clientsResponse,
        ] = await Promise.all([
          fetch("/api/scheduled-jobs"),
          fetch("/api/clients"),
        ]);

        const [
          jobsData,
          clientsData,
        ] = await Promise.all([
          jobsResponse.json(),
          clientsResponse.json(),
        ]);

        if (!jobsResponse.ok) {
          throw new Error(
            jobsData.error ||
              "Error al obtener los trabajos programados"
          );
        }

        if (!clientsResponse.ok) {
          throw new Error(
            clientsData.error ||
              "Error al obtener los clientes"
          );
        }

        if (!cancelled) {
          setJobs(jobsData);
          setAllClients(clientsData);
        }
      } catch (caughtError: unknown) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              caughtError,
              "No se pudo cargar el calendario."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  function openAddDialog(
    date: Date = new Date()
  ) {
    setActionError("");

    setNewJob({
      ...EMPTY_JOB_FORM,
      date: format(
        date,
        "yyyy-MM-dd"
      ),
    });

    setIsAddDialogOpen(true);
  }

  function openJobDialog(
    job: ScheduledJob
  ) {
    setActionError("");

    setSelectedJob({
      ...job,
      client: {
        ...job.client,
      },
    });

    setIsViewDialogOpen(true);
  }

  function previousMonth() {
    setCurrentMonth((previous) =>
      subMonths(previous, 1)
    );
  }

  function nextMonth() {
    setCurrentMonth((previous) =>
      addMonths(previous, 1)
    );
  }

  function goToCurrentMonth() {
    setCurrentMonth(new Date());
  }

  const rawMonthLabel = format(
    currentMonth,
    "MMMM yyyy",
    {
      locale: es,
    }
  );

  const monthLabel =
    rawMonthLabel.charAt(0).toUpperCase() +
    rawMonthLabel.slice(1);

  function getCalendarDays(
    month: Date
  ) {
    const start = startOfWeek(
      startOfMonth(month),
      {
        weekStartsOn: 1,
      }
    );

    const end = endOfWeek(
      endOfMonth(month),
      {
        weekStartsOn: 1,
      }
    );

    return eachDayOfInterval({
      start,
      end,
    });
  }

  const calendarDays =
    getCalendarDays(currentMonth);

  const filteredJobs = jobs.filter(
    (job) => {
      const query = searchQuery
        .trim()
        .toLowerCase();

      const parsedDate =
        parseISO(job.date);

      const formattedDate =
        isValid(parsedDate)
          ? format(
              parsedDate,
              "dd/MM/yyyy"
            )
          : job.date;

      return (
        job.service
          .toLowerCase()
          .includes(query) ||
        job.client.name
          .toLowerCase()
          .includes(query) ||
        job.hour
          .toLowerCase()
          .includes(query) ||
        job.date
          .toLowerCase()
          .includes(query) ||
        formattedDate.includes(query)
      );
    }
  );

  const currentMonthJobs =
    filteredJobs.filter((job) => {
      const parsedDate =
        parseISO(job.date);

      return (
        isValid(parsedDate) &&
        isSameMonth(
          parsedDate,
          currentMonth
        )
      );
    });

  function getJobsForDay(
    day: Date
  ) {
    return currentMonthJobs
      .filter((job) => {
        const parsedDate =
          parseISO(job.date);

        return (
          isValid(parsedDate) &&
          isSameDay(
            parsedDate,
            day
          )
        );
      })
      .sort((first, second) =>
        first.hour.localeCompare(
          second.hour
        )
      );
  }

  const calendarStats = {
    total: jobs.length,

    today: jobs.filter((job) => {
      const date = parseISO(job.date);

      return (
        isValid(date) &&
        isToday(date)
      );
    }).length,

    currentMonth: jobs.filter(
      (job) => {
        const date =
          parseISO(job.date);

        return (
          isValid(date) &&
          isSameMonth(
            date,
            currentMonth
          )
        );
      }
    ).length,

    clients: new Set(
      jobs.map((job) => job.clientId)
    ).size,
  };

  const handleAddJob = async () => {
    if (!newJob.service.trim()) {
      setActionError(
        "Ingrese el servicio."
      );
      return;
    }

    if (!newJob.clientId) {
      setActionError(
        "Seleccione un cliente."
      );
      return;
    }

    if (!newJob.date) {
      setActionError(
        "Seleccione una fecha."
      );
      return;
    }

    if (!newJob.hour) {
      setActionError(
        "Seleccione una hora."
      );
      return;
    }

    setActionError("");
    setSubmitting(true);

    try {
      const jobToSend = {
        ...newJob,
        service:
          newJob.service.trim(),
        date: new Date(
          `${newJob.date}T${newJob.hour}:00`
        ).toISOString(),
      };

      const response = await fetch(
        "/api/scheduled-jobs",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            jobToSend
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Error al agregar el trabajo"
        );
      }

      setJobs((previous) => [
        ...previous,
        data,
      ]);

      setNewJob({
        ...EMPTY_JOB_FORM,
      });

      setIsAddDialogOpen(false);
    } catch (caughtError: unknown) {
      setActionError(
        getErrorMessage(
          caughtError,
          "No se pudo programar el trabajo."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSelectedJob =
    async () => {
      if (!selectedJob) return;

      if (
        !selectedJob.service.trim()
      ) {
        setActionError(
          "Ingrese el servicio."
        );
        return;
      }

      if (!selectedJob.clientId) {
        setActionError(
          "Seleccione un cliente."
        );
        return;
      }

      if (!selectedJob.hour) {
        setActionError(
          "Seleccione una hora."
        );
        return;
      }

      setActionError("");
      setSubmitting(true);

      try {
        const selectedDate =
          format(
            parseISO(
              selectedJob.date
            ),
            "yyyy-MM-dd"
          );

        const jobToUpdate = {
          id: selectedJob.id,
          service:
            selectedJob.service.trim(),
          date: new Date(
            `${selectedDate}T${selectedJob.hour}:00`
          ).toISOString(),
          hour: selectedJob.hour,
          clientId:
            selectedJob.clientId,
        };

        const response = await fetch(
          "/api/scheduled-jobs",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              jobToUpdate
            ),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Error al editar el trabajo"
          );
        }

        setJobs((previous) =>
          previous.map((job) =>
            job.id === data.id
              ? data
              : job
          )
        );

        setSelectedJob(null);
        setIsViewDialogOpen(false);
      } catch (caughtError: unknown) {
        setActionError(
          getErrorMessage(
            caughtError,
            "No se pudo editar el trabajo."
          )
        );
      } finally {
        setSubmitting(false);
      }
    };

  const handleDeleteSelectedJob =
    async () => {
      if (!selectedJob) return;

      setActionError("");
      setSubmitting(true);

      try {
        const response = await fetch(
          "/api/scheduled-jobs",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: selectedJob.id,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Error al eliminar el trabajo"
          );
        }

        setJobs((previous) =>
          previous.filter(
            (job) =>
              job.id !==
              selectedJob.id
          )
        );

        setSelectedJob(null);
        setIsViewDialogOpen(false);
      } catch (caughtError: unknown) {
        setActionError(
          getErrorMessage(
            caughtError,
            "No se pudo eliminar el trabajo."
          )
        );
      } finally {
        setSubmitting(false);
      }
    };

  const handleFinishAndBill =
    async () => {
      if (!selectedJob) return;

      setActionError("");
      setSubmitting(true);

      try {
        const response = await fetch(
          "/api/scheduled-jobs/finish",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id: selectedJob.id,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "No se pudo finalizar el trabajo"
          );
        }

        setJobs((previous) =>
          previous.filter(
            (job) =>
              job.id !==
              selectedJob.id
          )
        );

        setSelectedJob(null);
        setIsViewDialogOpen(false);
      } catch (caughtError: unknown) {
        setActionError(
          getErrorMessage(
            caughtError,
            "No se pudo finalizar el trabajo."
          )
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (loading) {
    return (
      <LoadingState
        title="Cargando calendario..."
        description="Obteniendo los trabajos programados y clientes."
        cardCount={4}
        rowCount={5}
      />
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          icon={CalendarDays}
          title="Error al cargar el calendario"
          description={error}
        />
        </div>
    );
  }

    return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Encabezado */}
      <PageHeader
        title="Calendario de trabajos"
        description="Programe y administre los servicios pendientes para cada cliente."
        actions={
          <Button
            type="button"
            onClick={() => openAddDialog()}
            disabled={allClients.length === 0}
            title={
              allClients.length === 0
                ? "Debe registrar al menos un cliente."
                : "Programar trabajo"
            }
            className="bg-elite-gradient text-white shadow-sm hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            Programar trabajo
          </Button>
        }
      />

      {/* Estadísticas */}
      <section
        aria-label="Resumen del calendario"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Trabajos programados"
          value={calendarStats.total}
          icon={Briefcase}
          tone="primary"
          helperText="Total en el calendario"
        />

        <StatCard
          label="Trabajos para hoy"
          value={calendarStats.today}
          icon={Clock3}
          tone="warning"
          helperText="Programados para este día"
        />

        <StatCard
          label="Trabajos del mes"
          value={calendarStats.currentMonth}
          icon={CalendarDays}
          tone="success"
          helperText={`Programados en ${monthLabel}`}
        />

        <StatCard
          label="Clientes agendados"
          value={calendarStats.clients}
          icon={Users}
          tone="neutral"
          helperText="Clientes diferentes"
        />
      </section>

      {/* Diálogo para agregar un trabajo */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);

          if (!open) {
            setNewJob({
              ...EMPTY_JOB_FORM,
            });

            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Programar nuevo trabajo
            </DialogTitle>

            <DialogDescription>
              Ingrese el servicio, cliente, fecha y hora del trabajo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Servicio */}
            <div className="space-y-2">
              <Label htmlFor="scheduled-service">
                Servicio
              </Label>

              <Input
                id="scheduled-service"
                value={newJob.service}
                placeholder="Ejemplo: Mantenimiento de jardín"
                onChange={(event) =>
                  setNewJob({
                    ...newJob,
                    service: event.target.value,
                  })
                }
              />
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="scheduled-client">
                Cliente
              </Label>

              <select
                id="scheduled-client"
                value={newJob.clientId}
                onChange={(event) =>
                  setNewJob({
                    ...newJob,
                    clientId: Number(
                      event.target.value
                    ),
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={0}>
                  Seleccionar cliente
                </option>

                {allClients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y hora */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduled-date">
                  Fecha
                </Label>

                <Input
                  id="scheduled-date"
                  type="date"
                  value={newJob.date}
                  onChange={(event) =>
                    setNewJob({
                      ...newJob,
                      date: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled-hour">
                  Hora
                </Label>

                <Input
                  id="scheduled-hour"
                  type="time"
                  value={newJob.hour}
                  onChange={(event) =>
                    setNewJob({
                      ...newJob,
                      hour: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Estado informativo */}
            <div className="space-y-2">
              <Label>Estado</Label>

              <div>
                <StatusBadge variant="primary">
                  Programado
                </StatusBadge>
              </div>
            </div>
          </div>

          {actionError && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {actionError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() =>
                setIsAddDialogOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="button"
              disabled={submitting}
              onClick={handleAddJob}
              className="bg-elite-gradient text-white hover:opacity-90"
            >
              {submitting
                ? "Programando..."
                : "Programar trabajo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendario */}
      <SectionCard
        title="Calendario mensual"
        description="Seleccione un trabajo para consultar, editar, finalizar o eliminar."
        contentClassName="p-0"
      >
        {/* Navegación entre meses */}
        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={previousMonth}
              aria-label="Ir al mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
            >
              Hoy
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={nextMonth}
              aria-label="Ir al mes siguiente"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2
            aria-live="polite"
            className="text-lg font-semibold capitalize text-foreground"
          >
            {monthLabel}
          </h2>
        </div>

        {/* Búsqueda */}
        {jobs.length > 0 && (
          <DataToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por servicio, cliente, fecha u hora"
            searchLabel="Buscar trabajos programados"
            resultCount={filteredJobs.length}
            totalCount={jobs.length}
            resultNoun="trabajos"
          />
        )}

        {/* Estado sin trabajos */}
        {jobs.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No hay trabajos programados"
            description={
              allClients.length === 0
                ? "Primero registre un cliente para poder programar trabajos."
                : "Programe el primer trabajo para comenzar a organizar el calendario."
            }
            action={
              allClients.length > 0 ? (
                <Button
                  type="button"
                  onClick={() =>
                    openAddDialog()
                  }
                  className="bg-elite-gradient text-white hover:opacity-90"
                >
                  <PlusIcon className="h-4 w-4" />
                  Programar primer trabajo
                </Button>
              ) : undefined
            }
          />
        ) : filteredJobs.length === 0 ? (
          /* Búsqueda sin resultados */
          <EmptyState
            icon={SearchX}
            title="No se encontraron trabajos"
            description={`No existen resultados que coincidan con “${searchQuery}”.`}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSearchQuery("")
                }
              >
                Limpiar búsqueda
              </Button>
            }
          />
        ) : (
          /* Cuadrícula del calendario */
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 border-l border-t border-border bg-muted/40">
                {[
                  "Lunes",
                  "Martes",
                  "Miércoles",
                  "Jueves",
                  "Viernes",
                  "Sábado",
                  "Domingo",
                ].map((dayName) => (
                  <div
                    key={dayName}
                    className="border-b border-r border-border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 border-l border-border">
                {calendarDays.map((day) => {
                  const isCurrent =
                    isSameMonth(
                      day,
                      currentMonth
                    );

                  const dayJobs =
                    getJobsForDay(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-32 border-b border-r border-border p-2 ${
                        isCurrent
                          ? "bg-card"
                          : "bg-muted/30"
                      }`}
                    >
                      {/* Número del día */}
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                            isToday(day)
                              ? "bg-primary text-primary-foreground"
                              : isCurrent
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        {dayJobs.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {dayJobs.length}
                          </span>
                        )}
                      </div>

                      {/* Trabajos del día */}
                      <div className="space-y-1.5">
                        {dayJobs.map((job) => (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() =>
                              openJobDialog(job)
                            }
                            title={`${job.hour} · ${job.service} · ${job.client.name}`}
                            className="w-full rounded-md border border-primary/20 bg-primary/10 px-2 py-1.5 text-left transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <span className="block truncate text-xs font-semibold text-primary">
                              {job.hour} ·{" "}
                              {job.service}
                            </span>

                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {job.client.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Diálogo de detalle */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);

          if (!open) {
            setSelectedJob(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Detalle del trabajo
            </DialogTitle>

            <DialogDescription>
              Edite, elimine o marque el trabajo como finalizado.
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="grid gap-4 py-4">
              {/* Servicio */}
              <div className="space-y-2">
                <Label htmlFor="selected-service">
                  Servicio
                </Label>

                <Input
                  id="selected-service"
                  value={selectedJob.service}
                  onChange={(event) =>
                    setSelectedJob({
                      ...selectedJob,
                      service:
                        event.target.value,
                    })
                  }
                />
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="selected-client">
                  Cliente
                </Label>

                <select
                  id="selected-client"
                  value={selectedJob.clientId}
                  onChange={(event) =>
                    setSelectedJob({
                      ...selectedJob,
                      clientId: Number(
                        event.target.value
                      ),
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {allClients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y hora */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="selected-date">
                    Fecha
                  </Label>

                  <Input
                    id="selected-date"
                    type="date"
                    value={format(
                      parseISO(
                        selectedJob.date
                      ),
                      "yyyy-MM-dd"
                    )}
                    onChange={(event) => {
                      const selectedDate =
                        event.target.value;

                      setSelectedJob({
                        ...selectedJob,
                        date: new Date(
                          `${selectedDate}T${selectedJob.hour}:00`
                        ).toISOString(),
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selected-hour">
                    Hora
                  </Label>

                  <Input
                    id="selected-hour"
                    type="time"
                    value={selectedJob.hour}
                    onChange={(event) =>
                      setSelectedJob({
                        ...selectedJob,
                        hour:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label>Estado</Label>

                <div>
                  <StatusBadge variant="primary">
                    Programado
                  </StatusBadge>
                </div>
              </div>
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {actionError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={
                submitting ||
                !selectedJob
              }
              onClick={
                handleDeleteSelectedJob
              }
            >
              <Trash2 className="h-4 w-4" />
              {submitting
                ? "Procesando..."
                : "Eliminar"}
            </Button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={
                  submitting ||
                  !selectedJob
                }
                onClick={
                  handleSaveSelectedJob
                }
              >
                <Pencil className="h-4 w-4" />
                Guardar cambios
              </Button>

              <Button
                type="button"
                disabled={
                  submitting ||
                  !selectedJob
                }
                onClick={
                  handleFinishAndBill
                }
                className="bg-elite-gradient text-white hover:opacity-90"
              >
                {submitting
                  ? "Finalizando..."
                  : "Finalizar trabajo"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}