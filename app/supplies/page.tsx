//pagina de suministros
"use client";

import { useState, useEffect } from "react";
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
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

interface Supply {
  id: number;
  description: string;
  quantity: number;
}

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newSupply, setNewSupply] = useState<Omit<Supply, "id">>({
    description: "",
    quantity: 0,
  });
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // NUEVO: estado de búsqueda
  const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
      async function fetchSupplies() {
        try {
          const res = await fetch("/api/supplies");
          if (!res.ok) throw new Error("Error al obtener los suministros");
          const data = await res.json();
          setSupplies(data);
        } catch (err: any) {
          setError(err.message || "Error desconocido");
        } finally {
          setLoading(false);
        }
      }
      fetchSupplies();
    }, []);

  // CRUD
  const handleAddSupply = async () => {
    try {
      const res = await fetch("/api/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupply),
      });
      if (!res.ok) throw new Error("Error al agregar el suministro");
      const addedSupply = await res.json();
      setSupplies((prev) => [...prev, addedSupply]);
      setNewSupply({ description: "", quantity: 0 });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEditSupply = async () => {
    if (!selectedSupply) return;
    try {
      const res = await fetch("/api/supplies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedSupply),
      });
      if (!res.ok) throw new Error("Error al editar el suministro");
      const updatedSupply = await res.json();
      setSupplies((prev) =>
        prev.map((c) => (c.id === updatedSupply.id ? updatedSupply : c))
      );
      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteSupply = async () => {
    if (!selectedSupply) return;
    try {
      const res = await fetch("/api/supplies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSupply.id }),
      });
      if (!res.ok) throw new Error("Error al borrar el suministro");
      await res.json();
      setSupplies((prev) => prev.filter((c) => c.id !== selectedSupply.id));
      setSelectedSupply(null);
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Filtrado
  const filteredSupplies = supplies.filter((supply) => {
    const query = searchQuery.toLowerCase();
    return (
      supply.description.toLowerCase().includes(query) ||
      supply.quantity.toString().includes(query) // opcional
    );
  });

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Suministros</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Agregar Suministro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Suministro</DialogTitle>
              <DialogDescription>Ingrese los detalles del nuevo suministro.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="description"
                  value={newSupply.description}
                  onChange={(e) =>
                    setNewSupply({ ...newSupply, description: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newSupply.quantity}
                  onChange={(e) =>
                    setNewSupply({ ...newSupply, quantity: parseInt(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddSupply}>Agregar Suministro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campo de búsqueda */}
      <div className="mb-4 max-w-sm">
        <Input
          type="text"
          placeholder="Buscar por descripción o cantidad"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Opciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSupplies.map((supply) => (
            <TableRow key={supply.id}>
              <TableCell>{supply.description}</TableCell>
              <TableCell>{supply.quantity}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSupply(supply)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Suministro</DialogTitle>
                        <DialogDescription>Haga cambios al suministro.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-description" className="text-right">
                            Descripción
                          </Label>
                          <Input
                            id="edit-description"
                            value={selectedSupply?.description}
                            onChange={(e) =>
                              setSelectedSupply(
                                selectedSupply
                                  ? { ...selectedSupply, description: e.target.value }
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
                            value={selectedSupply?.quantity}
                            onChange={(e) =>
                              setSelectedSupply(
                                selectedSupply
                                  ? { ...selectedSupply, quantity: parseInt(e.target.value) }
                                  : null
                              )
                            }
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleEditSupply}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSupply(supply)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Borrar Suministro</DialogTitle>
                        <DialogDescription>
                          ¿Está seguro de que desea borrar el suministro? Esta acción no se puede revertir.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSupply}>
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
