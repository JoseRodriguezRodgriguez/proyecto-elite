"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  List,
  Pencil,
  PlusIcon,
  SearchX,
  Trash2,
  Users,
} from "lucide-react";
import {
  format,
  isSameMonth,
  isValid,
  parseISO,
} from "date-fns";

import DataToolbar from "@/components/dashboard/data-toolbar";
import EmptyState from "@/components/dashboard/empty-state";
import LoadingState from "@/components/dashboard/loading-state";
import PageHeader from "@/components/dashboard/page-header";
import SectionCard from "@/components/dashboard/section-card";
import StatCard from "@/components/dashboard/stat-card";
import StatusBadge, {
  type StatusBadgeVariant,
} from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/errors";

type WorkedJobStatus = "Completed";

interface WorkedJob {
  id: number;
  service: string;
  date: string;
  status: WorkedJobStatus;
  clientId: number;
  client: {
    name: string;
  };
}

interface Client {
  id: number;
  name: string;
}

type JobForm = {
  service: string;
  date: string;
  status: WorkedJobStatus;
  clientId: number;
};

type BadgeConfiguration = {
  label: string;
  variant: StatusBadgeVariant;
};

const EMPTY_JOB_FORM: JobForm = {
  service: "",
  date: "",
  status: "Completed",
  clientId: 0,
};

const JOB_STATUS_BADGES = {
  Completed: {
    label: "Completado",
    variant: "success",
  },
} satisfies Record<
  WorkedJobStatus,
  BadgeConfiguration
>;

function formatJobDate(date: string) {
  const parsedDate = parseISO(date);

  return isValid(parsedDate)
    ? format(parsedDate, "dd/MM/yyyy")
    : date;
}

function getDateInputValue(date: string) {
  const parsedDate = parseISO(date);

  return isValid(parsedDate)
    ? format(parsedDate, "yyyy-MM-dd")
    : "";
}

