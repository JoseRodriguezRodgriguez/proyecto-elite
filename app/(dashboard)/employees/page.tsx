"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  Clock3,
  Copy,
  KeyRound,
  Link2,
  Pencil,
  PlusIcon,
  RotateCcw,
  SearchX,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

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
import {
  ALLOWED_ROLES,
  type AllowedRole,
} from "@/lib/auth/constants";

type AccountStatus = "PENDING" | "ACTIVE" | "DISABLED";

interface Employee {
  id: number;
  name: string;
  role: string;
  phone: string;
  user: string;
  accountStatus: AccountStatus;
  activationExpiresAt: string | null;
  hasPendingActivation: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type NewEmployeeForm = {
  name: string;
  phone: string;
  user: string;
  role: AllowedRole;
};

type BadgeConfiguration = {
  label: string;
  variant: StatusBadgeVariant;
};

const EMPTY_EMPLOYEE_FORM: NewEmployeeForm = {
  name: "",
  phone: "",
  user: "",
  role: "EMPLOYEE",
};

const EMPLOYEE_STATUS_BADGES = {
  ACTIVE: {
    label: "Activo",
    variant: "success",
  },
  PENDING: {
    label: "Pendiente",
    variant: "warning",
  },
  DISABLED: {
    label: "Deshabilitado",
    variant: "danger",
  },
} satisfies Record<AccountStatus, BadgeConfiguration>;

function getActivationBadge(employee: Employee): BadgeConfiguration {
  if (employee.hasPendingActivation) {
    return {
      label: "Enlace vigente",
      variant: "primary",
    };
  }

  if (employee.accountStatus === "PENDING") {
    return {
      label: "Sin enlace vigente",
      variant: "warning",
    };
  }

  return {
    label: "No aplica",
    variant: "neutral",
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [newEmployee, setNewEmployee] =
    useState<NewEmployeeForm>(EMPTY_EMPLOYEE_FORM);
  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActivationDialogOpen, setIsActivationDialogOpen] =
    useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const [activationUrl, setActivationUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchEmployees() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/employees");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener los empleados");
      }

