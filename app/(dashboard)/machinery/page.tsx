//pagina de maquinaria
"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Pencil, Trash2, Boxes, CircleOff, SearchX, Tags, Wrench } from "lucide-react";
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

interface Machinery {
  id: number;
  category: string;
  description: string;
  brand: string;
  quantity: number;
}

type MachineryAvailability = {
  label: string;
  variant: StatusBadgeVariant;
};

function getMachineryAvailability(
  quantity: number
): MachineryAvailability {
  if (quantity <= 0) {
    return {
      label: "Sin disponibilidad",
      variant: "danger",
    };
  }

  if (quantity === 1) {
    return {
      label: "Última unidad",
      variant: "warning",
    };
  }

  return {
    label: "Disponible",
    variant: "success",
  };
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
        if (!res.ok) {
          throw new Error("Error al obtener la maquinaria");
        }
        const data: Machinery[] = await res.json();
        setMachinery(data);
      } catch (error: unknown) {
        setError(
          getErrorMessage(error, "Error al obtener la maquinaria")
        );
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
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "No se pudo completar la operación. Por favor, inténtelo de nuevo."
      );
      setError(message);
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
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "No se pudo completar la operación. Por favor, inténtelo de nuevo."
      );
      setError(message);
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
      if (!res.ok) throw new Error("Error al borrar la maquinaria");
      await res.json();
      setMachinery((prev) => prev.filter((c) => c.id !== selectedMachinery.id));
      setSelectedMachinery(null);
      setIsDeleteDialogOpen(false);
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "No se pudo completar la operación. Por favor, inténtelo de nuevo."
      );
      setError(message);
    }
  };

  if (loading) {
    return (
      <LoadingState
        title="Cargando maquinaria..."
        description="Por favor, espere mientras obtenemos los datos."
        cardCount={4}
        rowCount={5}
      />
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Error al cargar la maquinaria"
          description={error}
        />
      </div>
    )
  }

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

  const machineryStats = {
    total: machinery.length,

    units: machinery.reduce(
      (total, machine) =>
        total + machine.quantity,
      0
    ),

    categories: new Set(
      machinery
        .map((machine) =>
          machine.category
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    ).size,

    unavailable: machinery.filter(
      (machine) => machine.quantity <= 0
    ).length,
  };

  return (
  <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader
      title="Maquinaria"
      description="Administre la maquinaria registrada, sus categorías, marcas y disponibilidad."
      actions={
        <Button
          type="button"
          onClick={() =>
            setIsAddDialogOpen(true)
          }
          className="bg-elite-gradient text-white shadow-sm hover:opacity-90"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar maquinaria
        </Button>
      }
    />

    {/* Estadísticas */}
    <section
      aria-label="Resumen de maquinaria"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        label="Maquinaria registrada"
        value={machineryStats.total}
        icon={Wrench}
        tone="primary"
        helperText="Registros en el inventario"
      />

      <StatCard
        label="Unidades totales"
        value={machineryStats.units}
        icon={Boxes}
        tone="success"
        helperText="Suma de todas las unidades"
      />

      <StatCard
        label="Categorías"
        value={machineryStats.categories}
        icon={Tags}
        tone="neutral"
        helperText="Categorías diferentes"
      />

      <StatCard
        label="Sin disponibilidad"
        value={machineryStats.unavailable}
        icon={CircleOff}
        tone="danger"
        helperText="Registros con cero unidades"
      />
    </section>

    {/* Diálogo para agregar */}
    <Dialog
      open={isAddDialogOpen}
      onOpenChange={(open) => {
        setIsAddDialogOpen(open);

        if (!open) {
          setNewMachinery({
            category: "",
            description: "",
            brand: "",
            quantity: 0,
          });
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Agregar nueva maquinaria
          </DialogTitle>

          <DialogDescription>
            Ingrese la categoría, descripción, marca y cantidad disponible.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">
              Categoría
            </Label>

            <Input
              id="category"
              value={newMachinery.category}
              placeholder="Ejemplo: Equipo de jardinería"
              onChange={(event) =>
                setNewMachinery({
                  ...newMachinery,
                  category:
                    event.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción
            </Label>

            <Input
              id="description"
              value={newMachinery.description}
              placeholder="Ejemplo: Cortadora de césped industrial"
              onChange={(event) =>
                setNewMachinery({
                  ...newMachinery,
                  description:
                    event.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">
              Marca
            </Label>

            <Input
              id="brand"
              value={newMachinery.brand}
              placeholder="Ejemplo: Husqvarna"
              onChange={(event) =>
                setNewMachinery({
                  ...newMachinery,
                  brand:
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
              value={newMachinery.quantity}
              onChange={(event) => {
                const quantity = Number(
                  event.target.value
                );

                setNewMachinery({
                  ...newMachinery,
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
            onClick={handleAddMachinery}
            className="bg-elite-gradient text-white hover:opacity-90"
          >
            Agregar maquinaria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Listado */}
    <SectionCard
      title="Inventario de maquinaria"
      description="Consulte, busque y administre la maquinaria registrada."
      contentClassName="p-0"
    >
      {machinery.length > 0 && (
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar por categoría, descripción, marca o cantidad"
          searchLabel="Buscar maquinaria"
          resultCount={
            filteredMachinery.length
          }
          totalCount={machinery.length}
          resultNoun="registros"
        />
      )}

      {filteredMachinery.length === 0 ? (
        <EmptyState
          icon={
            machinery.length === 0
              ? Wrench
              : SearchX
          }
          title={
            machinery.length === 0
              ? "Todavía no hay maquinaria"
              : "No se encontró maquinaria"
          }
          description={
            machinery.length === 0
              ? "Agregue el primer registro para comenzar a controlar la maquinaria disponible."
              : `No existen resultados que coincidan con “${searchQuery}”.`
          }
          action={
            machinery.length === 0 ? (
              <Button
                type="button"
                onClick={() =>
                  setIsAddDialogOpen(true)
                }
                className="bg-elite-gradient text-white hover:opacity-90"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar primera maquinaria
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
                  Categoría
                </TableHead>

                <TableHead>
                  Descripción
                </TableHead>

                <TableHead>
                  Marca
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
              {filteredMachinery.map(
                (machine) => {
                  const availability =
                    getMachineryAvailability(
                      machine.quantity
                    );

                  return (
                    <TableRow
                      key={machine.id}
                    >
                      <TableCell className="font-medium text-foreground">
                        {machine.category}
                      </TableCell>

                      <TableCell className="min-w-64">
                        {machine.description}
                      </TableCell>

                      <TableCell>
                        {machine.brand}
                      </TableCell>

                      <TableCell>
                        {machine.quantity}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          variant={
                            availability.variant
                          }
                        >
                          {availability.label}
                        </StatusBadge>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {/* Editar */}
                          <Dialog
                            open={
                              isEditDialogOpen &&
                              selectedMachinery?.id ===
                                machine.id
                            }
                            onOpenChange={(
                              open
                            ) => {
                              setIsEditDialogOpen(
                                open
                              );

                              if (open) {
                                setSelectedMachinery(
                                  machine
                                );
                              } else {
                                setSelectedMachinery(
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
                                title="Editar maquinaria"
                                aria-label={`Editar ${machine.description}`}
                                onClick={() =>
                                  setSelectedMachinery(
                                    machine
                                  )
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>

                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>
                                  Editar maquinaria
                                </DialogTitle>

                                <DialogDescription>
                                  Actualice los datos del registro seleccionado.
                                </DialogDescription>
                              </DialogHeader>

                              {selectedMachinery && (
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-category">
                                      Categoría
                                    </Label>

                                    <Input
                                      id="edit-category"
                                      value={
                                        selectedMachinery.category
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setSelectedMachinery(
                                          {
                                            ...selectedMachinery,
                                            category:
                                              event
                                                .target
                                                .value,
                                          }
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">
                                      Descripción
                                    </Label>

                                    <Input
                                      id="edit-description"
                                      value={
                                        selectedMachinery.description
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setSelectedMachinery(
                                          {
                                            ...selectedMachinery,
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
                                    <Label htmlFor="edit-brand">
                                      Marca
                                    </Label>

                                    <Input
                                      id="edit-brand"
                                      value={
                                        selectedMachinery.brand
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setSelectedMachinery(
                                          {
                                            ...selectedMachinery,
                                            brand:
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
                                        selectedMachinery.quantity
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

                                        setSelectedMachinery(
                                          {
                                            ...selectedMachinery,
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
                                    handleEditMachinery
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
                              selectedMachinery?.id ===
                                machine.id
                            }
                            onOpenChange={(
                              open
                            ) => {
                              setIsDeleteDialogOpen(
                                open
                              );

                              if (open) {
                                setSelectedMachinery(
                                  machine
                                );
                              } else {
                                setSelectedMachinery(
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
                                title="Eliminar maquinaria"
                                aria-label={`Eliminar ${machine.description}`}
                                className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  setSelectedMachinery(
                                    machine
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Eliminar maquinaria
                                </DialogTitle>

                                <DialogDescription>
                                  ¿Está seguro de que desea eliminar{" "}
                                  <span className="font-semibold text-foreground">
                                    {
                                      selectedMachinery?.description
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
                                    handleDeleteMachinery
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