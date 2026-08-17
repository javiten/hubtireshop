"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"

// ── Types ────────────────────────────────────────────────
type Customer = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null }
type Vehicle = { id: string; year: string | null; make: string | null; model: string | null; trim: string | null; vin: string | null; license_plate: string | null; mileage: string | null }
type PendingItem = { id: string; label: string; done: boolean }
type WorkOrder = {
  id: string; task: string; status: string; due_date: string
  start_time: string | null; end_time: string | null; all_day: boolean
  assigned_to: string | null; pending_items: PendingItem[]; notes: string | null
  deleted_at: string | null; deleted_by: string | null
  created_at: string; updated_at: string
  shop_customers: Customer | null; vehicles: Vehicle | null
}

type View = "cards" | "week" | "trash"

const STATUSES = ["Scheduled", "In Progress", "Waiting Approval", "Completed"] as const
const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "In Progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Waiting Approval": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

// ── Helpers ──────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}
function fmtTime(t: string | null) {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hr = parseInt(h, 10)
  const ampm = hr >= 12 ? "PM" : "AM"
  return `${hr % 12 || 12}:${m} ${ampm}`
}
function today() { return new Date().toISOString().slice(0, 10) }
function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00")
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().slice(0, 10)
}
function getMonday(d: string) {
  const dt = new Date(d + "T00:00:00")
  const day = dt.getDay()
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff)
  return dt.toISOString().slice(0, 10)
}
function vehicleLabel(v: Vehicle | null) {
  if (!v) return "No vehicle"
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ") || "Unknown vehicle"
}
function vehicleChipLabel(v: Vehicle | null) {
  if (!v) return "No vehicle"
  // Prefer: Year Make Model
  const yymm = [v.year, v.make, v.model].filter(Boolean).join(" ")
  if (yymm) return yymm
  // Fallback: License plate
  if (v.license_plate) return v.license_plate
  // Fallback: VIN last 6
  if (v.vin && v.vin.length >= 6) return `...${v.vin.slice(-6)}`
  return "Unknown"
}
function customerName(c: Customer | null) {
  if (!c) return "Unknown"
  return `${c.first_name} ${c.last_name}`
}
function uid() { return crypto.randomUUID() }

