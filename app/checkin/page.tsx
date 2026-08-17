"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"

const PIN = "123789"
const MAX_PHOTOS = 12

type Customer = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
}

type Vehicle = {
  id: string
  customer_id: string
  vin: string | null
  year: string | null
  make: string | null
  model: string | null
  trim: string | null
  license_plate: string | null
  mileage: string | null
}

type PhotoFile = {
  id: string
  file: File
  preview: string
  status: "queued" | "converting" | "compressing" | "uploading" | "done" | "error"
  result?: { url: string; filename: string; size: number; type: string }
  error?: string
}

type FormData = {
  first_name: string
  last_name: string
  email: string
  phone: string
  vin: string
  mileage: string
  year: string
  make: string
  model: string
  trim: string
  license_plate: string
  notes: string
}

const emptyForm: FormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  vin: "",
  mileage: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  license_plate: "",
  notes: "",
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })
  const result = Array.isArray(blob) ? blob[0] : blob
  return new File([result], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" })
}

async function compressImage(file: File): Promise<File> {
  const imageCompression = (await import("browser-image-compression")).default
  return await imageCompression(file, {
    maxWidthOrHeight: 2000,
    maxSizeMB: 2,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.75,
  })
}

async function uploadFile(file: File): Promise<{ url: string; filename: string; size: number; type: string }> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: fd })
  if (!res.ok) throw new Error("Upload failed")
  return res.json()
}

