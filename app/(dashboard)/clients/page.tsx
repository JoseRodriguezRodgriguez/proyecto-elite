"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PlusIcon, Pencil, Trash2, AlertTriangle, CheckCircle2, Users, XCircle, SearchX } from "lucide-react";
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

// Interfaz del cliente en el front-end
type ClientClassification = "verde" | "amarillo" | "rojo";

interface Client {
  id: number;
  name: string;
  contactName: string;
  address: string;
  phone: string;
  email: string;
  duiNit?: string | null;
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
  contactName: "",
  address: "",
  phone: "",
  email: "",
  duiNit: "",
  classification: "verde",
  notes: "",
};

const DEFAULT_FIELD_MESSAGES: Record<ClientField, string> = {
  name: "Ingrese un nombre válido.",
  contactName: "",
  address: "Ingrese una dirección válida.",
  phone: "Ingrese un número de teléfono válido.",
  email: "Ingrese un correo electrónico válido.",
  duiNit: "Ingrese un DUI o NIT válido.",
  classification: "Seleccione una clasificación válida.",
  notes: "Revise el contenido de las notas.",
};

const CLIENT_CLASSIFICATION_BADGES: Record<
  ClientClassification,
  {
    label: string;
    variant: StatusBadgeVariant;
  }
> = {
  verde: {
    label: "Verde",
    variant: "success",
  },

  amarillo: {
    label: "Amarillo",
    variant: "warning",
  },

  rojo: {
    label: "Rojo",
    variant: "danger",
  },
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
  const [editFieldErrors, setEditFieldErrors] = useState<ClientFieldErrors>({});
  const [editFormError, setEditFormError] = useState("");
  const [isEditingClient, setIsEditingClient] = useState(false);

  function openNotesDialog(client: Client) {
    const notes = client.notes?.trim();

    if (!notes) return;

    setNotesToShow(notes);
    setIsNotesDialogOpen(true);
  }

  function openEditDialog(client: Client) {
    setSelectedClient({ ...client });
    setEditFieldErrors({});
    setEditFormError("");
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(client: Client) {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  }

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
      client.email.toLowerCase().includes(query) ||
      client.contactName.toLowerCase().includes(query) ||
      client.duiNit?.toLowerCase().includes(query)
    );
  });

  const clientStats = {
  total: clients.length,

  green: clients.filter(
    (client) =>
      client.classification === "verde"
  ).length,

  yellow: clients.filter(
    (client) =>
      client.classification === "amarillo"
  ).length,

  red: clients.filter(
    (client) =>
      client.classification === "rojo"
  ).length,
};

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
    if (!selectedClient) return;  setEditFieldErrors({});
    setEditFormError("");

    setIsEditingClient(true);
    try {

      const response = await fetch(
        "/api/clients",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            selectedClient
          ),
        }
      );
      let responseBody: unknown = null;

      try {
      responseBody =

          await response.json();
      } catch {
        responseBody = null;
      }
      if (!response.ok) {
      const apiError =

          (responseBody ?? {}) as ClientApiError;
        const apiFieldErrors =

          apiError.details?.fieldErrors ?? {};
        const nextFieldErrors:

          ClientFieldErrors = {};
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
        setEditFieldErrors(
        nextFieldErrors

        );
        const hasFieldErrors =
        Object.keys(nextFieldErrors)

            .length > 0;
        let fallbackMessage =

          "No se pudo editar el cliente.";
        if (response.status === 401) {

          fallbackMessage =
            "Tu sesión ha expirado. Inicia sesión nuevamente.";
        } else if (
          response.status === 403
        ) {
          fallbackMessage =
            "No tienes permisos para editar clientes.";
        } else if (
          response.status >= 500
        ) {
          fallbackMessage =
            "Ocurrió un error interno. Inténtalo nuevamente.";
        }
        setEditFormError(
        apiError.details

            ?.formErrors?.[0] ??
            (!hasFieldErrors
              ? apiError.error ??
                fallbackMessage
              : "")
        );
        return;

      }
      const updatedClient =
      responseBody as Client;

      setClients((previous) =>

        previous.map((client) =>
          client.id === updatedClient.id
            ? updatedClient
            : client
        )
      );

      setEditFieldErrors({});
      setEditFormError("");
      setIsEditDialogOpen(false);
      setSelectedClient(null);
    } catch {
      setEditFormError(
        "No fue posible comunicarse con el servidor."
      );
    } finally {
      setIsEditingClient(false);
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

  if (loading) {
    return (
      <LoadingState
        title="Cargando clientes"
        description="Obteniendo los clientes y sus clasificaciones."
        cardCount={4}
        rowCount={6}
      />
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="No se pudieron cargar los clientes"
          description={error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Clientes"
        description="Administre los clientes registrados, su información de contacto y su clasificación."
        actions={
          <Button
            type="button"
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-elite-gradient text-white shadow-sm hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            Agregar cliente
          </Button>
        }
      />

      <section
        aria-label="Resumen de clientes"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total de clientes"
          value={clientStats.total}
          icon={Users}
          tone="primary"
          helperText="Clientes registrados"
        />

        <StatCard
          label="Clasificación verde"
          value={clientStats.green}
          icon={CheckCircle2}
          tone="success"
          helperText="Clientes en buen estado"
        />

        <StatCard
          label="Clasificación amarilla"
          value={clientStats.yellow}
          icon={AlertTriangle}
          tone="warning"
          helperText="Clientes que requieren atención"
        />

        <StatCard
          label="Clasificación roja"
          value={clientStats.red}
          icon={XCircle}
          tone="danger"
          helperText="Clientes de atención prioritaria"
        />
      </section>

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
              {/* Contacto principal */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label
                  htmlFor="contactName"
                  className="pt-2 text-right"
                >
                  Contacto
                </Label>

                <div className="col-span-3">
                  <Input
                    id="contactName"
                    name="contactName"
                    value={newClient.contactName ?? ""}
                    placeholder="Nombre de la persona de contacto"
                    maxLength={150}
                    autoComplete="name"
                    aria-invalid={Boolean(addFieldErrors.contactName)}
                    aria-describedby={
                      addFieldErrors.contactName
                        ? "add-client-contact-name-error"
                        : undefined
                    }
                    className={
                      addFieldErrors.contactName
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                    onChange={(event) =>
                      updateNewClient("contactName", event.target.value)
                    }
                  />

                  {addFieldErrors.contactName && (
                    <p
                      id="add-client-contact-name-error"
                      className="mt-1 text-sm text-red-600"
                    >
                      {addFieldErrors.contactName}
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

              {/* DUI/NIT */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label
                  htmlFor="duiNit"
                  className="pt-2 text-right"
                >
                  DUI/NIT
                </Label>

                <div className="col-span-3">
                  <Input
                    id="duiNit"
                    name="duiNit"
                    type="text"
                    inputMode="numeric"
                    required
                    value={newClient.duiNit ?? ""}
                    placeholder="00000000-0 o 0000-000000-000-0"
                    maxLength={20}
                    aria-invalid={Boolean(
                      addFieldErrors.duiNit
                    )}
                    aria-describedby={
                      addFieldErrors.duiNit
                        ? "add-client-dui-nit-error"
                        : undefined
                    }
                    className={
                      addFieldErrors.duiNit
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                    onChange={(event) =>
                      updateNewClient(
                        "duiNit",
                        event.target.value.replace(
                          /[^0-9-]/g,
                          ""
                        )
                      )
                    }
                  />

                  {addFieldErrors.duiNit && (
                    <p
                      id="add-client-dui-nit-error"
                      className="mt-1 text-sm text-red-600"
                    >
                      {addFieldErrors.duiNit}
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

      {/* Tabla de clientes filtrados */}
      <SectionCard
        title="Listado de clientes"
        description="Consulte, busque y administre los clientes registrados."
        contentClassName="p-0"
      >
        {clients.length > 0 && (
          <DataToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por nombre, contacto, dirección, teléfono, correo, DUI o NIT"
            searchLabel="Buscar clientes"
            resultCount={filteredClients.length}
            totalCount={clients.length}
            resultNoun="clientes"
          />
        )}

        {filteredClients.length === 0 ? (
          <EmptyState
            icon={clients.length === 0 ? Users : SearchX}
            title={
              clients.length === 0
                ? "Todavía no hay clientes"
                : "No se encontraron clientes"
            }
            description={
              clients.length === 0
                ? "Agregue el primer cliente para comenzar a administrar su información."
                : `No existen resultados que coincidan con “${searchQuery}”.`
            }
            action={
              clients.length === 0 ? (
                <Button
                  type="button"
                  onClick={() =>
                    setIsAddDialogOpen(true)
                  }
                  className="bg-elite-gradient text-white hover:opacity-90"
                >
                  <PlusIcon className="h-4 w-4" />
                  Agregar primer cliente
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>DUI/NIT</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">
                    Opciones
                  </TableHead>
                </TableRow>
              </TableHeader>
        
              <TableBody>
                {filteredClients.map((client) => {
                  const classificationBadge =
                    CLIENT_CLASSIFICATION_BADGES[
                      client.classification
                    ];
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                    
                      <TableCell>
                        {client.contactName?.trim() || "Sin registrar"}
                      </TableCell>

                      <TableCell>
                        {client.address}
                      </TableCell>
                    
                      <TableCell>
                        {client.phone}
                      </TableCell>
                    
                      <TableCell>
                        {client.email}
                      </TableCell>

                      <TableCell>
                        {client.duiNit || "Sin registrar"}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          variant={classificationBadge.variant}
                        >
                          {classificationBadge.label}
                        </StatusBadge>
                      </TableCell>
                    
                      <TableCell>
                        {client.notes && client.notes.trim() !== "" ? (
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-primary"
                            onClick={() => openNotesDialog(client)}
                          >
                            Ver notas
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                            aria-label={`Editar a ${client.name}`}
                            title="Editar cliente"
                            onClick={() => openEditDialog(client)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 border-red-200 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            aria-label={`Eliminar a ${client.name}`}
                            title="Eliminar cliente"
                            onClick={() => openDeleteDialog(client)}
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

      {/* Diálogo para editar */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);

          if (!open) {
            setSelectedClient(null);
            setEditFieldErrors({});
            setEditFormError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>
              Actualice la información del cliente seleccionado.
            </DialogDescription>
          </DialogHeader>

          {editFormError && (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {editFormError}
            </div>
          )}

          {selectedClient && (
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={selectedClient.name}
                  onChange={(event) =>
                    setSelectedClient({
                      ...selectedClient,
                      name: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={selectedClient.phone}
                  onChange={(event) =>
                    setSelectedClient({
                      ...selectedClient,
                      phone: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-contact-name">Contacto</Label>

                <Input
                  id="edit-contact-name"
                  value={selectedClient.contactName ?? ""}
                  placeholder="Nombre de la persona de contacto"
                  maxLength={150}
                  autoComplete="name"
                  aria-invalid={Boolean(editFieldErrors.contactName)}
                  aria-describedby={
                    editFieldErrors.contactName
                      ? "edit-client-contact-name-error"
                      : undefined
                  }
                  className={
                    editFieldErrors.contactName
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={(event) => {
                    setSelectedClient({
                      ...selectedClient,
                      contactName: event.target.value,
                    });
                  
                    setEditFieldErrors((previous) => ({
                      ...previous,
                      contactName: undefined,
                    }));
                  
                    setEditFormError("");
                  }}
                />

                {editFieldErrors.contactName && (
                  <p
                    id="edit-client-contact-name-error"
                    className="text-sm text-red-600"
                  >
                    {editFieldErrors.contactName}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-address">Dirección</Label>
                <Input
                  id="edit-address"
                  value={selectedClient.address}
                  onChange={(event) =>
                    setSelectedClient({
                      ...selectedClient,
                      address: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-email">
                  Correo electrónico
                </Label>
                              
                <Input
                  id="edit-email"
                  type="email"
                  inputMode="email"
                  value={selectedClient.email}
                  placeholder="contacto@empresa.com"
                  maxLength={255}
                  autoComplete="email"
                  aria-invalid={Boolean(
                    editFieldErrors.email
                  )}
                  aria-describedby={
                    editFieldErrors.email
                      ? "edit-client-email-error"
                      : undefined
                  }
                  className={
                    editFieldErrors.email
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={(event) => {
                    setSelectedClient({
                      ...selectedClient,
                      email: event.target.value,
                    });
                  
                    setEditFieldErrors(
                      (previous) => ({
                        ...previous,
                        email: undefined,
                      })
                    );
                  
                    setEditFormError("");
                  }}
                />
              
                {editFieldErrors.email && (
                  <p
                    id="edit-client-email-error"
                    className="text-sm text-red-600"
                  >
                    {editFieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-dui-nit">
                  DUI/NIT
                </Label>

                <Input
                  id="edit-dui-nit"
                  value={selectedClient.duiNit ?? ""}
                  placeholder="00000000-0 o 0000-000000-000-0"
                  maxLength={20}
                  inputMode="numeric"
                  aria-invalid={Boolean(
                    editFieldErrors.duiNit
                  )}
                  aria-describedby={
                    editFieldErrors.duiNit
                      ? "edit-client-dui-nit-error"
                      : undefined
                  }
                  className={
                    editFieldErrors.duiNit
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value.replace(
                        /[^0-9-]/g,
                        ""
                      );
                    
                    setSelectedClient({
                      ...selectedClient,
                      duiNit: value,
                    });
                  
                    setEditFieldErrors(
                      (previous) => ({
                        ...previous,
                        duiNit: undefined,
                      })
                    );
                  
                    setEditFormError("");
                  }}
                />

                {editFieldErrors.duiNit && (
                  <p
                    id="edit-client-dui-nit-error"
                    className="text-sm text-red-600"
                  >
                    {editFieldErrors.duiNit}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Clasificación</Label>

                <div className="flex flex-wrap gap-2">
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
                    <span className="h-3 w-3 rounded-full bg-green-500" />
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
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
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
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    Rojo
                  </Button>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-notes">Notas</Label>
                <textarea
                  id="edit-notes"
                  rows={4}
                  maxLength={1000}
                  value={selectedClient.notes ?? ""}
                  onChange={(event) =>
                    setSelectedClient({
                      ...selectedClient,
                      notes: event.target.value,
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedClient(null);
                setEditFieldErrors({});
                setEditFormError("");
              }}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              disabled={
                !selectedClient ||
                isEditingClient
              }
              onClick={handleEditClient}
            >
              {isEditingClient
                ? "Guardando..."
                : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);

          if (!open) {
            setSelectedClient(null);
            setEditFieldErrors({});
            setEditFormError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
            <DialogDescription>
              {selectedClient
                ? `¿Está seguro de eliminar a “${selectedClient.name}”? Esta acción no se puede revertir.`
                : "Esta acción no se puede revertir."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedClient(null);
              }}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={!selectedClient}
              onClick={handleDeleteClient}
            >
              Eliminar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver notas */}
      <Dialog
        open={isNotesDialogOpen}
        onOpenChange={(open) => {
          setIsNotesDialogOpen(open);

          if (!open) {
            setNotesToShow("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas del Cliente</DialogTitle>
          </DialogHeader>
          {/* Mostrar las notas con saltos de línea */}
          <div className="whitespace-pre-wrap">{notesToShow}</div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setIsNotesDialogOpen(false);
                setNotesToShow("");
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}