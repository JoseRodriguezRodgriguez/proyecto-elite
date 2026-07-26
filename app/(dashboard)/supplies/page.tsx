//pagina de suministros
"use client";

import { useState, useEffect } from "react";
import { PlusIcon, Pencil, Trash2, Boxes, CircleOff, Package, SearchX } from 'lucide-react';
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
import { getErrorMessage } from "@/lib/errors";
import SectionCard from "@/components/dashboard/section-card";
import StatCard from "@/components/dashboard/stat-card";
import PageHeader from "@/components/dashboard/page-header";
import DataToolbar from "@/components/dashboard/data-toolbar";
import StatusBadge, { type StatusBadgeVariant } from "@/components/dashboard/status-badge";
import EmptyState from "@/components/dashboard/empty-state";
import LoadingState from "@/components/dashboard/loading-state";

interface Supply {
  id: number;
  description: string;
  quantity: number;
}

type SupplyStatus = {
  label: string;
  variant: StatusBadgeVariant;
};

function getSupplyStatus(
  quantity: number
): SupplyStatus {
  if (quantity <= 0) {
    return {
      label: "Sin existencias",
      variant: "danger",
    };
  }

  if (quantity <= 5) {
    return {
      label: "Existencias bajas",
      variant: "warning",
    };
  }

  return {
    label: "Disponible",
    variant: "success",
  };
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
        } catch (error: unknown) {
          setError(
            getErrorMessage(error, "Error al obtener los suministros")
          );
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
    } catch (error: unknown) {
      const message = getErrorMessage(
        error, 
        "No se pudo completar la operación. Por favor, inténtelo de nuevo."
      );
      setError(message);
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
    } catch (error: unknown) {
      const message = getErrorMessage(
        error, 
        "No se pudo completar la operación. Por favor, inténtelo de nuevo."
      );
      setError(message);
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
    } catch (error: unknown) {
      const message = getErrorMessage(
        error, 
        "No se pudo completar la operación. Por favor, inténtelo de nuevo."
      );
      setError(message);
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

  const supplyStats = {
  total: supplies.length,

  units: supplies.reduce(
    (total, supply) =>
      total + supply.quantity,
    0
  ),

  outOfStock: supplies.filter(
    (supply) => supply.quantity <= 0
  ).length,
};

  if (loading) {
    return (
      <LoadingState
        title="Cargando suministros..."
        description="Por favor, espere mientras obtenemos los datos."
        cardCount={3}
        rowCount={5}
      />
    )
  }

  if (error) {
    return(
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Error al cargar los suministros"
          description={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Suministros"
        description="Administre las existencias y cantidades de los suministros registrados."
        actions={
          <Button
            type="button"
            onClick={() =>
              setIsAddDialogOpen(true)
            }
            className="bg-elite-gradient text-white shadow-sm hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            Agregar suministro
          </Button>
        }
      />
  
      {/* Tarjetas estadísticas */}
      <section
        aria-label="Resumen de suministros"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <StatCard
          label="Suministros registrados"
          value={supplyStats.total}
          icon={Package}
          tone="primary"
          helperText="Tipos de suministros"
        />
  
        <StatCard
          label="Unidades disponibles"
          value={supplyStats.units}
          icon={Boxes}
          tone="success"
          helperText="Suma de todas las existencias"
        />
  
        <StatCard
          label="Sin existencias"
          value={supplyStats.outOfStock}
          icon={CircleOff}
          tone="danger"
          helperText="Suministros agotados"
        />
      </section>
      
      {/* Diálogo para agregar */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
        
          if (!open) {
            setNewSupply({
              description: "",
              quantity: 0,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Agregar nuevo suministro
            </DialogTitle>
      
            <DialogDescription>
              Ingrese la descripción y la cantidad disponible del nuevo
              suministro.
            </DialogDescription>
          </DialogHeader>
      
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción
              </Label>
      
              <Input
                id="description"
                value={newSupply.description}
                placeholder="Ejemplo: Detergente industrial"
                onChange={(event) =>
                  setNewSupply({
                    ...newSupply,
                    description:
                      event.target.value,
                  })
                }
              />
            </div>
              
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Cantidad
              </Label>
              
              <Input
                id="quantity"
                type="number"
                min={0}
                value={newSupply.quantity}
                onChange={(event) => {
                  const quantity =
                    Number(event.target.value);
                
                  setNewSupply({
                    ...newSupply,
                    quantity: Number.isNaN(
                      quantity
                    )
                      ? 0
                      : quantity,
                  });
                }}
              />
            </div>
          </div>
              
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setIsAddDialogOpen(false)
              }
            >
              Cancelar
            </Button>
            
            <Button
              type="button"
              onClick={handleAddSupply}
              className="bg-elite-gradient text-white hover:opacity-90"
            >
              Agregar suministro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            
      {/* Listado */}
      <SectionCard
        title="Listado de suministros"
        description="Consulte, busque y administre las existencias registradas."
        contentClassName="p-0"
      >
        {supplies.length > 0 && (
          <DataToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por descripción o cantidad"
            searchLabel="Buscar suministros"
            resultCount={
              filteredSupplies.length
            }
            totalCount={supplies.length}
            resultNoun="suministros"
          />
        )}
  
        {filteredSupplies.length === 0 ? (
          <EmptyState
            icon={
              supplies.length === 0
                ? Package
                : SearchX
            }
            title={
              supplies.length === 0
                ? "Todavía no hay suministros"
                : "No se encontraron suministros"
            }
            description={
              supplies.length === 0
                ? "Agregue el primer suministro para comenzar a controlar las existencias."
                : `No existen resultados que coincidan con “${searchQuery}”.`
            }
            action={
              supplies.length === 0 ? (
                <Button
                  type="button"
                  onClick={() =>
                    setIsAddDialogOpen(true)
                  }
                  className="bg-elite-gradient text-white hover:opacity-90"
                >
                  <PlusIcon className="h-4 w-4" />
                  Agregar primer suministro
                </Button>
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
                    Descripción
                  </TableHead>
        
                  <TableHead>
                    Cantidad
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
                {filteredSupplies.map(
                  (supply) => {
                    const supplyStatus =
                      getSupplyStatus(
                        supply.quantity
                      );
                    
                    return (
                      <TableRow
                        key={supply.id}
                      >
                        <TableCell className="min-w-64 font-medium text-foreground">
                          {supply.description}
                        </TableCell>
                    
                        <TableCell>
                          {supply.quantity}
                        </TableCell>
                    
                        <TableCell>
                          <StatusBadge
                            variant={
                              supplyStatus.variant
                            }
                          >
                            {supplyStatus.label}
                          </StatusBadge>
                        </TableCell>
                          
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {/* Editar */}
                            <Dialog
                              open={
                                isEditDialogOpen &&
                                selectedSupply?.id ===
                                  supply.id
                              }
                              onOpenChange={(
                                open
                              ) => {
                                setIsEditDialogOpen(
                                  open
                                );
                              
                                if (open) {
                                  setSelectedSupply(
                                    supply
                                  );
                                } else {
                                  setSelectedSupply(
                                    null
                                  );
                                }
                              }}
                            >
                              <DialogTrigger
                                asChild
                              >
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  title="Editar suministro"
                                  aria-label={`Editar ${supply.description}`}
                                  onClick={() =>
                                    setSelectedSupply(
                                      supply
                                    )
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                                
                              <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>
                                    Editar suministro
                                  </DialogTitle>
                                
                                  <DialogDescription>
                                    Actualice la descripción o la cantidad
                                    disponible.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedSupply && (
                                  <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-description">
                                        Descripción
                                      </Label>
                                
                                      <Input
                                        id="edit-description"
                                        value={
                                          selectedSupply.description
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          setSelectedSupply(
                                            {
                                              ...selectedSupply,
                                              description:
                                                event
                                                  .target
                                                  .value,
                                            }
                                          )
                                        }
                                      />
                                    </div>
                                      
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-quantity">
                                        Cantidad
                                      </Label>
                                      
                                      <Input
                                        id="edit-quantity"
                                        type="number"
                                        min={0}
                                        value={
                                          selectedSupply.quantity
                                        }
                                        onChange={(
                                          event
                                        ) => {
                                          const quantity =
                                            Number(
                                              event
                                                .target
                                                .value
                                            );
                                          
                                          setSelectedSupply(
                                            {
                                              ...selectedSupply,
                                              quantity:
                                                Number.isNaN(
                                                  quantity
                                                )
                                                  ? 0
                                                  : quantity,
                                            }
                                          );
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
  
                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      setIsEditDialogOpen(
                                        false
                                      )
                                    }
                                  >
                                    Cancelar
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    onClick={
                                      handleEditSupply
                                    }
                                  >
                                    Guardar cambios
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                                  
                            {/* Eliminar */}
                            <Dialog
                              open={
                                isDeleteDialogOpen &&
                                selectedSupply?.id ===
                                  supply.id
                              }
                              onOpenChange={(
                                open
                              ) => {
                                setIsDeleteDialogOpen(
                                  open
                                );
                              
                                if (open) {
                                  setSelectedSupply(
                                    supply
                                  );
                                } else {
                                  setSelectedSupply(
                                    null
                                  );
                                }
                              }}
                            >
                              <DialogTrigger
                                asChild
                              >
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  title="Eliminar suministro"
                                  aria-label={`Eliminar ${supply.description}`}
                                  className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    setSelectedSupply(
                                      supply
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                                
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Eliminar suministro
                                  </DialogTitle>
                                
                                  <DialogDescription>
                                    ¿Está seguro de que desea eliminar{" "}
                                    <span className="font-semibold text-foreground">
                                      {
                                        selectedSupply?.description
                                      }
                                    </span>
                                    ? Esta acción no se puede revertir.
                                  </DialogDescription>
                                </DialogHeader>
                                    
                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      setIsDeleteDialogOpen(
                                        false
                                      )
                                    }
                                  >
                                    Cancelar
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={
                                      handleDeleteSupply
                                    }
                                  >
                                    Eliminar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
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
    </div>
  );
}