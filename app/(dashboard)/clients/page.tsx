//pagina de clientes
"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { getErrorMessage } from "@/lib/errors";

// Interfaz del cliente en el front-end
type ClientClassification = "verde" | "amarillo" | "rojo";

interface Client {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  classification: ClientClassification;
  notes?: string;
}

type ClientForm = Omit<Client, "id">;
type ClientField = keyof ClientForm;
type ClientFieldErrors = Partial<Record<ClientField, string>>;
type ApiFieldErrors = Partial<Record<ClientField, string[]>>;

interface ClientApiError {
  error?: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: ApiFieldErrors;
  };
}

const EMPTY_CLIENT_FORM: ClientForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  classification: "verde",
  notes: "",
};

const DEFAULT_FIELD_MESSAGES: Record<ClientField, string> = {
  name: "Ingrese un nombre válido.",
  address: "Ingrese una dirección válida.",
  phone: "Ingrese un número de teléfono válido.",
  email: "Ingrese un correo electrónico válido.",
  classification: "Seleccione una clasificación válida.",
  notes: "Revise el contenido de las notas.",
};

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
  const [newClient, setNewClient] =
    useState<ClientForm>(EMPTY_CLIENT_FORM);
  const [addFieldErrors, setAddFieldErrors] =
    useState<ClientFieldErrors>({});
  const [addFormError, setAddFormError] = useState("");
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Cliente seleccionado para editar / eliminar
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  function updateNewClient<K extends ClientField>(
    field: K,
    value: ClientForm[K]
  ) {
    setNewClient((previous) => ({
      ...previous,
      [field]: value,
    }));

    setAddFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setAddFormError("");
  }

  // Cargar datos al montar
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) throw new Error("Error al obtener los clientes");
        const data = await res.json();
        setClients(data);
      } catch (error: unknown) {
        setError(
          getErrorMessage(
            error, 
            "Error al obtener los clientes")
        );
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
  const handleAddClient = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setAddFieldErrors({});
    setAddFormError("");
    setIsAddingClient(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });

      let responseBody: unknown = null;

      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }

      if (!response.ok) {
        const apiError = (responseBody ?? {}) as ClientApiError;
        const apiFieldErrors =
          apiError.details?.fieldErrors ?? {};
        const nextFieldErrors: ClientFieldErrors = {};

        for (
          const field of Object.keys(
            apiFieldErrors
          ) as ClientField[]
        ) {
          const firstMessage =
            apiFieldErrors[field]?.[0];

          if (firstMessage) {
            nextFieldErrors[field] =
              firstMessage === "Invalid input"
                ? DEFAULT_FIELD_MESSAGES[field]
                : firstMessage;
          }
        }

        setAddFieldErrors(nextFieldErrors);

        const hasFieldErrors =
          Object.keys(nextFieldErrors).length > 0;

        let fallbackMessage =
          "No se pudo agregar el cliente.";

        if (response.status === 401) {
          fallbackMessage =
            "Tu sesión ha expirado. Inicia sesión nuevamente.";
        } else if (response.status === 403) {
          fallbackMessage =
            "No tienes permisos para agregar clientes.";
        } else if (response.status >= 500) {
          fallbackMessage =
            "Ocurrió un error interno. Inténtalo nuevamente.";
        }

        setAddFormError(
          apiError.details?.formErrors?.[0] ??
            (!hasFieldErrors
              ? apiError.error ?? fallbackMessage
              : "")
        );

        return;
      }

      const addedClient = responseBody as Client;

      setClients((previous) => [
        ...previous,
        addedClient,
      ]);
      setNewClient({ ...EMPTY_CLIENT_FORM });
      setAddFieldErrors({});
      setAddFormError("");
      setIsAddDialogOpen(false);
    } catch {
      setAddFormError(
        "No fue posible comunicarse con el servidor."
      );
    } finally {
      setIsAddingClient(false);
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
    } catch (error: unknown) {
      setError(
        getErrorMessage(
          error,
          "Error al editar el cliente"
        )
      );
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
    } catch (error: unknown) {
      setError(
        getErrorMessage(
          error,
          "Error al borrar el cliente"
        )
      );
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Clientes</h1>

        {/* Diálogo para agregar */}
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);

            if (!open) {
              setAddFieldErrors({});
              setAddFormError("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <form onSubmit={handleAddClient} noValidate>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                <DialogDescription>
                  Ingrese los datos del cliente. Los campos con errores se
                  marcarán para que pueda corregirlos sin perder la información.
                </DialogDescription>
              </DialogHeader>

              {addFormError && (
                <div
                  role="alert"
                  className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {addFormError}
                </div>
              )}

              <div className="grid gap-4 py-4">
                {/* Nombre */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label
                    htmlFor="name"
                    className="pt-2 text-right"
                  >
                    Nombre
                  </Label>

                  <div className="col-span-3">
                    <Input
                      id="name"
                      name="name"
                      required
                      value={newClient.name}
                      placeholder="Hotel Real Intercontinental"
                      maxLength={150}
                      autoComplete="organization"
                      aria-invalid={Boolean(addFieldErrors.name)}
                      aria-describedby={
                        addFieldErrors.name
                          ? "add-client-name-error"
                          : undefined
                      }
                      className={
                        addFieldErrors.name
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      onChange={(event) =>
                        updateNewClient(
                          "name",
                          event.target.value
                        )
                      }
                    />

                    {addFieldErrors.name && (
                      <p
                        id="add-client-name-error"
                        className="mt-1 text-sm text-red-600"
                      >
                        {addFieldErrors.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dirección */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label
                    htmlFor="address"
                    className="pt-2 text-right"
                  >
                    Dirección
                  </Label>

                  <div className="col-span-3">
                    <Input
                      id="address"
                      name="address"
                      required
                      value={newClient.address}
                      placeholder="Boulevard Los Héroes, San Salvador"
                      maxLength={255}
                      autoComplete="street-address"
                      aria-invalid={Boolean(addFieldErrors.address)}
                      aria-describedby={
                        addFieldErrors.address
                          ? "add-client-address-error"
                          : undefined
                      }
                      className={
                        addFieldErrors.address
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      onChange={(event) =>
                        updateNewClient(
                          "address",
                          event.target.value
                        )
                      }
                    />

                    {addFieldErrors.address && (
                      <p
                        id="add-client-address-error"
                        className="mt-1 text-sm text-red-600"
                      >
                        {addFieldErrors.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Teléfono */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label
                    htmlFor="phone"
                    className="pt-2 text-right"
                  >
                    Teléfono
                  </Label>

                  <div className="col-span-3">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      required
                      value={newClient.phone}
                      placeholder="(+503) 2222-3333"
                      maxLength={30}
                      autoComplete="tel"
                      aria-invalid={Boolean(addFieldErrors.phone)}
                      aria-describedby={
                        addFieldErrors.phone
                          ? "add-client-phone-error"
                          : undefined
                      }
                      className={
                        addFieldErrors.phone
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      onChange={(event) =>
                        updateNewClient(
                          "phone",
                          event.target.value
                        )
                      }
                    />

                    {addFieldErrors.phone && (
                      <p
                        id="add-client-phone-error"
                        className="mt-1 text-sm text-red-600"
                      >
                        {addFieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Correo electrónico */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label
                    htmlFor="email"
                    className="pt-2 text-right"
                  >
                    Correo
                  </Label>

                  <div className="col-span-3">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      required
                      value={newClient.email}
                      placeholder="contacto@empresa.com"
                      maxLength={255}
                      autoComplete="email"
                      aria-invalid={Boolean(addFieldErrors.email)}
                      aria-describedby={
                        addFieldErrors.email
                          ? "add-client-email-error"
                          : undefined
                      }
                      className={
                        addFieldErrors.email
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      onChange={(event) =>
                        updateNewClient(
                          "email",
                          event.target.value
                        )
                      }
                    />

                    {addFieldErrors.email && (
                      <p
                        id="add-client-email-error"
                        className="mt-1 text-sm text-red-600"
                      >
                        {addFieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Clasificación */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="pt-2 text-right">
                    Clasificación
                  </Label>

                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={
                          newClient.classification === "verde"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          updateNewClient(
                            "classification",
                            "verde"
                          )
                        }
                      >
                        <span className="mr-2 h-3 w-3 rounded-full bg-green-500" />
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
                          updateNewClient(
                            "classification",
                            "amarillo"
                          )
                        }
                      >
                        <span className="mr-2 h-3 w-3 rounded-full bg-yellow-500" />
                        Amarillo
                      </Button>

                      <Button
                        type="button"
                        variant={
                          newClient.classification === "rojo"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          updateNewClient(
                            "classification",
                            "rojo"
                          )
                        }
                      >
                        <span className="mr-2 h-3 w-3 rounded-full bg-red-500" />
                        Rojo
                      </Button>
                    </div>

                    {addFieldErrors.classification && (
                      <p className="mt-1 text-sm text-red-600">
                        {addFieldErrors.classification}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notas */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label
                    htmlFor="notes"
                    className="pt-2 text-right"
                  >
                    Notas
                  </Label>

                  <div className="col-span-3">
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      maxLength={1000}
                      placeholder="Información adicional sobre el cliente..."
                      value={newClient.notes ?? ""}
                      aria-invalid={Boolean(addFieldErrors.notes)}
                      aria-describedby={
                        addFieldErrors.notes
                          ? "add-client-notes-error"
                          : undefined
                      }
                      className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 ${
                        addFieldErrors.notes
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-slate-400"
                      }`}
                      onChange={(event) =>
                        updateNewClient(
                          "notes",
                          event.target.value
                        )
                      }
                    />

                    {addFieldErrors.notes && (
                      <p
                        id="add-client-notes-error"
                        className="mt-1 text-sm text-red-600"
                      >
                        {addFieldErrors.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isAddingClient}
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setAddFieldErrors({});
                    setAddFormError("");
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isAddingClient}
                >
                  {isAddingClient
                    ? "Guardando..."
                    : "Agregar Cliente"}
                </Button>
              </DialogFooter>
            </form>
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
            <TableHead>Nombre</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Clasificación</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead>Opciones</TableHead>
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