//pagina de empleados
"use client";

import { useState, useEffect } from "react";
import { PlusIcon, Pencil, Trash2 } from "lucide-react";
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

interface Employee {
  id: number;
  name: string;
  role: string;
  phone: string;
}

export default function EmployeesPage() {
  // Datos iniciales
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para creación/edición
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({
    name: "",
    role: "",
    phone: "",
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // NUEVO: estado de búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchemployees() {
      try {
        const res = await fetch("/api/employees");
        if (!res.ok) throw new Error("Error al obtener los empleados");
        const data = await res.json();
        setEmployees(data);
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchemployees();
  }, [])

  // CRUD
  const handleAddEmployee = async () => {
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });
      if(!res.ok) throw new Error("Error al algregar empleado");
      const addedEmployee = await res.json();
      setEmployees((prev) => [...prev, addedEmployee]);
      setNewEmployee({ name: "", role: "", phone: ""});
      setIsAddDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEditEmployee = async () => {
    if(!selectedEmployee) return;
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedEmployee),
      });
      if (!res.ok) throw new Error("Error al editar el empleado");
      const updatedEmployee = await res.json();
      setEmployees((prev) =>
        prev.map((c) => (c.id === updatedEmployee.id ? updatedEmployee : c))
      );
      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      const res = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEmployee.id }),
      });
      if (!res.ok) throw new Error("Error al borrar el empleado");
      await res.json();
      setEmployees((prev) => prev.filter((c) => c.id !== selectedEmployee.id));
      setSelectedEmployee(null);
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  // Filtrado
  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.role.toLowerCase().includes(query) ||
      employee.phone.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Empleados</h1>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Agregar Empleado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
              <DialogDescription>Ingrese la información del nuevo empleado.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Cargo</Label>
                <Input
                  id="role"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Teléfono</Label>
                <Input
                  id="phone"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddEmployee}>Agregar Empleado</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campo de búsqueda */}
      <div className="mb-4 max-w-sm">
        <Input
          type="text"
          placeholder="Buscar por nombre, cargo o teléfono"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Opciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.role}</TableCell>
              <TableCell>{employee.phone}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Empleado</DialogTitle>
                        <DialogDescription>Haga cambios al empleado.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-name" className="text-right">
                            Nombre
                          </Label>
                          <Input
                            id="edit-name"
                            value={selectedEmployee?.name}
                            onChange={(e) =>
                              setSelectedEmployee(
                                selectedEmployee
                                  ? { ...selectedEmployee, name: e.target.value }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-role" className="text-right">
                            Cargo
                          </Label>
                          <Input
                            id="edit-role"
                            value={selectedEmployee?.role}
                            onChange={(e) =>
                              setSelectedEmployee(
                                selectedEmployee
                                  ? { ...selectedEmployee, role: e.target.value }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-phone" className="text-right">
                            Teléfono
                          </Label>
                          <Input
                            id="edit-phone"
                            value={selectedEmployee?.phone}
                            onChange={(e) =>
                              setSelectedEmployee(
                                selectedEmployee
                                  ? { ...selectedEmployee, phone: e.target.value }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleEditEmployee}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Borrar Empleado</DialogTitle>
                        <DialogDescription>
                          ¿Esta seguro de que desea borrar al empleado? Esta acción no se puede revertir.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteEmployee}>
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
    </div>
  );
}