// ── Component ────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter()
  const [view, setView] = useState<View>("cards")
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => getMonday(today()))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Week view detail modal
  const [modalOrder, setModalOrder] = useState<WorkOrder | null>(null)

  // Customers & vehicles for the drawer selectors
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  // Form state
  const emptyForm = {
    customer_id: "", vehicle_id: "", task: "", status: "Scheduled" as string,
    due_date: today(), start_time: "", end_time: "", all_day: false,
    assigned_to: "", notes: "",
    pending_items: [] as PendingItem[],
  }
  const [form, setForm] = useState(emptyForm)

  // ── Fetch ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const isTrash = view === "trash"
    const url = isTrash
      ? "/api/admin/work-orders?trash=1"
      : "/api/admin/work-orders"
    const res = await fetch(url, { credentials: "same-origin" })
    if (res.status === 401) { router.push("/admin/login"); return }
    if (res.ok) {
      const data = await res.json()
      setOrders(data)
    }
    setLoading(false)
  }, [view, router])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const fetchCustomers = useCallback(async (search: string) => {
    const url = `/api/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`
    const res = await fetch(url, { credentials: "same-origin" })
    if (res.ok) setCustomers(await res.json())
  }, [])

  const fetchVehicles = useCallback(async (customerId: string) => {
    if (!customerId) { setCustomerVehicles([]); return }
    const res = await fetch(`/api/vehicles?customer_id=${customerId}`)
    if (res.ok) setCustomerVehicles(await res.json())
    else setCustomerVehicles([])
  }, [])

  // ── Drawer ─────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setEditingOrder(null)
    setForm(emptyForm)
    setCustomerSearch("")
    setCustomerVehicles([])
    setError(null)
    setDrawerOpen(true)
    fetchCustomers("")
  }, [fetchCustomers])

  const openEdit = useCallback((wo: WorkOrder) => {
    setEditingOrder(wo)
    setForm({
      customer_id: wo.shop_customers?.id || "",
      vehicle_id: wo.vehicles?.id || "",
      task: wo.task,
      status: wo.status,
      due_date: wo.due_date,
      start_time: wo.start_time || "",
      end_time: wo.end_time || "",
      all_day: wo.all_day,
      assigned_to: wo.assigned_to || "",
      notes: wo.notes || "",
      pending_items: wo.pending_items || [],
    })
    setCustomerSearch(wo.shop_customers ? customerName(wo.shop_customers) : "")
    setError(null)
    setDrawerOpen(true)
    fetchCustomers("")
    if (wo.shop_customers?.id) fetchVehicles(wo.shop_customers.id)
  }, [fetchCustomers, fetchVehicles])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditingOrder(null)
    setError(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.customer_id || !form.task.trim() || !form.due_date) {
      setError("Customer, task, and date are required.")
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      customer_id: form.customer_id,
      vehicle_id: form.vehicle_id || null,
      task: form.task.trim(),
      status: form.status,
      due_date: form.due_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      all_day: form.all_day,
      assigned_to: form.assigned_to.trim() || null,
      notes: form.notes.trim() || null,
      pending_items: form.pending_items,
    }

    const url = editingOrder ? `/api/admin/work-orders/${editingOrder.id}` : "/api/admin/work-orders"
    const method = editingOrder ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      closeDrawer()
      fetchOrders()
    } else {
      const data = await res.json()
      setError(data.error || "Failed to save")
    }
    setSaving(false)
  }, [form, editingOrder, closeDrawer, fetchOrders])

  // ── Status change ──────────────────────────────────────
  const handleStatusChange = useCallback(async (wo: WorkOrder, newStatus: string) => {
    await fetch(`/api/admin/work-orders/${wo.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchOrders()
  }, [fetchOrders])

  // ── Pending items toggle ───────────────────────────────
  const handleTogglePending = useCallback(async (wo: WorkOrder, itemId: string) => {
    const updated = (wo.pending_items || []).map((p) =>
      p.id === itemId ? { ...p, done: !p.done } : p,
    )
    await fetch(`/api/admin/work-orders/${wo.id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pending_items: updated }),
    })
    fetchOrders()
  }, [fetchOrders])

  // ── Trash actions ──────────────────────────────────────
  const handleSoftDelete = useCallback(async (id: string) => {
    await fetch(`/api/admin/work-orders/${id}`, { method: "DELETE", credentials: "same-origin" })
    fetchOrders()
  }, [fetchOrders])

  const handleRestore = useCallback(async (id: string) => {
    await fetch(`/api/admin/work-orders/${id}/restore`, { method: "POST", credentials: "same-origin" })
    fetchOrders()
  }, [fetchOrders])

  const handlePermDelete = useCallback(async (id: string) => {
    if (!confirm("Permanently delete this work order? This cannot be undone.")) return
    await fetch(`/api/admin/work-orders/${id}?permanent=1`, { method: "DELETE", credentials: "same-origin" })
    fetchOrders()
  }, [fetchOrders])

  // ── Derived data ───────────────────────────────────────
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const ordersByDate = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {}
    for (const o of orders) {
      if (!map[o.due_date]) map[o.due_date] = []
      map[o.due_date].push(o)
    }
    return map
  }, [orders])

  // Cards view: group by status
  const ordersByStatus = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {}
    for (const s of STATUSES) map[s] = []
    for (const o of orders) {
      if (map[o.status]) map[o.status].push(o)
    }
    return map
  }, [orders])

  // ── Pending items form helpers ─────────────────────────
  const addPendingItem = () => {
    setForm((prev) => ({
      ...prev,
      pending_items: [...prev.pending_items, { id: uid(), label: "", done: false }],
    }))
  }
  const updatePendingItem = (id: string, label: string) => {
    setForm((prev) => ({
      ...prev,
      pending_items: prev.pending_items.map((p) => (p.id === id ? { ...p, label } : p)),
    }))
  }
  const removePendingItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      pending_items: prev.pending_items.filter((p) => p.id !== id),
    }))
  }

  // ── Styles ─────────────────────────────────────────────
  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
  const btnPrimary =
    "rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
  const btnSecondary =
    "rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"

  // ── Render: Work Order Card ────────────────────────────
  const OrderCard = ({ wo, compact }: { wo: WorkOrder; compact?: boolean }) => (
    <div
      className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/30"
      onClick={() => openEdit(wo)}
    >
      {/* Status badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${STATUS_COLORS[wo.status] || ""}`}>
          {wo.status}
        </span>
        {!compact && wo.due_date && (
          <span className="text-[10px] text-muted-foreground/70">{fmtDate(wo.due_date)}</span>
        )}
      </div>

      {/* Customer */}
      <p className="text-sm font-medium text-foreground">{customerName(wo.shop_customers)}</p>

      {/* Vehicle */}
      {wo.vehicles && (
        <p className="mt-1 text-xs text-muted-foreground">{vehicleLabel(wo.vehicles)}</p>
      )}

      {/* Task / Description - full display */}
      <div className="mt-3 border-t border-border/50 pt-3">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">{wo.task}</p>
      </div>

      {!compact && (
        <>
          {/* Time */}
          {wo.start_time && (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Time:</span> {fmtTime(wo.start_time)}{wo.end_time ? ` - ${fmtTime(wo.end_time)}` : ""}
            </p>
          )}

          {/* Assigned */}
          {wo.assigned_to && (
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Assigned:</span> {wo.assigned_to}
            </p>
          )}

          {/* Pending items checklist */}
          {wo.pending_items && wo.pending_items.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t border-border/50 pt-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">Checklist</p>
              {wo.pending_items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleTogglePending(wo, item.id)}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  <span className={item.done ? "line-through opacity-50" : ""}>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )

  // ── Render: Event Chip (Week view only) ────────────────
  const EventChip = ({ wo }: { wo: WorkOrder }) => (
    <button
      type="button"
      onClick={() => setModalOrder(wo)}
      className={`w-full whitespace-normal rounded px-2 py-1.5 text-left text-[11px] font-medium leading-snug transition-colors line-clamp-3 sm:line-clamp-1 ${STATUS_COLORS[wo.status] || "bg-secondary text-foreground"}`}
    >
      {vehicleChipLabel(wo.vehicles)}
    </button>
  )

  // ── Render: Detail Modal (Week view) ───────────────────
  const DetailModal = ({ wo, onClose }: { wo: WorkOrder; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-border bg-card shadow-2xl">
        {/* Modal header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">Work Order Details</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal content */}
        <div className="flex flex-col gap-4 p-5">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[wo.status] || ""}`}>
              {wo.status}
            </span>
            <span className="text-xs text-muted-foreground">{fmtDate(wo.due_date)}</span>
          </div>

          {/* Vehicle */}
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Vehicle</p>
            <p className="text-sm text-foreground">{vehicleLabel(wo.vehicles)}</p>
            {wo.vehicles?.license_plate && (
              <p className="mt-0.5 text-xs text-muted-foreground">Plate: {wo.vehicles.license_plate}</p>
            )}
            {wo.vehicles?.vin && (
              <p className="mt-0.5 text-xs text-muted-foreground">VIN: {wo.vehicles.vin}</p>
            )}
          </div>

          {/* Customer */}
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
            <p className="text-sm text-foreground">{customerName(wo.shop_customers)}</p>
            {wo.shop_customers?.phone && (
              <p className="mt-0.5 text-xs text-muted-foreground">{wo.shop_customers.phone}</p>
            )}
            {wo.shop_customers?.email && (
              <p className="mt-0.5 text-xs text-muted-foreground">{wo.shop_customers.email}</p>
            )}
          </div>

          {/* Task */}
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Task / Description</p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{wo.task}</p>
          </div>

          {/* Time */}
          {(wo.start_time || wo.all_day) && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Time</p>
              <p className="text-sm text-foreground">
                {wo.all_day
                  ? "All day"
                  : `${fmtTime(wo.start_time)}${wo.end_time ? ` - ${fmtTime(wo.end_time)}` : ""}`}
              </p>
            </div>
          )}

          {/* Assigned */}
          {wo.assigned_to && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Assigned To</p>
              <p className="text-sm text-foreground">{wo.assigned_to}</p>
            </div>
          )}

          {/* Notes */}
          {wo.notes && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{wo.notes}</p>
            </div>
          )}

          {/* Pending items */}
          {wo.pending_items && wo.pending_items.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Checklist</p>
              <div className="flex flex-col gap-1.5">
                {wo.pending_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <span className={`h-4 w-4 rounded border ${item.done ? "border-emerald-500 bg-emerald-500/20" : "border-border"} flex items-center justify-center text-xs`}>
                      {item.done && "✓"}
                    </span>
                    <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="sticky bottom-0 flex gap-3 border-t border-border bg-card px-5 py-4">
          <button onClick={onClose} className={`${btnSecondary} flex-1`}>Close</button>
          <button
            onClick={() => { onClose(); openEdit(wo); }}
            className={`${btnPrimary} flex-1`}
          >
            Edit Work Order
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex rounded-lg border border-border">
            {(["cards", "week", "trash"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  view === v
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                } ${v === "cards" ? "rounded-l-lg" : v === "trash" ? "rounded-r-lg" : ""}`}
              >
                {v === "trash" ? "Trash" : v === "cards" ? "Board" : "Week"}
              </button>
            ))}
          </div>
          {view !== "trash" && (
            <button onClick={openCreate} className={btnPrimary}>
              + New Work Order
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading...</p>
        ) : view === "cards" ? (
          /* ── Board View ──────────────────────────────────── */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" style={{ minHeight: "calc(100vh - 180px)" }}>
            {STATUSES.map((status) => (
              <div key={status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {status}
                  </h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">{ordersByStatus[status]?.length || 0}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {(ordersByStatus[status] || []).map((wo) => (
                    <OrderCard key={wo.id} wo={wo} />
                  ))}
                  {(ordersByStatus[status] || []).length === 0 && (
                    <p className="py-8 text-center text-xs text-muted-foreground/50">No items</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : view === "week" ? (
          /* ── Week View ───────────────────────────────────── */
          <div className="flex flex-col gap-4">
            {/* Navigation */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <button onClick={() => setWeekStart(addDays(weekStart, -7))} className={`${btnSecondary} px-3 py-1.5 text-xs`}>&larr;</button>
              <button onClick={() => setWeekStart(getMonday(today()))} className={`${btnSecondary} px-3 py-1.5 text-xs`}>Today</button>
              <button onClick={() => setWeekStart(addDays(weekStart, 7))} className={`${btnSecondary} px-3 py-1.5 text-xs`}>&rarr;</button>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {fmtDate(weekStart)} &ndash; {fmtDate(addDays(weekStart, 6))}
              </span>
            </div>
            {/* Week grid - horizontal scroll on mobile */}
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[700px] grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const isToday = day === today()
                  const dayOrders = ordersByDate[day] || []
                  const maxVisible = 5
                  const visibleOrders = dayOrders.slice(0, maxVisible)
                  const hiddenCount = dayOrders.length - maxVisible
                  return (
                    <div
                      key={day}
                      className={`flex min-h-[160px] flex-col rounded-lg border p-2 ${
                        isToday ? "border-accent/50 bg-accent/5" : "border-border bg-card"
                      }`}
                    >
                      <p className={`mb-2 text-center text-[10px] font-semibold uppercase tracking-wide ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                        {new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <p className={`mb-2 text-center text-lg font-bold ${isToday ? "text-accent" : "text-foreground"}`}>
                        {new Date(day + "T00:00:00").getDate()}
                      </p>
                      <div className="flex flex-1 flex-col gap-1">
                        {visibleOrders.map((wo) => (
                          <EventChip key={wo.id} wo={wo} />
                        ))}
                        {hiddenCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setModalOrder(dayOrders[maxVisible])}
                            className="mt-1 rounded bg-secondary/50 px-2 py-1 text-center text-[10px] font-medium text-muted-foreground hover:bg-secondary"
                          >
                            +{hiddenCount} more
                          </button>
                        )}
                        {dayOrders.length === 0 && (
                          <p className="flex-1 text-center text-[10px] text-muted-foreground/40">—</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── Trash View ──────────────────────────────────── */
          <div>
            {orders.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Trash is empty.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {orders.map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{wo.task}</p>
                      <p className="text-xs text-muted-foreground">
                        {customerName(wo.shop_customers)} &middot; {fmtDate(wo.due_date)} &middot; Deleted {wo.deleted_at ? new Date(wo.deleted_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRestore(wo.id)} className={btnSecondary}>Restore</button>
                      <button
                        onClick={() => handlePermDelete(wo.id)}
                        className="rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Drawer Overlay ──────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={closeDrawer} />
          <div className="relative flex w-full max-w-lg flex-col bg-card shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {editingOrder ? "Edit Work Order" : "New Work Order"}
              </h2>
              <button onClick={closeDrawer} className="text-muted-foreground hover:text-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="flex flex-col gap-4">
                {error && <p className="text-sm text-destructive">{error}</p>}

                {/* Customer selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Customer <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <input
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerDropdown(true)
                        fetchCustomers(e.target.value)
                      }}
                      onFocus={() => { setShowCustomerDropdown(true); fetchCustomers(customerSearch) }}
                      placeholder="Search customers..."
                      className={inputClass + " w-full"}
                    />
                    {showCustomerDropdown && customers.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                        {customers.map((c) => (
                          <button
                            key={c.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent/10"
                            onClick={() => {
                              setForm((p) => ({ ...p, customer_id: c.id, vehicle_id: "" }))
                              setCustomerSearch(`${c.first_name} ${c.last_name}`)
                              setShowCustomerDropdown(false)
                              fetchVehicles(c.id)
                            }}
                          >
                            <span>{c.first_name} {c.last_name}</span>
                            {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle selector */}
                {form.customer_id && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Vehicle</label>
                    <select
                      value={form.vehicle_id}
                      onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">No vehicle</option>
                      {customerVehicles.map((v) => (
                        <option key={v.id} value={v.id}>{vehicleLabel(v)} {v.license_plate ? `(${v.license_plate})` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Task */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Task / Description <span className="text-destructive">*</span></label>
                  <textarea
                    value={form.task}
                    onChange={(e) => setForm((p) => ({ ...p, task: e.target.value }))}
                    rows={2}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={inputClass}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date <span className="text-destructive">*</span></label>
                    <input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className={inputClass} />
                  </div>
                  {!form.all_day && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                        <input type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">End Time</label>
                        <input type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} className={inputClass} />
                      </div>
                    </>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={form.all_day} onChange={(e) => setForm((p) => ({ ...p, all_day: e.target.checked }))} className="accent-accent" />
                  All day
                </label>

                {/* Assigned to */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Assigned To</label>
                  <input value={form.assigned_to} onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))} placeholder="e.g. John" className={inputClass} />
                </div>

                {/* Pending Items */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Pending Items / Checklist</label>
                  {form.pending_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        value={item.label}
                        onChange={(e) => updatePendingItem(item.id, e.target.value)}
                        placeholder="Item description"
                        className={`${inputClass} flex-1`}
                      />
                      <button onClick={() => removePendingItem(item.id)} className="text-destructive hover:text-destructive/70">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button onClick={addPendingItem} className="mt-1 text-xs text-accent hover:text-accent/80">+ Add Item</button>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <div>
                {editingOrder && (
                  <button
                    onClick={() => { handleSoftDelete(editingOrder.id); closeDrawer() }}
                    className="text-sm text-destructive hover:text-destructive/80"
                  >
                    Move to Trash
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={closeDrawer} className={btnSecondary}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className={btnPrimary}>
                  {saving ? "Saving..." : editingOrder ? "Save Changes" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week view detail modal */}
      {modalOrder && <DetailModal wo={modalOrder} onClose={() => setModalOrder(null)} />}
    </div>
  )
}
