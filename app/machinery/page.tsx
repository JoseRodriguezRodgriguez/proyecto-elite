"use client";

import { useEffect, useState } from "react";
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

interface Machinery {
  id: number;
  category: string;
  description: string;
  brand: string;
  quantity: number;
}

export default function MachineryPage() {
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newMachinery, setNewMachinery] = useState<Omit<Machinery, "id">>({
    category: "",
    description: "",
    brand: "",
    quantity: 0,
  });
  const [selectedMachinery, setSelectedMachinery] = useState<Machinery | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // NUEVO: estado de búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchMachinery() {
      try {
        const res = await fetch("/api/machinery");
        if (!res.ok) throw new Error("Error al obtener la maquinaria");
        const data = await res.json();
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchMachinery();
  }, [])

  // CRUD
  const handleAddMachinery = async () => {
    try {
      const res = await fetch("/api/machinery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMachinery),
      });
      if(!res.ok) throw new Error("Error al agregar la maquinaria");
      const addedMachinery = await res.json();
      setMachinery((prev) => [...prev, addedMachinery]);
      setNewMachinery({ category: "", description: "", brand: "", quantity: 0 })
      setIsAddDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEditMachinery = async () => {
    if(!selectedMachinery) return;
    try {
      const res = await fetch("/api/machinery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedMachinery),
      });
      if (!res.ok) throw new Error("Error al editar la maquinaria");
      const updatedMachinery = await res.json();
      setMachinery((prev) =>
        prev.map((c) => (c.id === updatedMachinery.id ? updatedMachinery : c))
      );
      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteMachinery =async () => {
    if (!selectedMachinery) return;
    try {
      const res = await fetch("/api/machinery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMachinery.id }),
      });
      if (!res.ok) throw new Error("Error al borrar el empleado");
      await res.json();
      setMachinery((prev) => prev.filter((c) => c.id !== selectedMachinery.id));
      setSelectedMachinery(null);
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  // Filtrado
  const filteredMachinery = machinery.filter((machine) => {
    const query = searchQuery.toLowerCase();
    return (
      machine.category.toLowerCase().includes(query) ||
      machine.description.toLowerCase().includes(query) ||
      machine.brand.toLowerCase().includes(query) ||
      machine.quantity.toString().includes(query) // opcional
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Maquinaria</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Agregar Maquinaria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Maquinaria</DialogTitle>
              <DialogDescription>Ingrese los detalles de la nueva maquinaria.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Categoría</Label>
                <Input
                  id="category"
                  value={newMachinery.category}
                  onChange={(e) => setNewMachinery({ ...newMachinery, category: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Descripción</Label>
                <Input
                  id="description"
                  value={newMachinery.description}
                  onChange={(e) => setNewMachinery({ ...newMachinery, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="brand" className="text-right">Marca</Label>
                <Input
                  id="brand"
                  value={newMachinery.brand}
                  onChange={(e) => setNewMachinery({ ...newMachinery, brand: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newMachinery.quantity}
                  onChange={(e) =>
                    setNewMachinery({ ...newMachinery, quantity: parseInt(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMachinery}>Agregar Maquinaria</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campo de búsqueda */}
      <div className="mb-4 max-w-sm">
        <Input
          type="text"
          placeholder="Buscar por categoría, descripción, marca o cantidad"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Categoría</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Opciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMachinery.map((machine) => (
            <TableRow key={machine.id}>
              <TableCell>{machine.category}</TableCell>
              <TableCell>{machine.description}</TableCell>
              <TableCell>{machine.brand}</TableCell>
              <TableCell>{machine.quantity}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMachinery(machine)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Maquinaria</DialogTitle>
                        <DialogDescription>Haga cambios a la maquinaria.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-category" className="text-right">
                            Categoría
                          </Label>
                          <Input
                            id="edit-category"
                            value={selectedMachinery?.category}
                            onChange={(e) =>
                              setSelectedMachinery(
                                selectedMachinery
                                  ? { ...selectedMachinery, category: e.target.value }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-description" className="text-right">
                            Descripción
                          </Label>
                          <Input
                            id="edit-description"
                            value={selectedMachinery?.description}
                            onChange={(e) =>
                              setSelectedMachinery(
                                selectedMachinery
                                  ? { ...selectedMachinery, description: e.target.value }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-brand" className="text-right">
                            Marca
                          </Label>
                          <Input
                            id="edit-brand"
                            value={selectedMachinery?.brand}
                            onChange={(e) =>
                              setSelectedMachinery(
                                selectedMachinery
                                  ? { ...selectedMachinery, brand: e.target.value }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-quantity" className="text-right">
                            Cantidad
                          </Label>
                          <Input
                            id="edit-quantity"
                            type="number"
                            value={selectedMachinery?.quantity}
                            onChange={(e) =>
                              setSelectedMachinery(
                                selectedMachinery
                                  ? { ...selectedMachinery, quantity: parseInt(e.target.value) }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleEditMachinery}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMachinery(machine)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Borrar Maquinaria</DialogTitle>
                        <DialogDescription>
                          ¿Está seguro de que desea borrar la maquinaria? Esta acción no se puede revertir.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteMachinery}>
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
