"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ExpirableImage } from "@/components/expirable-image"

type TireDepthData = {
  fl?: string
  fr?: string
  rl?: string
  rr?: string
}

type InspectionItem = {
  id: string
  item_number: number
  category: string
  item_label: string
  status: "PASS" | "FAIL" | null
  fail_notes: string | null
  tire_depths: TireDepthData | null
}

type InspectionPhoto = {
  id: string
  blob_url: string
  file_name: string | null
}

type Inspection = {
  id: string
  inspection_date: string
  customer_name: string | null
  vehicle_plate: string | null
  vehicle_vin: string | null
  vehicle_year: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  vehicle_trim: string | null
  mileage: string | null
  additional_notes: string | null
  created_at: string
  updated_at: string | null
  inspection_items: InspectionItem[]
  inspection_photos: InspectionPhoto[]
  // Computed fields from API
  failed_count: number
  passed_count: number
  total_items: number
  photo_count: number
  overall_status: "passed" | "failed" | "pending"
}

type EditForm = {
  customer_name: string
  vehicle_plate: string
  vehicle_vin: string
  vehicle_year: string
  vehicle_make: string
  vehicle_model: string
  vehicle_trim: string
  mileage: string
  additional_notes: string
  items: InspectionItem[]
}

export default function AdminInspectionsPage() {
  const router = useRouter()

  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "passed" | "failed">("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [selected, setSelected] = useState<Inspection | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [showFailedOnly, setShowFailedOnly] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [photoModal, setPhotoModal] = useState<string | null>(null)

  const fetchInspections = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (dateFrom) params.append("from", dateFrom)
      if (dateTo) params.append("to", dateTo)

      const url = `/api/admin/inspections${params.toString() ? `?${params}` : ""}`
      const res = await fetch(url, { credentials: "same-origin" })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) setInspections(data)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [router, search, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSearch(searchInput)
    },
    [searchInput],
  )

  const handleClearFilters = useCallback(() => {
    setSearchInput("")
    setSearch("")
    setStatusFilter("all")
    setDateFrom("")
    setDateTo("")
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/inspections/${id}`, { method: "DELETE", credentials: "same-origin" })
      if (res.ok) {
        setInspections((prev) => prev.filter((i) => i.id !== id))
        if (selected?.id === id) {
          setSelected(null)
          setEditing(false)
        }
      }
    } catch {
      // noop
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }, [selected])

  const startEditing = useCallback((inspection: Inspection) => {
    setEditing(true)
    setEditError(null)
    setEditForm({
      customer_name: inspection.customer_name || "",
      vehicle_plate: inspection.vehicle_plate || "",
      vehicle_vin: inspection.vehicle_vin || "",
      vehicle_year: inspection.vehicle_year || "",
      vehicle_make: inspection.vehicle_make || "",
      vehicle_model: inspection.vehicle_model || "",
      vehicle_trim: inspection.vehicle_trim || "",
      mileage: inspection.mileage || "",
      additional_notes: inspection.additional_notes || "",
      items: inspection.inspection_items.map((item) => ({ ...item })),
    })
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!selected || !editForm) return
    setSaving(true)
    setEditError(null)

    try {
      const res = await fetch(`/api/admin/inspections/${selected.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection: {
            customer_name: editForm.customer_name || null,
            vehicle_plate: editForm.vehicle_plate || null,
            vehicle_vin: editForm.vehicle_vin || null,
            vehicle_year: editForm.vehicle_year || null,
            vehicle_make: editForm.vehicle_make || null,
            vehicle_model: editForm.vehicle_model || null,
            vehicle_trim: editForm.vehicle_trim || null,
            mileage: editForm.mileage || null,
            additional_notes: editForm.additional_notes || null,
          },
          items: editForm.items,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setEditError(data.error || "Save failed")
        setSaving(false)
        return
      }

      setEditing(false)
      setEditForm(null)
      fetchInspections()
      // Refresh selected inspection
      const detailRes = await fetch(`/api/admin/inspections/${selected.id}`, { credentials: "same-origin" })
      if (detailRes.ok) {
        const updated = await detailRes.json()
        setSelected({ ...selected, ...updated })
      }
    } catch {
      setEditError("Save failed")
    } finally {
      setSaving(false)
    }
  }, [selected, editForm, fetchInspections])

  const updateEditItem = useCallback((itemId: string, field: keyof InspectionItem, value: unknown) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      items: editForm.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    })
  }, [editForm])

  const updateTireDepth = useCallback((itemId: string, wheel: keyof TireDepthData, value: string) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      items: editForm.items.map((item) => {
        if (item.id !== itemId) return item
        const newDepths = { ...(item.tire_depths || {}) }
        if (value === "") {
          delete newDepths[wheel]
        } else {
          newDepths[wheel] = value
        }
        return { ...item, tire_depths: Object.keys(newDepths).length > 0 ? newDepths : null }
      }),
    })
  }, [editForm])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

  const formatInspectionDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const vehicleLabel = (inspection: Inspection) => {
    const parts = [inspection.vehicle_year, inspection.vehicle_make, inspection.vehicle_model, inspection.vehicle_trim]
    return parts.filter(Boolean).join(" ") || "Unknown vehicle"
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
  const labelClass = "text-xs text-muted-foreground"
  const btnPrimary = "rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
  const btnSecondary = "rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-card disabled:opacity-50"

  // Get items to display (filtered if showFailedOnly)
  const displayItems = selected
    ? showFailedOnly
      ? selected.inspection_items.filter((i) => i.status === "FAIL")
      : selected.inspection_items
    : []

  // Group items by category for display
  const itemsByCategory = displayItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, InspectionItem[]>)

  return (
    <>
      <div className="flex h-full flex-col print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="font-sans text-lg font-medium text-foreground">Inspections</h1>
        </div>

        {/* Filters */}
        <div className="border-b border-border px-6 py-3">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search by customer, vehicle, VIN, plate..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "passed" | "failed")}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Status</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="To"
            />
            <button type="submit" className={btnPrimary}>Search</button>
            {(search || statusFilter !== "all" || dateFrom || dateTo) && (
              <button type="button" onClick={handleClearFilters} className={btnSecondary}>Clear</button>
            )}
          </form>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : inspections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <svg className="h-12 w-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                <p className="text-sm text-muted-foreground">
                  {search || statusFilter !== "all" || dateFrom || dateTo ? "No results found." : "No inspections yet."}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vehicle</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">VIN / Plate</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Photos</th>
                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((inspection) => (
                    <tr
                      key={inspection.id}
                      onClick={() => {
                        setSelected(inspection)
                        setEditing(false)
                        setEditForm(null)
                        setEditError(null)
                        setShowFailedOnly(false)
                      }}
                      className={`border-b border-border/50 transition-colors hover:bg-card/50 cursor-pointer ${
                        selected?.id === inspection.id ? "bg-card" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-foreground">
                        <div>{formatInspectionDate(inspection.inspection_date)}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(inspection.created_at)}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-foreground">
                        {inspection.customer_name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-foreground">
                        {vehicleLabel(inspection)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {inspection.vehicle_vin && (
                          <div className="font-mono text-xs text-muted-foreground">{inspection.vehicle_vin}</div>
                        )}
                        {inspection.vehicle_plate && (
                          <div className="text-xs text-muted-foreground">{inspection.vehicle_plate}</div>
                        )}
                        {!inspection.vehicle_vin && !inspection.vehicle_plate && "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          inspection.overall_status === "passed"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : inspection.overall_status === "failed"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-secondary text-muted-foreground border border-border"
                        }`}>
                          {inspection.overall_status === "failed" && (
                            <span className="font-bold">{inspection.failed_count}</span>
                          )}
                          {inspection.overall_status === "passed" ? "Passed" : inspection.overall_status === "failed" ? "Failed" : "Pending"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-sm text-muted-foreground">
                        {inspection.photo_count}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelected(inspection)
                              setEditing(false)
                              setShowFailedOnly(false)
                            }}
                            className="text-sm text-accent hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/inspections/${inspection.id}/report`)
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Report
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmDelete(inspection.id)
                            }}
                            disabled={deleting === inspection.id}
                            className="text-sm text-destructive hover:underline disabled:opacity-50"
                          >
                            {deleting === inspection.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail Drawer */}
          {selected && (
            <aside className="w-[450px] shrink-0 overflow-auto border-l border-border bg-card">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
                <h2 className="font-sans text-sm font-medium text-foreground">Inspection Details</h2>
                <div className="flex items-center gap-2">
                  {!editing && (
                    <>
                      <button onClick={() => startEditing(selected)} className="text-xs font-medium text-accent hover:underline">Edit</button>
                      <button onClick={() => router.push(`/admin/inspections/${selected.id}/report`)} className="text-xs font-medium text-muted-foreground hover:text-foreground">Print</button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelected(null)
                      setEditing(false)
                      setEditForm(null)
                    }}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Close"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-5 p-5">
                {editing && editForm ? (
                  <>
                    {/* Edit mode */}
                    <section>
                      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Customer &amp; Vehicle</h3>
                      <div className="flex flex-col gap-2">
                        <div>
                          <label className={labelClass}>Customer Name</label>
                          <input value={editForm.customer_name} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>Year</label>
                            <input value={editForm.vehicle_year} onChange={(e) => setEditForm({ ...editForm, vehicle_year: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Make</label>
                            <input value={editForm.vehicle_make} onChange={(e) => setEditForm({ ...editForm, vehicle_make: e.target.value })} className={inputClass} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>Model</label>
                            <input value={editForm.vehicle_model} onChange={(e) => setEditForm({ ...editForm, vehicle_model: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Trim</label>
                            <input value={editForm.vehicle_trim} onChange={(e) => setEditForm({ ...editForm, vehicle_trim: e.target.value })} className={inputClass} />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>VIN</label>
                          <input value={editForm.vehicle_vin} onChange={(e) => setEditForm({ ...editForm, vehicle_vin: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>License Plate</label>
                          <input value={editForm.vehicle_plate} onChange={(e) => setEditForm({ ...editForm, vehicle_plate: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Mileage</label>
                          <input value={editForm.mileage} onChange={(e) => setEditForm({ ...editForm, mileage: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Checklist Items</h3>
                      <div className="flex flex-col gap-3">
                        {editForm.items.map((item) => (
                          <div key={item.id} className="rounded-lg border border-border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm text-foreground">{item.item_number}. {item.item_label}</span>
                              <select
                                value={item.status || ""}
                                onChange={(e) => updateEditItem(item.id, "status", e.target.value || null)}
                                className="rounded border border-border bg-background px-2 py-1 text-xs"
                              >
                                <option value="">--</option>
                                <option value="PASS">Pass</option>
                                <option value="FAIL">Fail</option>
                              </select>
                            </div>
                            {item.status === "FAIL" && (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  placeholder="Failure notes..."
                                  value={item.fail_notes || ""}
                                  onChange={(e) => updateEditItem(item.id, "fail_notes", e.target.value)}
                                  className={`${inputClass} text-xs`}
                                />
                              </div>
                            )}
                            {item.item_label.toLowerCase().includes("tire tread") && item.status === "FAIL" && (
                              <div className="mt-2 grid grid-cols-4 gap-2">
                                {(["fl", "fr", "rl", "rr"] as const).map((wheel) => (
                                  <div key={wheel} className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase text-muted-foreground text-center">{wheel}</label>
                                    <input
                                      type="text"
                                      value={item.tire_depths?.[wheel] || ""}
                                      onChange={(e) => updateTireDepth(item.id, wheel, e.target.value)}
                                      placeholder="--"
                                      className="rounded border border-border bg-background px-2 py-1 text-xs text-center"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Notes</h3>
                      <textarea
                        value={editForm.additional_notes}
                        onChange={(e) => setEditForm({ ...editForm, additional_notes: e.target.value })}
                        rows={3}
                        className={`${inputClass} resize-y`}
                      />
                    </section>

                    {editError && <p className="text-sm text-destructive">{editError}</p>}

                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} disabled={saving} className={`flex-1 ${btnPrimary}`}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => { setEditing(false); setEditForm(null); setEditError(null) }}
                        className={btnSecondary}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View mode */}
                    <section>
                      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Overview</h3>
                      <div className="flex flex-col gap-1.5">
                        <DetailRow label="Inspection Date" value={formatInspectionDate(selected.inspection_date)} />
                        <DetailRow label="Submitted" value={formatDate(selected.created_at)} />
                        <DetailRow label="Customer" value={selected.customer_name} />
                        <DetailRow label="Vehicle" value={vehicleLabel(selected)} />
                        <DetailRow label="VIN" value={selected.vehicle_vin} mono />
                        <DetailRow label="Plate" value={selected.vehicle_plate} />
                        <DetailRow label="Mileage" value={selected.mileage} />
                      </div>
                    </section>

                    <section>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-accent">
                          Checklist ({selected.passed_count} passed, {selected.failed_count} failed)
                        </h3>
                        {selected.failed_count > 0 && (
                          <button
                            onClick={() => setShowFailedOnly(!showFailedOnly)}
                            className="text-xs text-accent hover:underline"
                          >
                            {showFailedOnly ? "Show all" : "Show failed only"}
                          </button>
                        )}
                      </div>

                      {Object.entries(itemsByCategory).map(([category, items]) => (
                        <div key={category} className="mb-4">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">{category}</p>
                          <div className="flex flex-col gap-1.5">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className={`flex flex-col gap-1 rounded-lg border p-2 ${
                                  item.status === "FAIL"
                                    ? "border-destructive/30 bg-destructive/5"
                                    : "border-border bg-background"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-foreground">{item.item_number}. {item.item_label}</span>
                                  <span className={`text-xs font-medium ${
                                    item.status === "PASS" ? "text-emerald-500" : item.status === "FAIL" ? "text-destructive" : "text-muted-foreground"
                                  }`}>
                                    {item.status || "--"}
                                  </span>
                                </div>
                                {item.fail_notes && (
                                  <p className="text-xs text-destructive/80 pl-4">Issue: {item.fail_notes}</p>
                                )}
                                {item.tire_depths && Object.keys(item.tire_depths).length > 0 && (
                                  <div className="flex gap-2 pl-4">
                                    {(["fl", "fr", "rl", "rr"] as const).map((wheel) =>
                                      item.tire_depths?.[wheel] !== undefined ? (
                                        <span key={wheel} className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                                          {wheel.toUpperCase()}: {item.tire_depths[wheel]}
                                        </span>
                                      ) : null
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </section>

                    {selected.additional_notes && (
                      <section>
                        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">Additional Notes</h3>
                        <p className="whitespace-pre-wrap text-sm text-foreground">{selected.additional_notes}</p>
                      </section>
                    )}

                    {selected.inspection_photos && selected.inspection_photos.length > 0 && (
                      <section>
                        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">
                          Photos ({selected.inspection_photos.length})
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {selected.inspection_photos.map((photo) => (
                            <button
                              key={photo.id}
                              onClick={() => setPhotoModal(photo.blob_url)}
                              className="relative aspect-square overflow-hidden rounded-lg border border-border hover:border-accent transition-colors"
                            >
                              <ExpirableImage
                                src={photo.blob_url}
                                alt={photo.file_name || "Inspection photo"}
                                fill
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => router.push(`/admin/inspections/${selected.id}/report`)} className={`flex-1 ${btnSecondary}`}>
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                          </svg>
                          Print / PDF
                        </span>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(selected.id)}
                        className="rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {photoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 print:hidden" onClick={() => setPhotoModal(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image src={photoModal} alt="Inspection photo" width={1200} height={900} className="max-h-[90vh] w-auto rounded-lg object-contain" />
            <button
              onClick={() => setPhotoModal(null)}
              className="absolute -right-3 -top-3 rounded-full bg-card p-2 text-foreground shadow-lg hover:bg-accent hover:text-accent-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground">Delete Inspection</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete this inspection? This will permanently remove the inspection record, all checklist items, and all associated photos. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className={`flex-1 ${btnSecondary}`}>Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting === confirmDelete ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DetailRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value || "-"}</span>
    </div>
  )
}
