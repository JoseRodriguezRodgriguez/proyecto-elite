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

// Interfaz del cliente en el front-end
interface Client {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  classification: string; // "verde" | "amarillo" | "rojo"
  notes?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  // Diálogos
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Para "ver notas"
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notesToShow, setNotesToShow] = useState("");

  // Cliente nuevo
  const [newClient, setNewClient] = useState<Omit<Client, "id">>({
    name: "",
    address: "",
    phone: "",
    email: "",
    classification: "verde", // por defecto
    notes: "",
  });

  // Cliente seleccionado para editar / eliminar
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Cargar datos al montar
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) throw new Error("Error al obtener los clientes");
        const data = await res.json();
        setClients(data);
      } catch (err: any) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  // Filtrado según searchQuery
  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.address.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query)
    );
  });

  // Crear cliente (POST)
  const handleAddClient = async () => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      if (!res.ok) throw new Error("Error al agregar el cliente");
      const addedClient = await res.json();
      setClients((prev) => [...prev, addedClient]);
      // Reiniciar
      setNewClient({
        name: "",
        address: "",
        phone: "",
        email: "",
        classification: "verde",
        notes: "",
      });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Editar cliente (PATCH)
  const handleEditClient = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch("/api/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedClient),
      });
      if (!res.ok) throw new Error("Error al editar el cliente");
      const updatedClient = await res.json();
      setClients((prev) =>
        prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
      );
      setIsEditDialogOpen(false);
      setSelectedClient(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Eliminar cliente (DELETE)
  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch("/api/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedClient.id }),
      });
      if (!res.ok) throw new Error("Error al borrar el cliente");
      await res.json();
      setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
      setSelectedClient(null);
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Clientes</h1>

        {/* Diálogo para agregar */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Ingrese los detalles del nuevo cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Nombre */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              {/* Dirección */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Dirección
                </Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) =>
                    setNewClient({ ...newClient, address: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              {/* Teléfono */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              {/* Email */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              {/* Clasificación: 3 botones */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Clasificación</Label>
                <div className="col-span-3 flex gap-2">
                  <Button
                    type="button"
                    variant={
                      newClient.classification === "verde" ? "default" : "outline"
                    }
                    onClick={() =>
                      setNewClient({ ...newClient, classification: "verde" })
                    }
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    Verde
                  </Button>
                  <Button
                    type="button"
                    variant={
                      newClient.classification === "amarillo"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setNewClient({ ...newClient, classification: "amarillo" })
                    }
                  >
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                    Amarillo
                  </Button>
                  <Button
                    type="button"
                    variant={
                      newClient.classification === "rojo" ? "default" : "outline"
                    }
                    onClick={() =>
                      setNewClient({ ...newClient, classification: "rojo" })
                    }
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    Rojo
                  </Button>
                </div>
              </div>
              {/* Notas (opcional) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas
                </Label>
                <textarea
                  id="notes"
                  rows={3}
                  className="col-span-3 border rounded px-2 py-1 bg-white text-black"
                  value={newClient.notes}
                  onChange={(e) =>
                    setNewClient({ ...newClient, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddClient}>Agregar Cliente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campo de búsqueda */}
      <div className="mb-4 max-w-sm">
        <Input
          type="text"
          placeholder="Buscar por nombre, dirección, teléfono o email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabla de clientes filtrados */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Dirección</TableCell>
            <TableCell>Teléfono</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Clasificación</TableCell>
            <TableCell>Notas</TableCell>
            <TableCell>Opciones</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.email}</TableCell>
              {/* Muestra solo el círculo de color */}
              <TableCell>
                {client.classification === "verde" && (
                  <div className="w-3 h-3 rounded-full bg-green-500 mx-auto" />
                )}
                {client.classification === "amarillo" && (
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto" />
                )}
                {client.classification === "rojo" && (
                  <div className="w-3 h-3 rounded-full bg-red-500 mx-auto" />
                )}
              </TableCell>
              {/* Columna para ver notas */}
              <TableCell>
                {client.notes && client.notes.trim() !== "" ? (
                  <Button
                    variant="link"
                    className="underline p-0"
                    onClick={() => {
                      setNotesToShow(client.notes!);
                      setIsNotesDialogOpen(true);
                    }}
                  >
                    Ver
                  </Button>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {/* Diálogo para editar */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClient(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                        <DialogDescription>
                          Haga cambios al cliente.
                        </DialogDescription>
                      </DialogHeader>
                      {selectedClient && (
                        <div className="grid gap-4 py-4">
                          {/* Nombre */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                              Nombre
                            </Label>
                            <Input
                              id="edit-name"
                              value={selectedClient.name}
                              onChange={(e) =>
                                setSelectedClient({
                                  ...selectedClient,
                                  name: e.target.value,
                                })
                              }
                              className="col-span-3"
                            />
                          </div>
                          {/* Dirección */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-address" className="text-right">
                              Dirección
                            </Label>
                            <Input
                              id="edit-address"
                              value={selectedClient.address}
                              onChange={(e) =>
                                setSelectedClient({
                                  ...selectedClient,
                                  address: e.target.value,
                                })
                              }
                              className="col-span-3"
                            />
                          </div>
                          {/* Teléfono */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-phone" className="text-right">
                              Teléfono
                            </Label>
                            <Input
                              id="edit-phone"
                              value={selectedClient.phone}
                              onChange={(e) =>
                                setSelectedClient({
                                  ...selectedClient,
                                  phone: e.target.value,
                                })
                              }
                              className="col-span-3"
                            />
                          </div>
                          {/* Email */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">
                              Email
                            </Label>
                            <Input
                              id="edit-email"
                              value={selectedClient.email}
                              onChange={(e) =>
                                setSelectedClient({
                                  ...selectedClient,
                                  email: e.target.value,
                                })
                              }
                              className="col-span-3"
                            />
                          </div>
                          {/* Clasificación con botones */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Clasificación</Label>
                            <div className="col-span-3 flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  selectedClient.classification === "verde"
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  setSelectedClient({
                                    ...selectedClient,
                                    classification: "verde",
                                  })
                                }
                              >
                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                                Verde
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  selectedClient.classification === "amarillo"
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  setSelectedClient({
                                    ...selectedClient,
                                    classification: "amarillo",
                                  })
                                }
                              >
                                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                                Amarillo
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  selectedClient.classification === "rojo"
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  setSelectedClient({
                                    ...selectedClient,
                                    classification: "rojo",
                                  })
                                }
                              >
                                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                                Rojo
                              </Button>
                            </div>
                          </div>
                          {/* Notas */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-notes" className="text-right">
                              Notas
                            </Label>
                            <textarea
                              id="edit-notes"
                              rows={3}
                              className="col-span-3 border rounded px-2 py-1 bg-white text-black"
                              value={selectedClient.notes || ""}
                              onChange={(e) =>
                                setSelectedClient({
                                  ...selectedClient,
                                  notes: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button onClick={handleEditClient}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Diálogo para eliminar */}
                  <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClient(client)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Borrar Cliente</DialogTitle>
                        <DialogDescription>
                          ¿Está seguro de que desea borrar al cliente? Esta acción
                          no se puede revertir.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteClient}>
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

      {/* Diálogo para ver notas */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas del Cliente</DialogTitle>
          </DialogHeader>
          {/* Mostrar las notas con saltos de línea */}
          <div className="whitespace-pre-wrap">{notesToShow}</div>
          <DialogFooter>
            <Button onClick={() => setIsNotesDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