export default function WorkedJobsPage() {
  const [workedJobs, setWorkedJobs] =
    useState<WorkedJob[]>([]);
  const [clients, setClients] =
    useState<Client[]>([]);

  const [newJob, setNewJob] =
    useState<JobForm>(EMPTY_JOB_FORM);
  const [selectedJob, setSelectedJob] =
    useState<WorkedJob | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  ] = useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");
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
          workedJobsResponse,
          clientsResponse,
        ] = await Promise.all([
          fetch("/api/worked-jobs"),
          fetch("/api/clients"),
        ]);

        const [
          workedJobsData,
          clientsData,
        ] = await Promise.all([
          workedJobsResponse.json(),
          clientsResponse.json(),
        ]);

        if (!workedJobsResponse.ok) {
          throw new Error(
            workedJobsData.error ||
              "Error al obtener los trabajos realizados"
          );
        }

        if (!clientsResponse.ok) {
          throw new Error(
            clientsData.error ||
              "Error al obtener los clientes"
          );
        }

        if (!cancelled) {
          setWorkedJobs(workedJobsData);
          setClients(clientsData);
        }
      } catch (caughtError: unknown) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              caughtError,
              "No se pudieron cargar los trabajos finalizados."
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

  function openAddDialog() {
    setActionError("");
    setNewJob({
      ...EMPTY_JOB_FORM,
    });
    setIsAddDialogOpen(true);
  }

  function openEditDialog(job: WorkedJob) {
    setActionError("");
    setSelectedJob({
      ...job,
      client: {
        ...job.client,
      },
    });
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(job: WorkedJob) {
    setActionError("");
    setSelectedJob(job);
    setIsDeleteDialogOpen(true);
  }

  function validateJobForm(job: JobForm) {
    if (!job.service.trim()) {
      return "Ingrese el servicio realizado.";
    }

    if (!job.date) {
      return "Seleccione la fecha del trabajo.";
    }

    if (!job.clientId || job.clientId <= 0) {
      return "Seleccione un cliente existente.";
    }

    return "";
  }

  const handleAddJob = async () => {
    const validationMessage =
      validateJobForm(newJob);

    if (validationMessage) {
      setActionError(validationMessage);
      return;
    }

    setActionError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/worked-jobs",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...newJob,
            service: newJob.service.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Error al agregar el trabajo realizado"
        );
      }

      setWorkedJobs((previous) => [
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
          "Error al agregar el trabajo realizado"
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditJob = async () => {
    if (!selectedJob) return;

    const validationMessage =
      validateJobForm({
        service: selectedJob.service,
        date: selectedJob.date,
        status: selectedJob.status,
        clientId: selectedJob.clientId,
      });

    if (validationMessage) {
      setActionError(validationMessage);
      return;
    }

    setActionError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/worked-jobs",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: selectedJob.id,
            service:
              selectedJob.service.trim(),
            date: selectedJob.date,
            status: selectedJob.status,
            clientId:
              selectedJob.clientId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Error al editar el trabajo realizado"
        );
      }

      setWorkedJobs((previous) =>
        previous.map((job) =>
          job.id === data.id ? data : job
        )
      );
      setIsEditDialogOpen(false);
      setSelectedJob(null);
    } catch (caughtError: unknown) {
      setActionError(
        getErrorMessage(
          caughtError,
          "Error al editar el trabajo realizado"
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    setActionError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/worked-jobs",
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Error al eliminar el trabajo realizado"
        );
      }

      setWorkedJobs((previous) =>
        previous.filter(
          (job) =>
            job.id !== selectedJob.id
        )
      );
      setIsDeleteDialogOpen(false);
      setSelectedJob(null);
    } catch (caughtError: unknown) {
      setActionError(
        getErrorMessage(
          caughtError,
          "Error al eliminar el trabajo realizado"
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = workedJobs.filter(
    (job) => {
      const query = searchQuery
        .trim()
        .toLowerCase();
      const statusLabel =
        JOB_STATUS_BADGES[
          job.status
        ].label.toLowerCase();

      return (
        job.service
          .toLowerCase()
          .includes(query) ||
        job.client.name
          .toLowerCase()
          .includes(query) ||
        job.date
          .toLowerCase()
          .includes(query) ||
        formatJobDate(job.date)
          .toLowerCase()
          .includes(query) ||
        job.status
          .toLowerCase()
          .includes(query) ||
        statusLabel.includes(query)
      );
    }
  );

  const workedJobStats = {
    total: workedJobs.length,

    clients: new Set(
      workedJobs.map(
        (job) => job.clientId
      )
    ).size,

    currentMonth: workedJobs.filter(
      (job) => {
        const jobDate = parseISO(
          job.date
        );

        return (
          isValid(jobDate) &&
          isSameMonth(
            jobDate,
            new Date()
          )
        );
      }
    ).length,

    services: new Set(
      workedJobs
        .map((job) =>
          job.service
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    ).size,
  };

  if (loading) {
    return (
      <LoadingState
        title="Cargando trabajos finalizados..."
        description="Por favor, espere mientras obtenemos los trabajos y clientes."
        cardCount={4}
        rowCount={6}
      />
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          icon={Briefcase}
          title="Error al cargar los trabajos finalizados"
          description={error}
        />
      </div>
    );
  }

  const showGlobalActionError =
    actionError &&
    !isAddDialogOpen &&
    !isEditDialogOpen &&
    !isDeleteDialogOpen;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Trabajos finalizados"
        description="Registre y administre los servicios completados para cada cliente."
        actions={
          <Button
            type="button"
            onClick={openAddDialog}
            disabled={
              clients.length === 0
            }
            title={
              clients.length === 0
                ? "Debe existir al menos un cliente registrado."
                : "Registrar trabajo completado"
            }
            className="bg-elite-gradient text-white shadow-sm hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            Registrar trabajo
          </Button>
        }
      />

      <section
        aria-label="Resumen de trabajos finalizados"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Trabajos completados"
          value={workedJobStats.total}
          icon={Briefcase}
          tone="primary"
          helperText="Registros finalizados"
        />

        <StatCard
          label="Clientes atendidos"
          value={workedJobStats.clients}
          icon={Users}
          tone="success"
          helperText="Clientes diferentes"
        />

        <StatCard
          label="Trabajos del mes"
          value={
            workedJobStats.currentMonth
          }
          icon={CalendarDays}
          tone="warning"
          helperText="Completados este mes"
        />

        <StatCard
          label="Servicios diferentes"
          value={workedJobStats.services}
          icon={List}
          tone="neutral"
          helperText="Tipos de servicios registrados"
        />
      </section>

      {showGlobalActionError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

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
              Registrar trabajo completado
            </DialogTitle>

            <DialogDescription>
              Ingrese el servicio, la fecha y el cliente relacionado con el trabajo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job-service">
                Servicio
              </Label>

              <Input
                id="job-service"
                value={newJob.service}
                placeholder="Ejemplo: Mantenimiento de jardín"
                onChange={(event) =>
                  setNewJob({
                    ...newJob,
                    service:
                      event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-date">
                Fecha
              </Label>

              <Input
                id="job-date"
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
              <Label htmlFor="job-client">
                Cliente
              </Label>

              <select
                id="job-client"
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

                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>

              <StatusBadge variant="success">
                Completado
              </StatusBadge>
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
              onClick={handleAddJob}
              disabled={submitting}
              className="bg-elite-gradient text-white hover:opacity-90"
            >
              {submitting
                ? "Registrando..."
                : "Registrar trabajo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionCard
        title="Listado de trabajos"
        description="Consulte, busque y administre los trabajos finalizados."
        contentClassName="p-0"
      >
        {workedJobs.length > 0 && (
          <DataToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por servicio, cliente, fecha o estado"
            searchLabel="Buscar trabajos finalizados"
            resultCount={
              filteredJobs.length
            }
            totalCount={
              workedJobs.length
            }
            resultNoun="trabajos"
          />
        )}

        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={
              workedJobs.length === 0
                ? Briefcase
                : SearchX
            }
            title={
              workedJobs.length === 0
                ? "Todavía no hay trabajos finalizados"
                : "No se encontraron trabajos"
            }
            description={
              workedJobs.length === 0
                ? clients.length === 0
                  ? "Primero registre un cliente para poder asociarlo con un trabajo finalizado."
                  : "Registre el primer trabajo completado para comenzar a construir el historial de servicios."
                : `No existen resultados que coincidan con “${searchQuery}”.`
            }
            action={
              workedJobs.length === 0 ? (
                clients.length > 0 ? (
                  <Button
                    type="button"
                    onClick={openAddDialog}
                    className="bg-elite-gradient text-white hover:opacity-90"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Registrar primer trabajo
                  </Button>
                ) : undefined
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setSearchQuery("")
                  }
                >
                  Limpiar búsqueda
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>
                    Servicio
                  </TableHead>
                  <TableHead>
                    Cliente
                  </TableHead>
                  <TableHead>
                    Fecha
                  </TableHead>
                  <TableHead>
                    Estado
                  </TableHead>
                  <TableHead className="text-right">
                    Opciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredJobs.map(
                  (job) => {
                    const statusBadge =
                      JOB_STATUS_BADGES[
                        job.status
                      ];

                    return (
                      <TableRow key={job.id}>
                        <TableCell className="min-w-64 font-medium text-foreground">
                          {job.service}
                        </TableCell>

                        <TableCell className="min-w-48">
                          {job.client.name}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {formatJobDate(
                            job.date
                          )}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            variant={
                              statusBadge.variant
                            }
                          >
                            {statusBadge.label}
                          </StatusBadge>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Editar trabajo"
                              aria-label={`Editar ${job.service}`}
                              disabled={
                                submitting
                              }
                              onClick={() =>
                                openEditDialog(
                                  job
                                )
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Eliminar trabajo"
                              aria-label={`Eliminar ${job.service}`}
                              disabled={
                                submitting
                              }
                              className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() =>
                                openDeleteDialog(
                                  job
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);

          if (!open) {
            setSelectedJob(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Editar trabajo finalizado
            </DialogTitle>

            <DialogDescription>
              Actualice el servicio, la fecha o el cliente relacionado.
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-job-service">
                  Servicio
                </Label>

                <Input
                  id="edit-job-service"
                  value={
                    selectedJob.service
                  }
                  onChange={(event) =>
                    setSelectedJob({
                      ...selectedJob,
                      service:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-job-date">
                  Fecha
                </Label>

                <Input
                  id="edit-job-date"
                  type="date"
                  value={getDateInputValue(
                    selectedJob.date
                  )}
                  onChange={(event) =>
                    setSelectedJob({
                      ...selectedJob,
                      date: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-job-client">
                  Cliente
                </Label>

                <select
                  id="edit-job-client"
                  value={
                    selectedJob.clientId
                  }
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
                  {clients.map(
                    (client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>

                <StatusBadge variant="success">
                  Completado
                </StatusBadge>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() =>
                setIsEditDialogOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleEditJob}
              disabled={
                submitting ||
                !selectedJob
              }
            >
              {submitting
                ? "Guardando..."
                : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);

          if (!open) {
            setSelectedJob(null);
            setActionError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Eliminar trabajo finalizado
            </DialogTitle>

            <DialogDescription>
              ¿Está seguro de que desea eliminar el trabajo{" "}
              <span className="font-semibold text-foreground">
                {selectedJob?.service}
              </span>
              ? Esta acción no se puede revertir.
            </DialogDescription>
          </DialogHeader>

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
                setIsDeleteDialogOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteJob}
              disabled={
                submitting ||
                !selectedJob
              }
            >
              {submitting
                ? "Eliminando..."
                : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}