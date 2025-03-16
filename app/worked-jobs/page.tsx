//pagina de trabajos finalizados
"use client"

import { useState, useEffect } from "react"
import { PlusIcon, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"

interface WorkedJob {
  id: number
  service: string
  date: string
  status: "Completed"
  clientId: number
  client: {
    name: string
  }
}

interface Client {
  id: number
  name: string
}

export default function WorkedJobsPage() {
  const [workedJobs, setWorkedJobs] = useState<WorkedJob[]>([])
  const [newJob, setNewJob] = useState<Omit<WorkedJob, "id" | "client">>({
    service: "",
    date: "",
    status: "Completed",
    clientId: 0,
  })
  const [selectedJob, setSelectedJob] = useState<WorkedJob | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [newClientName, setNewClientName] = useState("")

  useEffect(() => {
    fetchWorkedJobs()
    fetchClients()
  }, [])

  const fetchWorkedJobs = async () => {
    try {
      const res = await fetch("/api/worked-jobs")
      if (!res.ok) throw new Error("Error al obtener los trabajos realizados")
      const data = await res.json()
      setWorkedJobs(data)
    } catch (err: any) {
      console.error("Error en GET /api/worked-jobs:", err.message)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients")
      if (!res.ok) throw new Error("Error al obtener los clientes")
      const data = await res.json()
      setClients(data)
    } catch (err: any) {
      console.error("Error en GET /api/clients:", err.message)
    }
  }

  const handleAddJob = async () => {
    try {
      let clientId = newJob.clientId
      if (clientId === 0 && newClientName) {
        // Crear nuevo cliente
        const newClientRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newClientName }),
        })
        if (!newClientRes.ok) throw new Error("Error al crear nuevo cliente")
        const newClient = await newClientRes.json()
        clientId = newClient.id
      }

      const jobToAdd = {
        ...newJob,
        clientId,
      }

      const res = await fetch("/api/worked-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobToAdd),
      })
      if (!res.ok) throw new Error("Error al agregar el trabajo realizado")
      const addedJob = await res.json()
      setWorkedJobs([...workedJobs, addedJob])
      setNewJob({ service: "", date: "", status: "Completed", clientId: 0 })
      setNewClientName("")
      setIsAddDialogOpen(false)
    } catch (err: any) {
      console.error("Error en POST /api/worked-jobs:", err.message)
    }
  }

  const handleEditJob = async () => {
    if (!selectedJob) return
    try {
      const res = await fetch("/api/worked-jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedJob),
      })
      if (!res.ok) throw new Error("Error al editar el trabajo realizado")
      const updatedJob = await res.json()
      setWorkedJobs(workedJobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)))
      setIsEditDialogOpen(false)
    } catch (err: any) {
      console.error("Error en PATCH /api/worked-jobs:", err.message)
    }
  }

  const handleDeleteJob = async () => {
    if (!selectedJob) return
    try {
      const res = await fetch("/api/worked-jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedJob.id }),
      })
      if (!res.ok) throw new Error("Error al eliminar el trabajo realizado")
      await res.json()
      setWorkedJobs(workedJobs.filter((j) => j.id !== selectedJob.id))
      setIsDeleteDialogOpen(false)
    } catch (err: any) {
      console.error("Error en DELETE /api/worked-jobs:", err.message)
    }
  }

  const filteredJobs = workedJobs.filter((job) => {
    const query = searchQuery.toLowerCase()
    return (
      job.service.toLowerCase().includes(query) ||
      job.client.name.toLowerCase().includes(query) ||
      job.date.toLowerCase().includes(query) ||
      job.status.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Trabajos finalizados</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Registrar Trabajo Completado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Trabajo Completado</DialogTitle>
              <DialogDescription>Ingrese los detalles del trabajo completado.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service" className="text-right">
                  Servicio
                </Label>
                <Input
                  id="service"
                  value={newJob.service}
                  onChange={(e) => setNewJob({ ...newJob, service: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newJob.date}
                  onChange={(e) => setNewJob({ ...newJob, date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Cliente
                </Label>
                <select
                  id="client"
                  value={newJob.clientId}
                  onChange={(e) => setNewJob({ ...newJob, clientId: Number(e.target.value) })}
                  className="col-span-3"
                >
                  <option value={0}>Seleccionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                  <option value="new">Nuevo cliente</option>
                </select>
              </div>
              {newJob.clientId === 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newClient" className="text-right">
                    Nuevo Cliente
                  </Label>
                  <Input
                    id="newClient"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="col-span-3"
                    placeholder="Nombre del nuevo cliente"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleAddJob}>Registrar Trabajo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          type="text"
          placeholder="Buscar por servicio, cliente, fecha o estado"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Servicio</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Opciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.service}</TableCell>
              <TableCell>{job.client.name}</TableCell>
              <TableCell>{format(parseISO(job.date), "dd/MM/yyyy")}</TableCell>
              <TableCell>{job.status}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedJob(job)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Registro</DialogTitle>
                        <DialogDescription>Haga cambios al registro.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-service" className="text-right">
                            Servicio
                          </Label>
                          <Input
                            id="edit-service"
                            value={selectedJob?.service}
                            onChange={(e) =>
                              setSelectedJob(selectedJob ? { ...selectedJob, service: e.target.value } : null)
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-date" className="text-right">
                            Fecha
                          </Label>
                          <Input
                            id="edit-date"
                            type="date"
                            value={selectedJob ? format(parseISO(selectedJob.date), "yyyy-MM-dd") : ""}
                            onChange={(e) =>
                              setSelectedJob(selectedJob ? { ...selectedJob, date: e.target.value } : null)
                            }
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-client" className="text-right">
                            Cliente
                          </Label>
                          <select
                            id="edit-client"
                            value={selectedJob?.clientId}
                            onChange={(e) =>
                              setSelectedJob(selectedJob ? { ...selectedJob, clientId: Number(e.target.value) } : null)
                            }
                            className="col-span-3"
                          >
                            {clients.map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleEditJob}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedJob(job)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Borrar Registro</DialogTitle>
                        <DialogDescription>
                          ¿Está seguro de que desea borrar el registro? Esta acción no se puede revertir.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteJob}>
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
  )
}