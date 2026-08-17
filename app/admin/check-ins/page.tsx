"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ExpirableImage } from "@/components/expirable-image"
import { useRouter } from "next/navigation"

type CheckinRecord = {
  id: string
  mileage: string | null
  notes: string | null
  time_sensitivity: string | null
  created_at: string
  shop_customers: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  } | null
  vehicles: {
    id: string
    vin: string | null
    year: string | null
    make: string | null
    model: string | null
    trim: string | null
    license_plate: string | null
    mileage: string | null
  } | null
  check_in_photos: Array<{
    id: string
    blob_url: string
    file_name: string | null
  }>
}

type EditForm = {
  mileage: string
  notes: string
  year: string
  make: string
  model: string
  trim: string
  vin: string
  license_plate: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

type QuickFilter = "all" | "today" | "week" | "month" | "with_photos" | "missing_vin"
type DetailTab = "customer" | "vehicle" | "photos" | "notes"

export default function AdminCheckInsPage() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<CheckinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selected, setSelected] = useState<CheckinRecord | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all")
  const [detailTab, setDetailTab] = useState<DetailTab>("customer")

  const fetchCheckins = useCallback(async (query?: string) => {
    setLoading(true)
    try {
      const url = query
        ? `/api/admin/checkins?search=${encodeURIComponent(query)}`
        : "/api/admin/checkins"
      const res = await fetch(url, { credentials: "same-origin" })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) setCheckins(data)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCheckins()
  }, [fetchCheckins])

  // Date helpers
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Filtered checkins based on quick filter
  const filteredCheckins = useMemo(() => {
    return checkins.filter((c) => {
      const createdAt = new Date(c.created_at)
      switch (quickFilter) {
        case "today":
          return createdAt >= today
        case "week":
          return createdAt >= startOfWeek
        case "month":
          return createdAt >= startOfMonth
        case "with_photos":
          return c.check_in_photos && c.check_in_photos.length > 0
        case "missing_vin":
          return !c.vehicles?.vin
        default:
          return true
      }
    })
  }, [checkins, quickFilter, today, startOfWeek, startOfMonth])

  // KPI calculations
  const kpis = useMemo(() => {
    const todayCount = checkins.filter((c) => new Date(c.created_at) >= today).length
    const weekCount = checkins.filter((c) => new Date(c.created_at) >= startOfWeek).length
    const totalRecords = checkins.length
    const totalPhotos = checkins.reduce((sum, c) => sum + (c.check_in_photos?.length || 0), 0)
    return { todayCount, weekCount, totalRecords, totalPhotos }
  }, [checkins, today, startOfWeek])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSearch(searchInput)
      fetchCheckins(searchInput)
    },
    [searchInput, fetchCheckins],
  )

  const handleClearSearch = useCallback(() => {
    setSearchInput("")
    setSearch("")
    fetchCheckins()
  }, [fetchCheckins])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this check-in?")) return
      setDeleting(id)
      try {
        const res = await fetch(`/api/admin/checkins/${id}`, { method: "DELETE", credentials: "same-origin" })
        if (res.ok) {
          setCheckins((prev) => prev.filter((c) => c.id !== id))
          if (selected?.id === id) {
            setSelected(null)
            setEditing(false)
          }
        }
      } catch {
        // noop
      } finally {
        setDeleting(null)
      }
    },
    [selected],
  )

  const startEditing = useCallback((checkin: CheckinRecord) => {
    setEditing(true)
    setEditError(null)
    setEditForm({
      mileage: checkin.mileage || "",
      notes: checkin.notes || "",
      year: checkin.vehicles?.year || "",
      make: checkin.vehicles?.make || "",
      model: checkin.vehicles?.model || "",
      trim: checkin.vehicles?.trim || "",
      vin: checkin.vehicles?.vin || "",
      license_plate: checkin.vehicles?.license_plate || "",
      first_name: checkin.shop_customers?.first_name || "",
      last_name: checkin.shop_customers?.last_name || "",
      email: checkin.shop_customers?.email || "",
      phone: checkin.shop_customers?.phone || "",
    })
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!selected || !editForm) return
    setSaving(true)
    setEditError(null)

    try {
      const res = await fetch(`/api/admin/checkins/${selected.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkin: {
            mileage: editForm.mileage || null,
            notes: editForm.notes || null,
          },
          vehicle_id: selected.vehicles?.id,
          vehicle: {
            year: editForm.year || null,
            make: editForm.make || null,
            model: editForm.model || null,
            trim: editForm.trim || null,
            vin: editForm.vin || null,
            license_plate: editForm.license_plate || null,
          },
          customer_id: selected.shop_customers?.id,
          customer: {
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            email: editForm.email || null,
            phone: editForm.phone || null,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setEditError(data.error || "Save failed")
        setSaving(false)
        return
      }

      setEditing(false)
      setEditForm(null)
      fetchCheckins(search || undefined)
    } catch {
      setEditError("Save failed")
    } finally {
      setSaving(false)
    }
  }, [selected, editForm, fetchCheckins, search])

  const handlePrint = useCallback(() => {
    if (!selected) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const customer = selected.shop_customers
    const vehicle = selected.vehicles

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Check-In - ${customer ? `${customer.first_name} ${customer.last_name}` : "Unknown"}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 14px; color: #666; margin-bottom: 24px; font-weight: normal; }
          h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #e8922a; margin: 24px 0 12px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; font-size: 14px; }
          .value { font-size: 14px; }
          .mono { font-family: monospace; font-size: 12px; }
          .notes { background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 8px; white-space: pre-wrap; }
          .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
          .photos img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Hub Tire Shop - Check-In Record</h1>
        <h2>${formatDate(selected.created_at)}</h2>
        
        <h3>Customer</h3>
        <div class="row"><span class="label">Name</span><span class="value">${customer ? `${customer.first_name} ${customer.last_name}` : "-"}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${customer?.email || "-"}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${customer?.phone || "-"}</span></div>
        
        <h3>Vehicle</h3>
        <div class="row"><span class="label">Year/Make/Model</span><span class="value">${[vehicle?.year, vehicle?.make, vehicle?.model, vehicle?.trim].filter(Boolean).join(" ") || "-"}</span></div>
        <div class="row"><span class="label">VIN</span><span class="value mono">${vehicle?.vin || "-"}</span></div>
        <div class="row"><span class="label">License Plate</span><span class="value">${vehicle?.license_plate || "-"}</span></div>
        <div class="row"><span class="label">Mileage</span><span class="value">${selected.mileage || "-"}</span></div>
        
        ${selected.notes ? `<h3>Notes</h3><div class="notes">${selected.notes}</div>` : ""}
        
        ${selected.check_in_photos?.length ? `
          <h3>Photos (${selected.check_in_photos.length})</h3>
          <div class="photos">
            ${selected.check_in_photos.map((p) => `<img src="${p.blob_url}" alt="Photo" />`).join("")}
          </div>
        ` : ""}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }, [selected])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
  const labelClass = "text-xs text-muted-foreground"

  const quickFilters: { key: QuickFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "with_photos", label: "With Photos" },
    { key: "missing_vin", label: "Missing VIN" },
  ]

  const detailTabs: { key: DetailTab; label: string }[] = [
    { key: "customer", label: "Customer" },
    { key: "vehicle", label: "Vehicle" },
    { key: "photos", label: "Photos" },
    { key: "notes", label: "Notes" },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="font-sans text-lg font-semibold text-foreground">Check-Ins</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 border-b border-border px-6 py-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{kpis.todayCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">This Week</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{kpis.weekCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Records</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{kpis.totalRecords}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Photos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{kpis.totalPhotos}</p>
        </div>
      </div>

      {/* Search bar and quick filters */}
      <div className="border-b border-border px-6 py-3">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search name, phone, VIN, plate, make/model..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-card"
            >
              Clear
            </button>
          )}
        </form>

        {/* Quick Filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          {quickFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setQuickFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                quickFilter === f.key
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : filteredCheckins.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">
                {search ? "No results found." : quickFilter !== "all" ? "No check-ins match this filter." : "No check-ins yet."}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-card shadow-sm">
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="hidden px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Time Sensitivity</th>
                  <th className="hidden px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Vehicle</th>
                  <th className="hidden px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">VIN / Plate</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photos</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCheckins.map((checkin) => (
                  <tr
                    key={checkin.id}
                    onClick={() => {
                      setSelected(checkin)
                      setEditing(false)
                      setEditForm(null)
                      setEditError(null)
                      setDetailTab("customer")
                    }}
                    className={`cursor-pointer transition-colors hover:bg-accent/5 ${
                      selected?.id === checkin.id ? "bg-accent/10" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      {formatDate(checkin.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                      {checkin.shop_customers
                        ? `${checkin.shop_customers.first_name} ${checkin.shop_customers.last_name}`
                        : "-"}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                      {checkin.time_sensitivity ? (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            checkin.time_sensitivity === "No Rush"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {checkin.time_sensitivity}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-foreground md:table-cell">
                      {checkin.vehicles
                        ? [checkin.vehicles.year, checkin.vehicles.make, checkin.vehicles.model]
                            .filter(Boolean)
                            .join(" ") || "-"
                        : "-"}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 lg:table-cell">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-muted-foreground">{checkin.vehicles?.vin || "-"}</span>
                        {checkin.vehicles?.license_plate && (
                          <span className="text-xs text-muted-foreground">{checkin.vehicles.license_plate}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {checkin.check_in_photos?.length ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          {checkin.check_in_photos.length}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(checkin.id)
                        }}
                        disabled={deleting === checkin.id}
                        className="text-xs font-medium text-destructive transition-colors hover:text-destructive/80 disabled:opacity-50"
                      >
                        {deleting === checkin.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Drawer */}
        {selected && (
          <aside className="w-full shrink-0 overflow-auto border-l border-border bg-card sm:w-96">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-sans text-sm font-semibold text-foreground">Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                  title="Print"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                </button>
                {!editing && (
                  <button
                    onClick={() => startEditing(selected)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelected(null)
                    setEditing(false)
                    setEditForm(null)
                  }}
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Close"
                  title="Close"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            {!editing && (
              <div className="flex border-b border-border">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                      detailTab === tab.key
                        ? "border-b-2 border-accent text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {tab.key === "photos" && selected.check_in_photos?.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px]">
                        {selected.check_in_photos.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-5 p-5">
              {editing && editForm ? (
                <>
                  {/* Edit mode */}
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Customer</h3>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className={labelClass}>First Name</label>
                        <input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name</label>
                        <input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass} />
                      </div>
                    </div>
                  </section>
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Vehicle</h3>
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Year</label>
                          <input value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Make</label>
                          <input value={editForm.make} onChange={(e) => setEditForm({ ...editForm, make: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Model</label>
                          <input value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Trim</label>
                          <input value={editForm.trim} onChange={(e) => setEditForm({ ...editForm, trim: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>VIN</label>
                        <input value={editForm.vin} onChange={(e) => setEditForm({ ...editForm, vin: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>License Plate</label>
                        <input value={editForm.license_plate} onChange={(e) => setEditForm({ ...editForm, license_plate: e.target.value })} className={inputClass} />
                      </div>
                    </div>
                  </section>
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">Check-In</h3>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className={labelClass}>Mileage</label>
                        <input value={editForm.mileage} onChange={(e) => setEditForm({ ...editForm, mileage: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Notes</label>
                        <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} className={`${inputClass} resize-y`} />
                      </div>
                    </div>
                  </section>

                  {editError && (
                    <p className="text-sm text-destructive">{editError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        setEditForm(null)
                        setEditError(null)
                      }}
                      className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-background"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* View mode - Tabbed content */}
                  {detailTab === "customer" && (
                    <section>
                      <div className="flex flex-col gap-3">
                        <DetailRow label="Name" value={selected.shop_customers ? `${selected.shop_customers.first_name} ${selected.shop_customers.last_name}` : "-"} />
                        <DetailRow label="Email" value={selected.shop_customers?.email} />
                        <DetailRow label="Phone" value={selected.shop_customers?.phone} />
                        <DetailRow label="Checked In" value={formatDate(selected.created_at)} />
                        <DetailRow label="Record ID" value={selected.id} mono />
                      </div>
                    </section>
                  )}

                  {detailTab === "vehicle" && (
                    <section>
                      <div className="flex flex-col gap-3">
                        <DetailRow label="Year" value={selected.vehicles?.year} />
                        <DetailRow label="Make" value={selected.vehicles?.make} />
                        <DetailRow label="Model" value={selected.vehicles?.model} />
                        <DetailRow label="Trim" value={selected.vehicles?.trim} />
                        <DetailRow label="VIN" value={selected.vehicles?.vin} mono />
                        <DetailRow label="License Plate" value={selected.vehicles?.license_plate} />
                        <DetailRow label="Mileage (Check-In)" value={selected.mileage} />
                        <DetailRow label="Mileage (Vehicle)" value={selected.vehicles?.mileage} />
                      </div>
                    </section>
                  )}

                  {detailTab === "photos" && (
                    <section>
                      {selected.check_in_photos && selected.check_in_photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {selected.check_in_photos.map((photo) => (
                            <a
                              key={photo.id}
                              href={photo.blob_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square overflow-hidden rounded-lg border border-border transition-all hover:border-accent hover:shadow-lg"
                            >
                              <ExpirableImage
                                src={photo.blob_url}
                                alt={photo.file_name || "Photo"}
                                fill
                                className="object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">No photos attached</p>
                      )}
                    </section>
                  )}

                  {detailTab === "notes" && (
                    <section>
                      {selected.notes ? (
                        <div className="rounded-lg border border-border bg-background p-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{selected.notes}</p>
                        </div>
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">No notes available</p>
                      )}
                      {selected.time_sensitivity && (
                        <div className="mt-4">
                          <DetailRow label="Time Sensitivity" value={selected.time_sensitivity} />
                        </div>
                      )}
                    </section>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 flex gap-2 border-t border-border pt-4">
                    <button
                      onClick={handlePrint}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent/10"
                    >
                      Print
                    </button>
                    <button
                      onClick={() => startEditing(selected)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selected.id)}
                      disabled={deleting === selected.id}
                      className="flex-1 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {deleting === selected.id ? "..." : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-lg bg-background/50 px-3 py-2">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`text-right text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>
        {value || "-"}
      </span>
    </div>
  )
}