export default function CheckinPage() {
  const [pinInput, setPinInput] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerLocked, setCustomerLocked] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [searchingCustomers, setSearchingCustomers] = useState(false)

  // Vehicle selection state
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicleMode, setVehicleMode] = useState<"select" | "new">("new") // "select" when customer has vehicles
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [timeSensitivity, setTimeSensitivity] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Validation
  const isVehicleFormVisible = !selectedVehicle || vehicleMode === "new"
  const isMileageOnlyVisible = selectedVehicle && vehicleMode === "select"
  const donePhotos = photos.filter((p) => p.status === "done")

  const validationErrors: Record<string, string> = {}
  if (!customerLocked) {
    if (!form.first_name.trim()) validationErrors.first_name = "First name is required"
    if (!form.last_name.trim()) validationErrors.last_name = "Last name is required"
  }
  if (!customerLocked && !form.email.trim()) validationErrors.email = "Email is required"
  else if (!customerLocked && form.email.trim() && !/\S+@\S+\.\S+/.test(form.email.trim())) validationErrors.email = "Enter a valid email"
  if (!customerLocked && !form.phone.trim()) validationErrors.phone = "Phone is required"
  if (isVehicleFormVisible) {
    if (!form.make.trim()) validationErrors.make = "Make is required"
    if (!form.model.trim()) validationErrors.model = "Model is required"
    if (!form.license_plate.trim()) validationErrors.license_plate = "License plate is required"
    if (!form.mileage.trim()) validationErrors.mileage = "Mileage is required"
  }
  if (isMileageOnlyVisible && !form.mileage.trim()) validationErrors.mileage = "Mileage is required"
  if (!timeSensitivity) validationErrors.time_sensitivity = "Time sensitivity is required"
  if (!form.notes.trim()) validationErrors.notes = "Notes are required"
  if (donePhotos.length === 0) validationErrors.photos = "At least 1 photo is required"

  const isFormValid = Object.keys(validationErrors).length === 0
  const showError = (field: string) => (touched[field] || submitAttempted) && validationErrors[field]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handlePinSubmit = useCallback(() => {
    if (pinInput === PIN) {
      setAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }, [pinInput])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }, [])

  // Fetch vehicles for a customer
  const fetchVehicles = useCallback(async (customerId: string) => {
    setLoadingVehicles(true)
    try {
      const res = await fetch(`/api/vehicles?customer_id=${customerId}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setCustomerVehicles(data)
        setVehicleMode("select")
      } else {
        setCustomerVehicles([])
        setVehicleMode("new")
      }
    } catch {
      setCustomerVehicles([])
      setVehicleMode("new")
    } finally {
      setLoadingVehicles(false)
    }
  }, [])

  const handleCustomerSearch = useCallback((value: string) => {
    setCustomerSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (value.length < 2) {
      setCustomerResults([])
      setShowCustomerDropdown(false)
      return
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingCustomers(true)
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(value)}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setCustomerResults(data)
          setShowCustomerDropdown(true)
        }
      } catch {
        // noop
      } finally {
        setSearchingCustomers(false)
      }
    }, 300)
  }, [])

  const selectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerLocked(true)
    setForm((prev) => ({
      ...prev,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email || "",
      phone: customer.phone || "",
    }))
    setShowCustomerDropdown(false)
    setCustomerSearch("")
    // Fetch vehicles for this customer
    fetchVehicles(customer.id)
  }, [fetchVehicles])

  const unlockCustomer = useCallback(() => {
    setSelectedCustomer(null)
    setCustomerLocked(false)
    setSelectedVehicle(null)
    setCustomerVehicles([])
    setVehicleMode("new")
    setForm((prev) => ({
      ...prev,
      vin: "",
      year: "",
      make: "",
      model: "",
      trim: "",
      license_plate: "",
      mileage: "",
    }))
  }, [])

  const selectVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setForm((prev) => ({
      ...prev,
      vin: vehicle.vin || "",
      year: vehicle.year || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      trim: vehicle.trim || "",
      license_plate: vehicle.license_plate || "",
      mileage: vehicle.mileage || "",
    }))
  }, [])

  const deselectVehicle = useCallback(() => {
    setSelectedVehicle(null)
    setForm((prev) => ({
      ...prev,
      vin: "",
      year: "",
      make: "",
      model: "",
      trim: "",
      license_plate: "",
      mileage: "",
    }))
  }, [])

  // Photo handling
  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const remaining = MAX_PHOTOS - photos.length
    const selected = Array.from(files).slice(0, remaining)
    const newPhotos: PhotoFile[] = selected.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "queued" as const,
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
    for (const photo of newPhotos) {
      try {
        let processedFile = photo.file
        if (
          photo.file.type === "image/heic" ||
          photo.file.type === "image/heif" ||
          photo.file.name.toLowerCase().endsWith(".heic") ||
          photo.file.name.toLowerCase().endsWith(".heif")
        ) {
          setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "converting" } : p)))
          processedFile = await convertHeicToJpeg(photo.file)
        }
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "compressing" } : p)))
        processedFile = await compressImage(processedFile)
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "uploading" } : p)))
        const result = await uploadFile(processedFile)
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "done", result } : p)))
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed"
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, status: "error", error: msg } : p)))
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [photos.length])

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id)
      if (photo) URL.revokeObjectURL(photo.preview)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitAttempted(true)

      if (!isFormValid) {
        return
      }

      setSubmitting(true)
      setError(null)
      setEmailWarning(null)

      const pendingPhotos = photos.filter((p) => p.status !== "done" && p.status !== "error")
      if (pendingPhotos.length > 0) {
        setError("Please wait for all photos to finish uploading.")
        setSubmitting(false)
        return
      }

      const uploadedPhotos = photos
        .filter((p) => p.status === "done" && p.result)
        .map((p) => ({
          blob_url: p.result!.url,
          file_name: p.result!.filename,
          content_type: p.result!.type,
          size_bytes: p.result!.size,
        }))

      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: selectedCustomer?.id || null,
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email || null,
            phone: form.phone || null,
            vehicle_id: selectedVehicle?.id || null,
            vin: form.vin.trim() || null,
            year: form.year,
            make: form.make,
            model: form.model,
            trim: form.trim,
            license_plate: form.license_plate,
            mileage: form.mileage,
            notes: form.notes,
            time_sensitivity: timeSensitivity,
            photos: uploadedPhotos,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Something went wrong")
          setSubmitting(false)
          return
        }
        if (data.emailWarning) setEmailWarning(data.emailWarning)
        setSuccess(true)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        setError(message)
      } finally {
        setSubmitting(false)
      }
    },
    [form, photos, selectedCustomer, selectedVehicle, isFormValid, timeSensitivity],
  )

  const handleReset = useCallback(() => {
    setForm(emptyForm)
    setSelectedCustomer(null)
    setCustomerLocked(false)
    setSelectedVehicle(null)
    setCustomerVehicles([])
    setVehicleMode("new")
    setPhotos([])
    setTimeSensitivity("")
    setSuccess(false)
    setError(null)
    setEmailWarning(null)
    setTouched({})
    setSubmitAttempted(false)
  }, [])

  const inputClass =
    "rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
  const inputErrorClass =
    "rounded-lg border border-destructive bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
  const labelClass = "text-xs font-medium text-muted-foreground"
  const reqStar = <span className="text-destructive"> *</span>
  const fieldError = (field: string) => showError(field) ? <p className="text-xs text-destructive">{validationErrors[field]}</p> : null
  const ic = (field: string) => showError(field) ? inputErrorClass : inputClass

  // PIN Gate
  if (!authenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/hub-20tire-20shop-20logo-20rectangle-20rounded.png"
              alt="Hub Tire Shop"
              width={180}
              height={56}
              className="h-14 w-auto"
            />
          </div>
          <h1 className="mb-2 text-center font-sans text-2xl font-medium text-foreground">
            Vehicle Check-In
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Enter the access PIN to continue
          </p>
          <div className="flex flex-col gap-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value)
                setPinError(false)
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              placeholder="Enter PIN"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-center font-mono text-lg tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            {pinError && (
              <p className="text-center text-sm text-destructive">Incorrect PIN. Please try again.</p>
            )}
            <button
              onClick={handlePinSubmit}
              className="rounded-lg bg-accent px-4 py-3 font-sans text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Continue
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Success
  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 font-sans text-2xl font-medium text-foreground">Check-In Complete</h1>
          <p className="mb-4 text-sm text-muted-foreground">Your vehicle has been checked in successfully.</p>
          {emailWarning && (
            <p className="mb-4 rounded-lg bg-yellow-500/10 px-4 py-2 text-sm text-yellow-600">{emailWarning}</p>
          )}
          <button
            onClick={handleReset}
            className="rounded-lg bg-accent px-6 py-3 font-sans text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            New Check-In
          </button>
        </div>
      </main>
    )
  }

  // Check-in form
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/hub-20tire-20shop-20logo-20rectangle-20rounded.png"
            alt="Hub Tire Shop"
            width={180}
            height={56}
            className="h-14 w-auto"
          />
        </div>
        <h1 className="mb-1 text-center font-sans text-2xl font-medium text-foreground">Vehicle Check-In</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">Fill out the information below to check in your vehicle.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Customer Info */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
              Customer Information
            </legend>

            {!customerLocked && (
              <div className="relative" ref={dropdownRef}>
                <label className={labelClass}>Search existing customer</label>
                <input
                  type="text"
                  placeholder="Type name, email, or phone to search..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                  className={`mt-1.5 w-full ${inputClass}`}
                />
                {searchingCustomers && (
                  <div className="absolute right-3 top-9 text-xs text-muted-foreground">Searching...</div>
                )}
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-card shadow-lg">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent/10"
                      >
                        <span className="font-medium">{c.first_name} {c.last_name}</span>
                        <span className="text-xs text-muted-foreground">{c.email || c.phone || ""}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showCustomerDropdown && customerResults.length === 0 && customerSearch.length >= 2 && !searchingCustomers && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
                    No existing customers found. Fill in the details below.
                  </div>
                )}
              </div>
            )}

            {customerLocked && selectedCustomer && (
              <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[selectedCustomer.email, selectedCustomer.phone].filter(Boolean).join(" | ")}
                  </p>
                </div>
                <button type="button" onClick={unlockCustomer} className="text-xs text-accent hover:underline">Change</button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="first_name" className={labelClass}>First Name{reqStar}</label>
                <input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} onBlur={handleBlur} disabled={customerLocked} className={`${ic("first_name")} disabled:opacity-60`} />
                {fieldError("first_name")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="last_name" className={labelClass}>Last Name{reqStar}</label>
                <input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} onBlur={handleBlur} disabled={customerLocked} className={`${ic("last_name")} disabled:opacity-60`} />
                {fieldError("last_name")}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={labelClass}>Email{reqStar}</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} disabled={customerLocked} className={`${ic("email")} disabled:opacity-60`} />
                {fieldError("email")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className={labelClass}>Phone{reqStar}</label>
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} onBlur={handleBlur} disabled={customerLocked} className={`${ic("phone")} disabled:opacity-60`} />
                {fieldError("phone")}
              </div>
            </div>
          </fieldset>

          {/* Time Sensitivity */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
              Time Sensitivity
            </legend>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="time_sensitivity" className={labelClass}>How urgent is this service?{reqStar}</label>
              <select
                id="time_sensitivity"
                name="time_sensitivity"
                value={timeSensitivity}
                onChange={(e) => setTimeSensitivity(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, time_sensitivity: true }))}
                className={showError("time_sensitivity") ? inputErrorClass : inputClass}
              >
                <option value="">Select...</option>
                <option value="Today / ASAP">Today / ASAP</option>
                <option value="No Rush">No Rush</option>
              </select>
              {fieldError("time_sensitivity")}
            </div>
          </fieldset>

          {/* Vehicle Selection (only shown when existing customer has vehicles) */}
          {customerLocked && customerVehicles.length > 0 && (
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
                Select Vehicle
              </legend>

              {loadingVehicles ? (
                <p className="text-sm text-muted-foreground">Loading vehicles...</p>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    {customerVehicles.map((v) => {
                      const isSelected = selectedVehicle?.id === v.id
                      const label = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ") || "Unknown Vehicle"
                      const sub = [v.vin && `VIN: ${v.vin}`, v.license_plate && `Plate: ${v.license_plate}`, v.mileage && `${v.mileage} mi`].filter(Boolean).join(" | ")
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => isSelected ? deselectVehicle() : selectVehicle(v)}
                          className={`flex flex-col rounded-lg border px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "border-accent bg-accent/10"
                              : "border-border bg-card hover:border-accent/40"
                          }`}
                        >
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          {sub && <span className="mt-0.5 text-xs text-muted-foreground">{sub}</span>}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      deselectVehicle()
                      setVehicleMode(vehicleMode === "new" ? "select" : "new")
                    }}
                    className="text-left text-xs text-accent hover:underline"
                  >
                    {vehicleMode === "new" ? "Cancel - select existing vehicle" : "+ Add a new vehicle instead"}
                  </button>
                </>
              )}
            </fieldset>
          )}

          {/* Vehicle Details Form (shown when no vehicle selected or adding new) */}
          {(!selectedVehicle || vehicleMode === "new") && (
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
                {customerVehicles.length > 0 && vehicleMode === "new" ? "New Vehicle Details" : "Vehicle Information"}
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="year" className={labelClass}>Year</label>
                  <input id="year" name="year" value={form.year} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="make" className={labelClass}>Make{reqStar}</label>
                  <input id="make" name="make" value={form.make} onChange={handleChange} onBlur={handleBlur} className={ic("make")} />
                  {fieldError("make")}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="model" className={labelClass}>Model{reqStar}</label>
                  <input id="model" name="model" value={form.model} onChange={handleChange} onBlur={handleBlur} className={ic("model")} />
                  {fieldError("model")}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="trim" className={labelClass}>Trim</label>
                  <input id="trim" name="trim" value={form.trim} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="vin" className={labelClass}>VIN</label>
                  <input id="vin" name="vin" value={form.vin} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="license_plate" className={labelClass}>License Plate{reqStar}</label>
                  <input id="license_plate" name="license_plate" value={form.license_plate} onChange={handleChange} onBlur={handleBlur} className={ic("license_plate")} />
                  {fieldError("license_plate")}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mileage" className={labelClass}>Mileage{reqStar}</label>
                <input id="mileage" name="mileage" value={form.mileage} onChange={handleChange} onBlur={handleBlur} className={ic("mileage")} />
                {fieldError("mileage")}
              </div>
            </fieldset>
          )}

          {/* Mileage update for existing vehicle */}
          {selectedVehicle && vehicleMode === "select" && (
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
                Update Mileage
              </legend>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mileage" className={labelClass}>Current Mileage{reqStar}</label>
                <input id="mileage" name="mileage" value={form.mileage} onChange={handleChange} onBlur={handleBlur} placeholder={selectedVehicle.mileage || ""} className={ic("mileage")} />
                {fieldError("mileage")}
              </div>
            </fieldset>
          )}

          {/* Notes */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
              Notes
            </legend>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className={labelClass}>Notes / Issue Description{reqStar}</label>
              <textarea id="notes" name="notes" rows={3} value={form.notes} onChange={handleChange} onBlur={handleBlur} className={`${showError("notes") ? inputErrorClass : inputClass} resize-y`} />
              {fieldError("notes")}
            </div>
          </fieldset>

          {/* Photos */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
              Photos (at least 1 required, up to {MAX_PHOTOS})
            </legend>
            {showError("photos") && <p className="text-xs text-destructive">{validationErrors.photos}</p>}
            {photos.length < MAX_PHOTOS && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  Tap to add photos
                </label>
              </div>
            )}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative overflow-hidden rounded-lg border border-border">
                    <img src={photo.preview} alt="Preview" className="aspect-square w-full object-cover" />
                    {photo.status !== "done" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                        {photo.status === "error" ? (
                          <span className="text-xs text-destructive">Failed</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {photo.status === "converting" && "Converting..."}
                            {photo.status === "compressing" && "Compressing..."}
                            {photo.status === "uploading" && "Uploading..."}
                            {photo.status === "queued" && "Queued"}
                          </span>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Remove photo"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting || (submitAttempted && !isFormValid)}
            className="rounded-lg bg-accent px-4 py-3 font-sans text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Check-In"}
          </button>
        </form>
      </div>
    </main>
  )
}
