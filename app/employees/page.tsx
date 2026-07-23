"use client";

import { useEffect, useState } from "react";
import {
  PlusIcon,
  Pencil,
  Trash2,
  Copy,
  Link2,
  Ban,
  RotateCcw,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ALLOWED_ROLES, type AllowedRole } from "@/lib/auth/constants";

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>({
    name: "",
    phone: "",
    user: "",
    role: "EMPLOYEE",
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActivationDialogOpen, setIsActivationDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [activationUrl, setActivationUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchEmployees() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al obtener los empleados");
      }
      setEmployees(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  function upsertEmployee(employee: Employee) {
    setEmployees((prev) => {
      const exists = prev.some((item) => item.id === employee.id);
      if (!exists) return [...prev, employee];
      return prev.map((item) => (item.id === employee.id ? employee : item));
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
      setCopyFeedback("No se pudo copiar. Seleccione y copie manualmente.");
    }
  }

  const handleAddEmployee = async () => {
    setActionError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al agregar empleado");
      }
      upsertEmployee(data.employee);
      setNewEmployee({ name: "", phone: "", user: "", role: "EMPLOYEE" });
      setIsAddDialogOpen(false);
      if (data.activationUrl) {
        showActivationUrl(data.activationUrl);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;
    setActionError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEmployee.id,
          name: selectedEmployee.name,
          phone: selectedEmployee.phone,
          role: selectedEmployee.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al editar el empleado");
      }
      upsertEmployee(data);
      setIsEditDialogOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    setActionError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEmployee.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al borrar el empleado");
      }
      setEmployees((prev) => prev.filter((c) => c.id !== selectedEmployee.id));
      setSelectedEmployee(null);
      setIsDeleteDialogOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  async function runAccountAction(
    path: string,
    options?: { confirmReset?: boolean }
  ) {
    if (!selectedEmployee) return;
    setActionError("");
    setSubmitting(true);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo completar la acción");
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
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.role.toLowerCase().includes(query) ||
      employee.phone.toLowerCase().includes(query) ||
      employee.user.toLowerCase().includes(query) ||
      employee.accountStatus.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Empleados</h1>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Crear cuenta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear cuenta de empleado</DialogTitle>
              <DialogDescription>
                El empleado recibirá un enlace de activación para establecer su
                propia contraseña. No ingrese una contraseña aquí.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user" className="text-right">
                  Usuario
                </Label>
                <Input
                  id="user"
                  value={newEmployee.user}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, user: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="ej. j.perez"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rol
                </Label>
                <select
                  id="role"
                  value={newEmployee.role}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      role: e.target.value as AllowedRole,
                    })
                  }
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ALLOWED_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, phone: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            {actionError && (
              <p className="text-sm text-red-500 mb-2">{actionError}</p>
            )}
            <DialogFooter>
              <Button onClick={handleAddEmployee} disabled={submitting}>
                {submitting ? "Creando..." : "Crear cuenta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          type="text"
          placeholder="Buscar por nombre, usuario, rol o estado"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {actionError && !isAddDialogOpen && (
        <p className="text-sm text-red-500 mb-4">{actionError}</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Activación</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Opciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.user}</TableCell>
              <TableCell>{employee.role}</TableCell>
              <TableCell>{employee.accountStatus}</TableCell>
              <TableCell>
                {employee.hasPendingActivation
                  ? "Enlace vigente"
                  : employee.accountStatus === "PENDING"
                    ? "Sin enlace vigente"
                    : "—"}
              </TableCell>
              <TableCell>{employee.phone}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Dialog
                    open={isEditDialogOpen && selectedEmployee?.id === employee.id}
                    onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (open) setSelectedEmployee(employee);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Empleado</DialogTitle>
                        <DialogDescription>
                          Actualice nombre, teléfono o rol. El usuario no se
                          modifica aquí.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-name" className="text-right">
                            Nombre
                          </Label>
                          <Input
                            id="edit-name"
                            value={selectedEmployee?.name ?? ""}
                            onChange={(e) =>
                              setSelectedEmployee(
                                selectedEmployee
                                  ? {
                                      ...selectedEmployee,
                                      name: e.target.value,
                                    }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-role" className="text-right">
                            Rol
                          </Label>
                          <select
                            id="edit-role"
                            value={selectedEmployee?.role ?? "EMPLOYEE"}
                            onChange={(e) =>
                              setSelectedEmployee(
                                selectedEmployee
                                  ? {
                                      ...selectedEmployee,
                                      role: e.target.value,
                                    }
                                  : null
                              )
                            }
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {ALLOWED_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-phone" className="text-right">
                            Teléfono
                          </Label>
                          <Input
                            id="edit-phone"
                            value={selectedEmployee?.phone ?? ""}
                            onChange={(e) =>
                              setSelectedEmployee(
                                selectedEmployee
                                  ? {
                                      ...selectedEmployee,
                                      phone: e.target.value,
                                    }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleEditEmployee} disabled={submitting}>
                          Guardar Cambios
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {employee.accountStatus === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Regenerar enlace de activación"
                      disabled={submitting}
                      onClick={() => {
                        setSelectedEmployee(employee);
                        runAccountAction(
                          `/api/employees/${employee.id}/regenerate-activation`
                        );
                      }}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  )}

                  {employee.accountStatus === "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Restablecer acceso"
                      disabled={submitting}
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setIsResetDialogOpen(true);
                      }}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  )}

                  {employee.accountStatus !== "DISABLED" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Deshabilitar cuenta"
                      disabled={submitting}
                      onClick={() => {
                        setSelectedEmployee(employee);
                        runAccountAction(`/api/employees/${employee.id}/disable`);
                      }}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Reactivar cuenta"
                      disabled={submitting}
                      onClick={() => {
                        setSelectedEmployee(employee);
                        runAccountAction(
                          `/api/employees/${employee.id}/reactivate`
                        );
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}

                  <Dialog
                    open={
                      isDeleteDialogOpen && selectedEmployee?.id === employee.id
                    }
                    onOpenChange={(open) => {
                      setIsDeleteDialogOpen(open);
                      if (open) setSelectedEmployee(employee);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                        title="Borrar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Borrar Empleado</DialogTitle>
                        <DialogDescription>
                          ¿Está seguro de que desea borrar al empleado? Esta
                          acción no se puede revertir.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteEmployee}
                          disabled={submitting}
                        >
                          Borrar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isActivationDialogOpen} onOpenChange={setIsActivationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enlace de activación</DialogTitle>
            <DialogDescription>
              Este enlace de activación solo se mostrará una vez. Cópielo y
              entrégueselo de forma segura al empleado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input readOnly value={activationUrl} />
            {copyFeedback && (
              <p className="text-sm text-green-700">{copyFeedback}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyActivationUrl}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar enlace
            </Button>
            <Button onClick={() => setIsActivationDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer acceso</DialogTitle>
            <DialogDescription>
              Esto eliminará la contraseña actual, pondrá la cuenta en PENDING y
              generará un nuevo enlace de activación. El empleado no podrá
              iniciar sesión hasta que cree una nueva contraseña.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={submitting || !selectedEmployee}
              onClick={() =>
                selectedEmployee &&
                runAccountAction(
                  `/api/employees/${selectedEmployee.id}/reset-access`,
                  { confirmReset: true }
                )
              }
            >
              Confirmar restablecimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
