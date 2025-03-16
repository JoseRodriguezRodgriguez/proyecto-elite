//pagina de trabajos agendados
"use client"

import { useState, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  isSameDay,
  eachDayOfInterval,
  parseISO,
} from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { PlusIcon } from "lucide-react"

interface ScheduledJob {
  id: number
  service: string
  date: string
  hour: string
  clientId: number
  client?: {
    name: string
  }
  status?: string
}

interface Client {
  id: number
  name: string
}

export default function ScheduledJobsPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [newJob, setNewJob] = useState<Omit<ScheduledJob, "id">>({
    service: "",
    date: format(new Date(), "yyyy-MM-dd"),
    hour: "",
    clientId: 0,
  })
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [allClients, setAllClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([])

  useEffect(() => {
    fetchJobs()
    fetchClients()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/scheduled-jobs")
      if (!res.ok) throw new Error("Error al obtener los trabajos programados")
      const data = await res.json()
      setJobs(data)
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients")
      if (!res.ok) throw new Error("Error al obtener los clientes")
      const data = await res.json()
      setAllClients(data)
    } catch (err: any) {
      console.error("Error al cargar clientes:", err.message)
    }
  }

  useEffect(() => {
    if (clientSearch.trim() === "") {
      setClientSuggestions([])
    } else {
      const suggestions = allClients.filter((client) => client.name.toLowerCase().includes(clientSearch.toLowerCase()))
      setClientSuggestions(suggestions)
    }
  }, [clientSearch, allClients])

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  function getCalendarDays(month: Date) {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }
  const calendarDays = getCalendarDays(currentMonth)

  function getJobsForDay(day: Date) {
    return jobs.filter((job) => isSameDay(parseISO(job.date), day))
  }

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase()
    return job.service.toLowerCase().includes(query)
  })

  const handleAddJob = async () => {
    try {
      const jobToSend = {
        ...newJob,
        date: new Date(`${newJob.date}T${newJob.hour}:00`).toISOString(),
      }
      const res = await fetch("/api/scheduled-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobToSend),
      })
      if (!res.ok) throw new Error("Error al agregar el trabajo")
      const addedJob = await res.json()
      setJobs((prev) => [...prev, addedJob])
      setNewJob({ service: "", date: format(new Date(), "yyyy-MM-dd"), hour: "", clientId: 0 })
      setClientSearch("")
      setIsAddDialogOpen(false)
    } catch (err: any) {
      console.error("Error en POST /api/scheduled-jobs:", err.message)
    }
  }

  const handleSelectJob = (job: ScheduledJob) => {
    setSelectedJob({ ...job })
    setIsViewDialogOpen(true)
  }

  const handleSaveSelectedJob = async () => {
    if (!selectedJob) return
    try {
      const { client, ...updateData } = selectedJob
      const jobToUpdate = {
        ...updateData,
        date: new Date(`${format(parseISO(selectedJob.date), "yyyy-MM-dd")}T${selectedJob.hour}:00`).toISOString(),
      }
      const res = await fetch("/api/scheduled-jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobToUpdate),
      })
      if (!res.ok) throw new Error("Error al editar el trabajo")
      const updatedJob = await res.json()
      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)))
      setSelectedJob(null)
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("Error en PATCH /api/scheduled-jobs:", err.message)
    }
  }

  const handleDeleteSelectedJob = async () => {
    if (!selectedJob) return
    try {
      const res = await fetch("/api/scheduled-jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedJob.id }),
      })
      if (!res.ok) throw new Error("Error al borrar el trabajo")
      await res.json()
      setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id))
      setSelectedJob(null)
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("Error en DELETE /api/scheduled-jobs:", err.message)
    }
  }

  const handleFinishAndBill = async () => {
    if (!selectedJob) return
    try {
      const res = await fetch("/api/worked-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: selectedJob.service,
          date: selectedJob.date,
          clientId: selectedJob.clientId,
        }),
      })
      if (!res.ok) throw new Error("Error al finalizar y facturar el trabajo")
      await res.json()

      // Actualizar el estado del trabajo programado
      const updatedJob = { ...selectedJob, status: "Completed" }
      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)))
      setSelectedJob(null)
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("Error en POST /api/worked-jobs:", err.message)
    }
  }

  if (loading) return <p>Cargando trabajos...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Calendario de Trabajos</h1>

      <div className="flex items-center justify-between mb-6 max-w-md">
        <Button variant="outline" onClick={prevMonth}>
          Mes Anterior
        </Button>
        <div className="text-lg font-bold">{format(currentMonth, "MMMM yyyy", { locale: es })}</div>
        <Button variant="outline" onClick={nextMonth}>
          Mes Siguiente
        </Button>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          type="text"
          placeholder="Buscar por servicio"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Trabajo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Trabajo</DialogTitle>
              <DialogDescription>Ingrese los detalles del nuevo trabajo.</DialogDescription>
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
                <Label htmlFor="clientSearch" className="text-right">
                  Cliente
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="clientSearch"
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                  {clientSearch && clientSuggestions.length > 0 && (
                    <div className="absolute z-10 bg-white shadow-md border mt-1 w-full">
                      {clientSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="p-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            setClientSearch(suggestion.name)
                            setNewJob({ ...newJob, clientId: suggestion.id })
                            setClientSuggestions([])
                          }}
                        >
                          {suggestion.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fecha" className="text-right">
                  Fecha
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={newJob.date}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => {
                    setNewJob({ ...newJob, date: e.target.value })
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hour" className="text-right">
                  Hora
                </Label>
                <Input
                  id="hour"
                  type="time"
                  value={newJob.hour}
                  onChange={(e) => setNewJob({ ...newJob, hour: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddJob}>Agregar Trabajo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dayName) => (
          <div key={dayName} className="font-medium">
            {dayName}
          </div>
        ))}

        {calendarDays.map((day) => {
          const isCurrent = isSameMonth(day, currentMonth)
          const dayJobs = getJobsForDay(day)
          return (
            <div
              key={day.toISOString()}
              className={`h-24 border p-1 flex flex-col items-center justify-start
                ${!isCurrent ? "bg-gray-100 text-gray-400" : ""}
                ${isToday(day) ? "border-blue-500" : ""}
              `}
            >
              <span className="text-sm font-semibold mb-1">{format(day, "d", { locale: es })}</span>
              {dayJobs.map((job) => (
                <span
                  key={job.id}
                  className={`text-xs w-full overflow-hidden whitespace-nowrap text-ellipsis rounded cursor-pointer ${
                    job.status === "Completed" ? "bg-green-200 text-green-800" : "bg-blue-200 text-blue-800"
                  }`}
                  title={`${job.service} - Cliente ID: ${job.clientId} (${job.hour})`}
                  onClick={() => handleSelectJob(job)}
                >
                  {job.service}
                </span>
              ))}
            </div>
          )
        })}
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        {selectedJob && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalle del Trabajo</DialogTitle>
              <DialogDescription>Edite la información o elimine el trabajo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sel-service" className="text-right">
                  Servicio
                </Label>
                <Input
                  id="sel-service"
                  value={selectedJob.service}
                  onChange={(e) => setSelectedJob({ ...selectedJob, service: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sel-client" className="text-right">
                  Cliente
                </Label>
                <Input
                  id="sel-client"
                  type="text"
                  value={selectedJob.client?.name || ""}
                  readOnly
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sel-fecha" className="text-right">
                  Fecha
                </Label>
                <Input
                  id="sel-fecha"
                  type="date"
                  value={format(parseISO(selectedJob.date), "yyyy-MM-dd")}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => {
                    const dateValue = e.target.value // "yyyy-MM-dd"
                    // Forzamos la hora a mediodía para evitar desfases
                    const isoString = new Date(`${dateValue}T12:00:00.000Z`).toISOString()
                    setSelectedJob({ ...selectedJob, date: isoString })
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sel-hour" className="text-right">
                  Hora
                </Label>
                <Input
                  id="sel-hour"
                  type="time"
                  value={selectedJob.hour}
                  onChange={(e) => setSelectedJob({ ...selectedJob, hour: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveSelectedJob}>Guardar Cambios</Button>
              <Button variant="destructive" onClick={handleDeleteSelectedJob}>
                Eliminar
              </Button>
              <Button onClick={handleFinishAndBill} variant="secondary">
                Finalizar y Facturar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
