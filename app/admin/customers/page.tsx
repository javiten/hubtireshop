"use client"

import { useState, useEffect, useCallback } from "react"
import { ExpirableImage } from "@/components/expirable-image"
import { useRouter } from "next/navigation"

type Customer = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  created_at: string
}

type Vehicle = {
  id: string
  vin: string | null
  year: string | null
  make: string | null
  model: string | null
  trim: string | null
  license_plate: string | null
  notes: string | null
  created_at: string
}

type CheckIn = {
  id: string
  mileage: string | null
  notes: string | null
  created_at: string
  vehicles: { year: string | null; make: string | null; model: string | null } | null
  check_in_photos: Array<{ id: string; blob_url: string; file_name: string | null }>
}

type CustomerDetail = Customer & {
  vehicles: Vehicle[]
  check_ins: CheckIn[]
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selected, setSelected] = useState<CustomerDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Edit customer
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [customerForm, setCustomerForm] = useState({ first_name: "", last_name: "", email: "", phone: "" })
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [savingCustomer, setSavingCustomer] = useState(false)

  // Create customer
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ first_name: "", last_name: "", email: "", phone: "" })
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Add vehicle
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ year: "", make: "", model: "", trim: "", vin: "", license_plate: "" })
  const [addingVehicle, setAddingVehicle] = useState(false)

  // Edit vehicle
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [editVehicleForm, setEditVehicleForm] = useState({ year: "", make: "", model: "", trim: "", vin: "", license_plate: "" })
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async (query?: string) => {
    setLoading(true)
    try {
      const url = query
        ? `/api/admin/customers?search=${encodeURIComponent(query)}`
        : "/api/admin/customers"
      const res = await fetch(url, { credentials: "same-origin" })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) setCustomers(data)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { credentials: "same-origin" })
      if (res.ok) {
        const data = await res.json()
        setSelected(data)
      }
    } catch {
      // noop
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSearch(searchInput)
      fetchCustomers(searchInput)
    },
    [searchInput, fetchCustomers],
  )

  const handleClearSearch = useCallback(() => {
    setSearchInput("")
    setSearch("")
    fetchCustomers()
  }, [fetchCustomers])

  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setEditingCustomer(false)
      setShowAddVehicle(false)
      setEditingVehicleId(null)
      fetchDetail(customer.id)
    },
    [fetchDetail],
  )

  const handleDeleteCustomer = useCallback(
    async (id: string) => {
      if (!confirm("Delete this customer and all their vehicles/check-ins?")) return
      try {
        const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE", credentials: "same-origin" })
        if (res.ok) {
          setCustomers((prev) => prev.filter((c) => c.id !== id))
          if (selected?.id === id) setSelected(null)
        }
      } catch {
        // noop
      }
    },
    [selected],
  )

  // Create customer
  const handleCreateCustomer = useCallback(async () => {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || "Failed")
        setCreating(false)
        return
      }
      setShowCreate(false)
      setCreateForm({ first_name: "", last_name: "", email: "", phone: "" })
      fetchCustomers(search || undefined)
    } catch {
      setCreateError("Failed")
    } finally {
      setCreating(false)
    }
  }, [createForm, fetchCustomers, search])

  // Save customer edit
  const handleSaveCustomer = useCallback(async () => {
    if (!selected) return
    setSavingCustomer(true)
    setCustomerError(null)
    try {
      const res = await fetch(`/api/admin/customers/${selected.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setCustomerError(data.error || "Failed")
        setSavingCustomer(false)
        return
      }
      setEditingCustomer(false)
      fetchDetail(selected.id)
      fetchCustomers(search || undefined)
    } catch {
      setCustomerError("Failed")
    } finally {
      setSavingCustomer(false)
    }
  }, [selected, customerForm, fetchDetail, fetchCustomers, search])

  // Add vehicle
  const handleAddVehicle = useCallback(async () => {
    if (!selected) return
    setAddingVehicle(true)
    setVehicleError(null)
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: selected.id, ...vehicleForm }),
      })
      if (res.ok) {
        setShowAddVehicle(false)
        setVehicleForm({ year: "", make: "", model: "", trim: "", vin: "", license_plate: "" })
        setVehicleError(null)
        fetchDetail(selected.id)
      } else {
        const data = await res.json()
        setVehicleError(data.error || "Failed to add vehicle")
      }
    } catch {
      setVehicleError("Network error")
    } finally {
      setAddingVehicle(false)
    }
  }, [selected, vehicleForm, fetchDetail])

  // Save vehicle edit
  const handleSaveVehicle = useCallback(async () => {
    if (!editingVehicleId) return
    setSavingVehicle(true)
    setVehicleError(null)
    try {
      const res = await fetch(`/api/admin/vehicles/${editingVehicleId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editVehicleForm),
      })
      if (res.ok) {
        setEditingVehicleId(null)
        setVehicleError(null)
        if (selected) fetchDetail(selected.id)
      } else {
        const data = await res.json()
        setVehicleError(data.error || "Failed to save vehicle")
      }
    } catch {
      setVehicleError("Network error")
    } finally {
      setSavingVehicle(false)
    }
  }, [editingVehicleId, editVehicleForm, selected, fetchDetail])

  const handleDeleteVehicle = useCallback(
    async (id: string) => {
      if (!confirm("Delete this vehicle?")) return
      try {
        const res = await fetch(`/api/admin/vehicles/${id}`, { method: "DELETE", credentials: "same-origin" })
        if (res.ok && selected) fetchDetail(selected.id)
      } catch {
        // noop
      }
    },
    [selected, fetchDetail],
  )

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
  const labelClass = "text-xs text-muted-foreground"

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="font-sans text-lg font-medium text-foreground">Customers</h1>
        <button
          onClick={() => {
            setShowCreate(true)
            setCreateError(null)
            setCreateForm({ first_name: "", last_name: "", email: "", phone: "" })
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Add Customer
        </button>
      </div>

      {/* Create customer modal */}
      {showCreate && (
        <div className="border-b border-border bg-card px-6 py-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">New Customer</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className={inputClass} />
            </div>
          </div>
          {createError && <p className="mt-2 text-sm text-destructive">{createError}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={handleCreateCustomer} disabled={creating} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
              {creating ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="border-b border-border px-6 py-3">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90">Search</button>
          {search && (
            <button type="button" onClick={handleClearSearch} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-card">Clear</button>
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
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">{search ? "No results." : "No customers yet."}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`border-b border-border/50 transition-colors hover:bg-card/50 ${selected?.id === customer.id ? "bg-card" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-foreground">
                      {customer.first_name} {customer.last_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-muted-foreground">
                      {customer.email || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-muted-foreground">
                      {customer.phone || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-muted-foreground">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCustomer(customer.id)
                        }}
                        className="text-sm text-destructive transition-colors hover:text-destructive/80"
                      >
                        Delete
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
          <aside className="w-[420px] shrink-0 overflow-auto border-l border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-sans text-sm font-medium text-foreground">Customer Details</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 p-5">
                {/* Customer info */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-accent">Customer</h3>
                    {!editingCustomer && (
                      <button
                        onClick={() => {
                          setEditingCustomer(true)
                          setCustomerError(null)
                          setCustomerForm({
                            first_name: selected.first_name,
                            last_name: selected.last_name,
                            email: selected.email || "",
                            phone: selected.phone || "",
                          })
                        }}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {editingCustomer ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>First Name</label>
                          <input value={customerForm.first_name} onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Last Name</label>
                          <input value={customerForm.last_name} onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <input value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className={inputClass} />
                      </div>
                      {customerError && <p className="text-sm text-destructive">{customerError}</p>}
                      <div className="flex gap-2">
                        <button onClick={handleSaveCustomer} disabled={savingCustomer} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50">
                          {savingCustomer ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setEditingCustomer(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <DetailRow label="Name" value={`${selected.first_name} ${selected.last_name}`} />
                      <DetailRow label="Email" value={selected.email} />
                      <DetailRow label="Phone" value={selected.phone} />
                      <DetailRow label="Since" value={formatDate(selected.created_at)} />
                    </div>
                  )}
                </section>

                {/* Vehicles */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-accent">
                      Vehicles ({selected.vehicles?.length || 0})
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddVehicle(true)
                        setVehicleForm({ year: "", make: "", model: "", trim: "", vin: "", license_plate: "" })
                      }}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Add
                    </button>
                  </div>

                  {showAddVehicle && (
                    <div className="mb-3 rounded-lg border border-border bg-background p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Year</label>
                          <input value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Make</label>
                          <input value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Model</label>
                          <input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Trim</label>
                          <input value={vehicleForm.trim} onChange={(e) => setVehicleForm({ ...vehicleForm, trim: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className={labelClass}>VIN</label>
                        <input value={vehicleForm.vin} onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })} className={inputClass} />
                      </div>
                      <div className="mt-2">
                        <label className={labelClass}>Plate</label>
                        <input value={vehicleForm.license_plate} onChange={(e) => setVehicleForm({ ...vehicleForm, license_plate: e.target.value })} className={inputClass} />
                      </div>
                      {vehicleError && !editingVehicleId && (
                        <p className="mt-2 text-xs text-destructive">{vehicleError}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button onClick={handleAddVehicle} disabled={addingVehicle} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50">
                          {addingVehicle ? "Adding..." : "Add Vehicle"}
                        </button>
                        <button onClick={() => { setShowAddVehicle(false); setVehicleError(null) }} className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground">Cancel</button>
                      </div>
                    </div>
                  )}

                  {selected.vehicles && selected.vehicles.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {selected.vehicles.map((v) => (
                        <div key={v.id} className="rounded-lg border border-border bg-background p-3">
                          {editingVehicleId === v.id ? (
                            <div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={labelClass}>Year</label>
                                  <input value={editVehicleForm.year} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, year: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                  <label className={labelClass}>Make</label>
                                  <input value={editVehicleForm.make} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, make: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                  <label className={labelClass}>Model</label>
                                  <input value={editVehicleForm.model} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, model: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                  <label className={labelClass}>Trim</label>
                                  <input value={editVehicleForm.trim} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, trim: e.target.value })} className={inputClass} />
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className={labelClass}>VIN</label>
                                <input value={editVehicleForm.vin} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, vin: e.target.value })} className={inputClass} />
                              </div>
                              <div className="mt-2">
                                <label className={labelClass}>Plate</label>
                                <input value={editVehicleForm.license_plate} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, license_plate: e.target.value })} className={inputClass} />
                              </div>
                              {vehicleError && editingVehicleId === v.id && (
                                <p className="mt-2 text-xs text-destructive">{vehicleError}</p>
                              )}
                              <div className="mt-3 flex gap-2">
                                <button onClick={handleSaveVehicle} disabled={savingVehicle} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50">
                                  {savingVehicle ? "Saving..." : "Save"}
                                </button>
                                <button onClick={() => { setEditingVehicleId(null); setVehicleError(null) }} className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ") || "No info"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {v.vin ? `VIN: ${v.vin}` : ""}{v.license_plate ? ` | Plate: ${v.license_plate}` : ""}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingVehicleId(v.id)
                                    setEditVehicleForm({
                                      year: v.year || "",
                                      make: v.make || "",
                                      model: v.model || "",
                                      trim: v.trim || "",
                                      vin: v.vin || "",
                                      license_plate: v.license_plate || "",
                                    })
                                  }}
                                  className="text-xs text-accent hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteVehicle(v.id)}
                                  className="text-xs text-destructive hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No vehicles.</p>
                  )}
                </section>

                {/* Check-in history */}
                <section>
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-accent">
                    Check-In History ({selected.check_ins?.length || 0})
                  </h3>
                  {selected.check_ins && selected.check_ins.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {selected.check_ins.map((ci) => (
                        <div key={ci.id} className="rounded-lg border border-border bg-background p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-foreground">
                                {ci.vehicles
                                  ? [ci.vehicles.year, ci.vehicles.make, ci.vehicles.model]
                                      .filter(Boolean)
                                      .join(" ") || "Vehicle"
                                  : "Vehicle"}
                              </p>
                              {ci.mileage && (
                                <p className="text-xs text-muted-foreground">
                                  Mileage: {ci.mileage}
                                </p>
                              )}
                              {ci.notes && (
                                <p className="mt-1 text-xs text-muted-foreground">{ci.notes}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatDate(ci.created_at)}
                            </span>
                          </div>
                          {ci.check_in_photos && ci.check_in_photos.length > 0 && (
                            <div className="mt-2 flex gap-1.5">
                              {ci.check_in_photos.slice(0, 4).map((photo) => (
                                <a
                                  key={photo.id}
                                  href={photo.blob_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative h-12 w-12 overflow-hidden rounded border border-border"
                                >
                                  <ExpirableImage
                                    src={photo.blob_url}
                                    alt={photo.file_name || "Photo"}
                                    fill
                                    className="object-cover"
                                  />
                                </a>
                              ))}
                              {ci.check_in_photos.length > 4 && (
                                <span className="flex h-12 w-12 items-center justify-center rounded border border-border text-xs text-muted-foreground">
                                  +{ci.check_in_photos.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No check-ins.</p>
                  )}
                </section>

                <button
                  onClick={() => handleDeleteCustomer(selected.id)}
                  className="mt-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete Customer
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">{value || "-"}</span>
    </div>
  )
}