      setEmployees(data);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Error desconocido"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  function upsertEmployee(employee: Employee) {
    setEmployees((previous) => {
      const exists = previous.some((item) => item.id === employee.id);

      if (!exists) {
        return [...previous, employee];
      }

      return previous.map((item) =>
        item.id === employee.id ? employee : item
      );
    });
  }

  function showActivationUrl(url: string) {
    setActivationUrl(url);
    setCopyFeedback("");
    setIsActivationDialogOpen(true);
  }

  async function copyActivationUrl() {
    try {
      await navigator.clipboard.writeText(activationUrl);
      setCopyFeedback("Enlace copiado.");
    } catch {
      setCopyFeedback(
        "No se pudo copiar. Seleccione y copie el enlace manualmente."
      );
    }
  }

  function openEditDialog(employee: Employee) {
    setActionError("");
    setSelectedEmployee({ ...employee });
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(employee: Employee) {
    setActionError("");
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  }

  function openResetDialog(employee: Employee) {
    setActionError("");
    setSelectedEmployee(employee);
    setIsResetDialogOpen(true);
  }

  const handleAddEmployee = async () => {
    setActionError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al agregar empleado");
      }

      upsertEmployee(data.employee);
      setNewEmployee({ ...EMPTY_EMPLOYEE_FORM });
      setIsAddDialogOpen(false);

      if (data.activationUrl) {
        showActivationUrl(data.activationUrl);
      }
    } catch (caughtError: unknown) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Error desconocido"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    setActionError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/employees", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedEmployee.id,
          name: selectedEmployee.name,
          phone: selectedEmployee.phone,
          role: selectedEmployee.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al editar el empleado");
      }

      upsertEmployee(data);
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
    } catch (caughtError: unknown) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Error desconocido"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    setActionError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedEmployee.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al borrar el empleado");
      }

      setEmployees((previous) =>
        previous.filter(
          (employee) => employee.id !== selectedEmployee.id
        )
      );
      setSelectedEmployee(null);
      setIsDeleteDialogOpen(false);
    } catch (caughtError: unknown) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Error desconocido"
      );
    } finally {
      setSubmitting(false);
    }
  };

  async function runAccountAction(
    employee: Employee,
    path: string,
    options?: {
      confirmReset?: boolean;
    }
  ) {
    setSelectedEmployee(employee);
    setActionError("");
    setSubmitting(true);

    try {
      const response = await fetch(path, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo completar la acción"
        );
      }

      if (data.employee) {
        upsertEmployee(data.employee);
      }

      if (options?.confirmReset) {
        setIsResetDialogOpen(false);
      }

      if (data.activationUrl) {
        showActivationUrl(data.activationUrl);
      }

      setSelectedEmployee(null);
    } catch (caughtError: unknown) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Error desconocido"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.trim().toLowerCase();
    const statusLabel =
      EMPLOYEE_STATUS_BADGES[
        employee.accountStatus
      ].label.toLowerCase();

    return (
      employee.name.toLowerCase().includes(query) ||
      employee.role.toLowerCase().includes(query) ||
      employee.phone.toLowerCase().includes(query) ||
      employee.user.toLowerCase().includes(query) ||
      employee.accountStatus.toLowerCase().includes(query) ||
      statusLabel.includes(query)
    );
  });

  const employeeStats = {
    total: employees.length,

    active: employees.filter(
      (employee) => employee.accountStatus === "ACTIVE"
    ).length,

    pending: employees.filter(
      (employee) => employee.accountStatus === "PENDING"
    ).length,

    disabled: employees.filter(
      (employee) => employee.accountStatus === "DISABLED"
    ).length,
  };

  if (loading) {
    return (
      <LoadingState
        title="Cargando empleados..."
        description="Por favor, espere mientras obtenemos las cuentas y sus estados."
        cardCount={4}
        rowCount={6}
      />
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          icon={Users}
          title="Error al cargar los empleados"
          description={error}
        />
      </div>
    );
  }

  const showGlobalActionError =
    actionError &&
    !isAddDialogOpen &&
    !isEditDialogOpen &&
    !isDeleteDialogOpen &&
    !isResetDialogOpen;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Empleados"
        description="Administre las cuentas, roles, estados y accesos de los empleados."
        actions={
          <Button
            type="button"
            onClick={() => {
              setActionError("");
              setIsAddDialogOpen(true);
            }}
            className="bg-elite-gradient text-white shadow-sm hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            Crear cuenta
          </Button>
        }
      />

      <section
        aria-label="Resumen de empleados"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total de empleados"
          value={employeeStats.total}
          icon={Users}
          tone="primary"
          helperText="Cuentas registradas"
        />

        <StatCard
          label="Cuentas activas"
          value={employeeStats.active}
          icon={UserCheck}
          tone="success"
          helperText="Empleados con acceso"
        />

        <StatCard
          label="Activación pendiente"
          value={employeeStats.pending}
          icon={Clock3}
          tone="warning"
          helperText="Cuentas por activar"
        />

        <StatCard
          label="Deshabilitadas"
          value={employeeStats.disabled}
          icon={UserX}
          tone="danger"
          helperText="Cuentas sin acceso"
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
            setNewEmployee({ ...EMPTY_EMPLOYEE_FORM });
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Crear cuenta de empleado
            </DialogTitle>

            <DialogDescription>
              El empleado recibirá un enlace de activación para establecer
              su propia contraseña. No ingrese una contraseña aquí.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">
                Nombre
              </Label>

              <Input
                id="employee-name"
                value={newEmployee.name}
                placeholder="Ejemplo: Juan Pérez"
                autoComplete="name"
                onChange={(event) =>
                  setNewEmployee({
                    ...newEmployee,
                    name: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-user">
                Usuario
              </Label>

              <Input
                id="employee-user"
                value={newEmployee.user}
                placeholder="Ejemplo: j.perez"
                autoComplete="username"
                onChange={(event) =>
                  setNewEmployee({
                    ...newEmployee,
                    user: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-role">
                Rol
              </Label>

              <select
                id="employee-role"
                value={newEmployee.role}
                onChange={(event) =>
                  setNewEmployee({
                    ...newEmployee,
                    role: event.target.value as AllowedRole,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {ALLOWED_ROLES.map((role) => (
                  <option
                    key={role}
                    value={role}
                  >
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-phone">
                Teléfono
              </Label>

              <Input
                id="employee-phone"
                type="tel"
                value={newEmployee.phone}
                placeholder="Ejemplo: 7000-0000"
                autoComplete="tel"
                onChange={(event) =>
                  setNewEmployee({
                    ...newEmployee,
                    phone: event.target.value,
                  })
                }
              />
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
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleAddEmployee}
              disabled={submitting}
              className="bg-elite-gradient text-white hover:opacity-90"
            >
              {submitting ? "Creando..." : "Crear cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SectionCard
        title="Listado de empleados"
        description="Consulte, busque y administre las cuentas registradas."
        contentClassName="p-0"
      >
        {employees.length > 0 && (
          <DataToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por nombre, usuario, rol, teléfono o estado"
            searchLabel="Buscar empleados"
            resultCount={filteredEmployees.length}
            totalCount={employees.length}
            resultNoun="empleados"
          />
        )}

        {filteredEmployees.length === 0 ? (
          <EmptyState
            icon={
              employees.length === 0
                ? Users
                : SearchX
            }
            title={
              employees.length === 0
                ? "Todavía no hay empleados"
                : "No se encontraron empleados"
            }
            description={
              employees.length === 0
                ? "Cree la primera cuenta para comenzar a administrar los accesos del personal."
                : `No existen resultados que coincidan con “${searchQuery}”.`
            }
            action={
              employees.length === 0 ? (
                <Button
                  type="button"
                  onClick={() => {
                    setActionError("");
                    setIsAddDialogOpen(true);
                  }}
                  className="bg-elite-gradient text-white hover:opacity-90"
                >
                  <PlusIcon className="h-4 w-4" />
                  Crear primera cuenta
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSearchQuery("")}
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Activación</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">
                    Opciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredEmployees.map((employee) => {
                  const statusBadge =
                    EMPLOYEE_STATUS_BADGES[
                      employee.accountStatus
                    ];
                  const activationBadge =
                    getActivationBadge(employee);

                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="min-w-48 font-medium text-foreground">
                        {employee.name}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {employee.user}
                      </TableCell>

                      <TableCell>
                        {employee.role}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          variant={statusBadge.variant}
                        >
                          {statusBadge.label}
                        </StatusBadge>
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          variant={activationBadge.variant}
                        >
                          {activationBadge.label}
                        </StatusBadge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {employee.phone}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="Editar empleado"
                            aria-label={`Editar ${employee.name}`}
                            disabled={submitting}
                            onClick={() =>
                              openEditDialog(employee)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {employee.accountStatus === "PENDING" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Regenerar enlace de activación"
                              aria-label={`Regenerar enlace de activación de ${employee.name}`}
                              disabled={submitting}
                              onClick={() =>
                                runAccountAction(
                                  employee,
                                  `/api/employees/${employee.id}/regenerate-activation`
                                )
                              }
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          )}

                          {employee.accountStatus === "ACTIVE" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Restablecer acceso"
                              aria-label={`Restablecer acceso de ${employee.name}`}
                              disabled={submitting}
                              onClick={() =>
                                openResetDialog(employee)
                              }
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}

                          {employee.accountStatus !== "DISABLED" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Deshabilitar cuenta"
                              aria-label={`Deshabilitar cuenta de ${employee.name}`}
                              disabled={submitting}
                              onClick={() =>
                                runAccountAction(
                                  employee,
                                  `/api/employees/${employee.id}/disable`
                                )
                              }
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Reactivar cuenta"
                              aria-label={`Reactivar cuenta de ${employee.name}`}
                              disabled={submitting}
                              onClick={() =>
                                runAccountAction(
                                  employee,
                                  `/api/employees/${employee.id}/reactivate`
                                )
                              }
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="Eliminar empleado"
                            aria-label={`Eliminar ${employee.name}`}
                            disabled={submitting}
                            className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() =>
                              openDeleteDialog(employee)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
            setSelectedEmployee(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar empleado</DialogTitle>

            <DialogDescription>
              Actualice el nombre, teléfono o rol. El usuario no se modifica desde este formulario.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-employee-name">
                  Nombre
                </Label>

                <Input
                  id="edit-employee-name"
                  value={selectedEmployee.name}
                  onChange={(event) =>
                    setSelectedEmployee({
                      ...selectedEmployee,
                      name: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-employee-role">
                  Rol
                </Label>

                <select
                  id="edit-employee-role"
                  value={selectedEmployee.role}
                  onChange={(event) =>
                    setSelectedEmployee({
                      ...selectedEmployee,
                      role: event.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {ALLOWED_ROLES.map((role) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-employee-phone">
                  Teléfono
                </Label>

                <Input
                  id="edit-employee-phone"
                  type="tel"
                  value={selectedEmployee.phone}
                  onChange={(event) =>
                    setSelectedEmployee({
                      ...selectedEmployee,
                      phone: event.target.value,
                    })
                  }
                />
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
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleEditEmployee}
              disabled={submitting || !selectedEmployee}
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
            setSelectedEmployee(null);
            setActionError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar empleado</DialogTitle>

            <DialogDescription>
              ¿Está seguro de que desea eliminar a{" "}
              <span className="font-semibold text-foreground">
                {selectedEmployee?.name}
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
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteEmployee}
              disabled={submitting || !selectedEmployee}
            >
              {submitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isActivationDialogOpen}
        onOpenChange={(open) => {
          setIsActivationDialogOpen(open);

          if (!open) {
            setActivationUrl("");
            setCopyFeedback("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enlace de activación</DialogTitle>

            <DialogDescription>
              Este enlace solo se mostrará una vez. Cópielo y entrégueselo de forma segura al empleado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              readOnly
              value={activationUrl}
              onFocus={(event) =>
                event.currentTarget.select()
              }
            />

            {copyFeedback && (
              <p
                aria-live="polite"
                className="text-sm text-emerald-700"
              >
                {copyFeedback}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={copyActivationUrl}
            >
              <Copy className="h-4 w-4" />
              Copiar enlace
            </Button>

            <Button
              type="button"
              onClick={() =>
                setIsActivationDialogOpen(false)
              }
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isResetDialogOpen}
        onOpenChange={(open) => {
          setIsResetDialogOpen(open);

          if (!open) {
            setSelectedEmployee(null);
            setActionError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer acceso</DialogTitle>

            <DialogDescription>
              Esto eliminará la contraseña actual, pondrá la cuenta en estado pendiente y generará un nuevo enlace de activación. El empleado no podrá iniciar sesión hasta que cree una nueva contraseña.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Se restablecerá el acceso de{" "}
              <span className="font-semibold">
                {selectedEmployee.name}
              </span>
              .
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
              onClick={() => setIsResetDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={submitting || !selectedEmployee}
              onClick={() => {
                if (!selectedEmployee) return;

                runAccountAction(
                  selectedEmployee,
                  `/api/employees/${selectedEmployee.id}/reset-access`,
                  {
                    confirmReset: true,
                  }
                );
              }}
            >
              {submitting
                ? "Restableciendo..."
                : "Confirmar restablecimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}