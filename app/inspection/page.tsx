"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"

const PIN = "123789"
const MAX_PHOTOS = 50

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

type TireDepthData = {
  fl?: string
  fr?: string
  rl?: string
  rr?: string
}

type InspectionItem = {
  item_number: number
  category: string
  item_label: string
  status: "PASS" | "FAIL" | null
  fail_notes: string
  tire_depths?: TireDepthData // Only used for Tire Tread Depth item
}

const INSPECTION_ITEMS: Omit<InspectionItem, "status" | "fail_notes" | "tire_depths">[] = [
  // Engine Compartment
  { item_number: 1, category: "Engine Compartment", item_label: "Engine oil level / condition" },
  { item_number: 2, category: "Engine Compartment", item_label: "Coolant Level / Visible Leaks / Acidity" },
  { item_number: 3, category: "Engine Compartment", item_label: "Battery Condition / Terminals / Life" },
  { item_number: 4, category: "Engine Compartment", item_label: "Belt Condition" },
  { item_number: 5, category: "Engine Compartment", item_label: "Hoses Condition" },
  { item_number: 6, category: "Engine Compartment", item_label: "Transmission Fluid" },
  { item_number: 7, category: "Engine Compartment", item_label: "Fluid leaks" },
  // Exterior / Lights
  { item_number: 8, category: "Exterior / Lights", item_label: "Headlights" },
  { item_number: 9, category: "Exterior / Lights", item_label: "Brake lights" },
  { item_number: 10, category: "Exterior / Lights", item_label: "Turn signals / hazard lights" },
  { item_number: 11, category: "Exterior / Lights", item_label: "Windshield / glass condition" },
  { item_number: 12, category: "Exterior / Lights", item_label: "Wipers / washer operation" },
  // Brakes / Suspension
  { item_number: 13, category: "Brakes / Suspension", item_label: "Brake Fluid State" },
  { item_number: 14, category: "Brakes / Suspension", item_label: "Brake Pads / Shoes Condition / Drums Condition" },
  { item_number: 15, category: "Brakes / Suspension", item_label: "Rotors Condition" },
  { item_number: 16, category: "Brakes / Suspension", item_label: "Parking brake operation" },
  { item_number: 17, category: "Brakes / Suspension", item_label: "Steering components" },
  { item_number: 18, category: "Brakes / Suspension", item_label: "Suspension components" },
  // Tires
  { item_number: 19, category: "Tires", item_label: "Tire tread depth" },
  { item_number: 20, category: "Tires", item_label: "Tire sidewall condition" },
  { item_number: 21, category: "Tires", item_label: "Tire pressure" },
  { item_number: 22, category: "Tires", item_label: "Spare tire / repair kit" },
  { item_number: 23, category: "Tires", item_label: "Wheel nuts / visible wheel damage" },
]

// The tire tread depth item number for special handling
const TIRE_TREAD_ITEM_NUMBER = 19

async function convertHeicToJpeg(file: File): Promise<File> {
  // Add timeout to prevent getting stuck
  const timeoutMs = 30000
  const heic2anyPromise = (async () => {
    const heic2any = (await import("heic2any")).default
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })
    const result = Array.isArray(blob) ? blob[0] : blob
    return new File([result], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" })
  })()
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("HEIC conversion timed out. Please try a JPG or PNG image.")), timeoutMs)
  )
  return Promise.race([heic2anyPromise, timeoutPromise])
}

async function compressImage(file: File): Promise<File> {
  try {
    const imageCompression = (await import("browser-image-compression")).default
    return await imageCompression(file, {
      maxWidthOrHeight: 2000,
      maxSizeMB: 2,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.75,
    })
  } catch (err) {
    // If compression fails, return original file if it's small enough
    if (file.size <= 2 * 1024 * 1024) return file
    throw new Error("Image compression failed. Please try a smaller image.")
  }
}

async function uploadFile(file: File): Promise<{ url: string; filename: string; size: number; type: string }> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: fd })
  if (!res.ok) {
    const errText = await res.text().catch(() => "Upload failed")
    throw new Error(errText || "Upload failed")
  }
  const data = await res.json()
  if (!data.url) throw new Error("Upload returned no URL")
  return data
}

export default function InspectionPage() {
  const [pinInput, setPinInput] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [pinError, setPinError] = useState(false)

  // Vehicle search
  const [vehicleSearch, setVehicleSearch] = useState("")
  const [vehicleResults, setVehicleResults] = useState<(Vehicle & { customer?: Customer })[]>([])
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [searchingVehicles, setSearchingVehicles] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<(Vehicle & { customer?: Customer }) | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Add new vehicle modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newVehicleForm, setNewVehicleForm] = useState({
    vin: "", license_plate: "", year: "", make: "", model: "", trim: "", mileage: "", notes: "",
  })
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  const customerDropdownRef = useRef<HTMLDivElement>(null)
  const customerSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inspection form
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().split("T")[0])
  const [customerName, setCustomerName] = useState("")
  const [vehiclePlate, setVehiclePlate] = useState("")
  const [mileage, setMileage] = useState("")
  const [items, setItems] = useState<InspectionItem[]>(() =>
    INSPECTION_ITEMS.map((i) => ({ ...i, status: null, fail_notes: "", tire_depths: {} }))
  )
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowVehicleDropdown(false)
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
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

  // Vehicle search
  const handleVehicleSearch = useCallback((value: string) => {
    setVehicleSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (value.length < 2) {
      setVehicleResults([])
      setShowVehicleDropdown(false)
      return
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingVehicles(true)
      try {
        const res = await fetch(`/api/vehicles/search?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setVehicleResults(data)
          setShowVehicleDropdown(true)
        }
      } catch {
        // noop
      } finally {
        setSearchingVehicles(false)
      }
    }, 300)
  }, [])

  const selectVehicle = useCallback((vehicle: Vehicle & { customer?: Customer }) => {
    setSelectedVehicle(vehicle)
    setShowVehicleDropdown(false)
    setVehicleSearch("")
    // Auto-fill header fields
    if (vehicle.customer) {
      setCustomerName(`${vehicle.customer.first_name} ${vehicle.customer.last_name}`)
    }
    setVehiclePlate(vehicle.license_plate || "")
    setMileage(vehicle.mileage || "")
  }, [])

  const clearVehicle = useCallback(() => {
    setSelectedVehicle(null)
    setCustomerName("")
    setVehiclePlate("")
    setMileage("")
  }, [])

  // Customer search for add vehicle modal
  const handleCustomerSearch = useCallback((value: string) => {
    setCustomerSearch(value)
    if (customerSearchTimeoutRef.current) clearTimeout(customerSearchTimeoutRef.current)
    if (value.length < 2) {
      setCustomerResults([])
      setShowCustomerDropdown(false)
      return
    }
    customerSearchTimeoutRef.current = setTimeout(async () => {
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

  const handleSaveNewVehicle = useCallback(async () => {
    if (!selectedCustomer) {
      setVehicleError("Please select a customer")
      return
    }
    if (!newVehicleForm.make.trim() || !newVehicleForm.model.trim()) {
      setVehicleError("Make and model are required")
      return
    }
    setSavingVehicle(true)
    setVehicleError(null)
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          vin: newVehicleForm.vin.trim() || null,
          license_plate: newVehicleForm.license_plate.trim() || null,
          year: newVehicleForm.year.trim() || null,
          make: newVehicleForm.make.trim(),
          model: newVehicleForm.model.trim(),
          trim: newVehicleForm.trim.trim() || null,
          mileage: newVehicleForm.mileage.trim() || null,
          notes: newVehicleForm.notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVehicleError(data.error || "Failed to create vehicle")
        return
      }
      // Select the new vehicle
      const newVehicle: Vehicle & { customer?: Customer } = {
        ...data,
        customer: selectedCustomer,
      }
      selectVehicle(newVehicle)
      setShowAddModal(false)
      setNewVehicleForm({ vin: "", license_plate: "", year: "", make: "", model: "", trim: "", mileage: "", notes: "" })
      setSelectedCustomer(null)
      setCustomerSearch("")
    } catch {
      setVehicleError("Failed to create vehicle")
    } finally {
      setSavingVehicle(false)
    }
  }, [selectedCustomer, newVehicleForm, selectVehicle])

  // Checklist item change
  const setItemStatus = useCallback((itemNumber: number, status: "PASS" | "FAIL") => {
    setItems((prev) =>
      prev.map((item) =>
        item.item_number === itemNumber
          ? { ...item, status, fail_notes: status === "PASS" ? "" : item.fail_notes, tire_depths: status === "PASS" ? {} : item.tire_depths }
          : item
      )
    )
  }, [])

  const setItemFailNotes = useCallback((itemNumber: number, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.item_number === itemNumber ? { ...item, fail_notes: notes } : item))
    )
  }, [])

  const toggleTireWheel = useCallback((wheel: keyof TireDepthData) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.item_number !== TIRE_TREAD_ITEM_NUMBER) return item
        const newDepths = { ...item.tire_depths }
        if (newDepths[wheel] !== undefined) {
          delete newDepths[wheel]
        } else {
          newDepths[wheel] = ""
        }
        return { ...item, tire_depths: newDepths }
      })
    )
  }, [])

  const setTireDepth = useCallback((wheel: keyof TireDepthData, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.item_number !== TIRE_TREAD_ITEM_NUMBER) return item
        return { ...item, tire_depths: { ...item.tire_depths, [wheel]: value } }
      })
    )
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

  // Validation
  const allItemsAnswered = items.every((item) => item.status !== null)
  const failedItemsMissingNotes = items.some((item) => item.status === "FAIL" && !item.fail_notes.trim())
  const donePhotos = photos.filter((p) => p.status === "done" && p.result)
  const pendingPhotos = photos.filter((p) => p.status !== "done" && p.status !== "error")

  // Tire tread depth validation: when FAIL, at least one wheel must be selected with a depth value
  const tireTreadItem = items.find((i) => i.item_number === TIRE_TREAD_ITEM_NUMBER)
  const tireTreadInvalid = tireTreadItem?.status === "FAIL" && (() => {
    const depths = tireTreadItem.tire_depths || {}
    const selectedWheels = Object.keys(depths).filter((k) => depths[k as keyof TireDepthData] !== undefined)
    if (selectedWheels.length === 0) return true // No wheels selected
    return selectedWheels.some((k) => !depths[k as keyof TireDepthData]?.trim()) // Some selected wheel has no depth value
  })()

  const validationErrors: Record<string, string> = {}
  if (!selectedVehicle) validationErrors.vehicle = "Please select a vehicle"
  if (!inspectionDate) validationErrors.date = "Date is required"
  if (!customerName.trim()) validationErrors.customer_name = "Customer name is required"
  if (!vehiclePlate.trim()) validationErrors.vehicle_plate = "Vehicle plate is required"
  if (!selectedVehicle?.vin) validationErrors.vin = "VIN is required"
  if (!selectedVehicle?.year) validationErrors.year = "Year is required"
  if (!selectedVehicle?.make) validationErrors.make = "Make is required"
  if (!selectedVehicle?.model) validationErrors.model = "Model is required"
  if (!mileage.trim()) validationErrors.mileage = "Mileage is required"
  if (!allItemsAnswered) validationErrors.checklist = "All checklist items must be answered"
  if (failedItemsMissingNotes) validationErrors.fail_notes = "All failed items require notes"
  if (tireTreadInvalid) validationErrors.tire_tread = "Select at least one wheel and enter depth for tire tread"
  if (donePhotos.length === 0) validationErrors.photos = "At least 1 photo is required"
  if (!additionalNotes.trim()) validationErrors.notes = "Additional notes are required"

  const isFormValid = Object.keys(validationErrors).length === 0

  const handleSubmit = useCallback(async () => {
    setSubmitAttempted(true)

    if (pendingPhotos.length > 0) {
      setError("Please wait for all photos to finish uploading.")
      return
    }

    if (!isFormValid) {
      // Build a helpful error message
      const errorKeys = Object.keys(validationErrors)
      if (errorKeys.length === 1) {
        setError(validationErrors[errorKeys[0]])
      } else {
        setError("Please complete all required fields.")
      }
      return
    }

    setSubmitting(true)
    setError(null)

    const uploadedPhotos = donePhotos.map((p) => ({
      blob_url: p.result!.url,
      file_name: p.result!.filename,
      content_type: p.result!.type,
      size_bytes: p.result!.size,
    }))

    try {
      const res = await fetch("/api/inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: selectedVehicle?.id || null,
          customer_id: selectedVehicle?.customer_id || null,
          inspection_date: inspectionDate,
          customer_name: customerName,
          vehicle_plate: vehiclePlate,
          mileage,
          vehicle_year: selectedVehicle?.year || null,
          vehicle_make: selectedVehicle?.make || null,
          vehicle_model: selectedVehicle?.model || null,
          vehicle_trim: selectedVehicle?.trim || null,
          vehicle_vin: selectedVehicle?.vin || null,
          items,
          additional_notes: additionalNotes,
          photos: uploadedPhotos,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setSubmitting(false)
        return
      }
      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }, [selectedVehicle, inspectionDate, customerName, vehiclePlate, mileage, items, additionalNotes, donePhotos, pendingPhotos, isFormValid, validationErrors])

  const handleReset = useCallback(() => {
    setSelectedVehicle(null)
    setInspectionDate(new Date().toISOString().split("T")[0])
    setCustomerName("")
    setVehiclePlate("")
    setMileage("")
    setItems(INSPECTION_ITEMS.map((i) => ({ ...i, status: null, fail_notes: "", tire_depths: {} })))
    setAdditionalNotes("")
    setPhotos([])
    setSuccess(false)
    setError(null)
    setSubmitAttempted(false)
  }, [])

  const inputClass =
    "rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
  const inputErrorClass =
    "rounded-lg border border-destructive bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
  const labelClass = "text-xs font-medium text-muted-foreground"
  const reqStar = <span className="text-destructive"> *</span>
  const showError = (field: string) => submitAttempted && validationErrors[field]
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
            Vehicle Inspection
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
          <h1 className="mb-2 font-sans text-2xl font-medium text-foreground">Inspection Complete</h1>
          <p className="mb-4 text-sm text-muted-foreground">The inspection has been saved and emailed.</p>
          <button
            onClick={handleReset}
            className="rounded-lg bg-accent px-6 py-3 font-sans text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            New Inspection
          </button>
        </div>
      </main>
    )
  }

  // Group items by category
  const categories = Array.from(new Set(INSPECTION_ITEMS.map((i) => i.category)))

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
        <h1 className="mb-1 text-center font-sans text-2xl font-medium text-foreground">Vehicle Safety Inspection</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">Complete the checklist below for the selected vehicle.</p>

        <div className="flex flex-col gap-6">
          {/* Vehicle Selection */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
              Select Vehicle{reqStar}
            </legend>
            {showError("vehicle") && <p className="text-xs text-destructive">{validationErrors.vehicle}</p>}
            {showError("vin") && <p className="text-xs text-destructive">Selected vehicle is missing VIN</p>}
            {showError("year") && <p className="text-xs text-destructive">Selected vehicle is missing Year</p>}
            {showError("make") && <p className="text-xs text-destructive">Selected vehicle is missing Make</p>}
            {showError("model") && <p className="text-xs text-destructive">Selected vehicle is missing Model</p>}

            {!selectedVehicle ? (
              <>
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    placeholder="Search by plate, VIN, make, model..."
                    value={vehicleSearch}
                    onChange={(e) => handleVehicleSearch(e.target.value)}
                    onFocus={() => vehicleResults.length > 0 && setShowVehicleDropdown(true)}
                    className={`w-full ${inputClass}`}
                  />
                  {searchingVehicles && (
                    <div className="absolute right-3 top-3 text-xs text-muted-foreground">Searching...</div>
                  )}
                  {showVehicleDropdown && vehicleResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-card shadow-lg">
                      {vehicleResults.map((v) => {
                        const label = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ") || "Unknown"
                        const sub = [v.license_plate && `Plate: ${v.license_plate}`, v.vin && `VIN: ${v.vin}`].filter(Boolean).join(" | ")
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => selectVehicle(v)}
                            className="flex w-full flex-col px-4 py-2.5 text-left transition-colors hover:bg-accent/10"
                          >
                            <span className="text-sm font-medium text-foreground">{label}</span>
                            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
                            {v.customer && (
                              <span className="text-xs text-muted-foreground">
                                Owner: {v.customer.first_name} {v.customer.last_name}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {showVehicleDropdown && vehicleResults.length === 0 && vehicleSearch.length >= 2 && !searchingVehicles && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
                      No vehicles found.
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="self-start text-xs text-accent hover:underline"
                >
                  + Add New Vehicle
                </button>
              </>
            ) : (
              <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${submitAttempted && (!selectedVehicle.vin || !selectedVehicle.year || !selectedVehicle.make || !selectedVehicle.model) ? "border-destructive/50 bg-destructive/5" : "border-accent/30 bg-accent/5"}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model, selectedVehicle.trim].filter(Boolean).join(" ") || "Vehicle info incomplete"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[selectedVehicle.license_plate && `Plate: ${selectedVehicle.license_plate}`, selectedVehicle.vin && `VIN: ${selectedVehicle.vin}`].filter(Boolean).join(" | ") || "Missing plate/VIN"}
                  </p>
                  {selectedVehicle.customer && (
                    <p className="text-xs text-muted-foreground">
                      Owner: {selectedVehicle.customer.first_name} {selectedVehicle.customer.last_name}
                    </p>
                  )}
                </div>
                <button type="button" onClick={clearVehicle} className="text-xs text-accent hover:underline">Change</button>
              </div>
            )}
          </fieldset>

          {/* Inspection Header */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
              Inspection Details
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="date" className={labelClass}>Date{reqStar}</label>
                <input id="date" type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} className={ic("date")} />
                {showError("date") && <p className="text-xs text-destructive">{validationErrors.date}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="customer_name" className={labelClass}>Customer Name{reqStar}</label>
                <input id="customer_name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={ic("customer_name")} />
                {showError("customer_name") && <p className="text-xs text-destructive">{validationErrors.customer_name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="vehicle_plate" className={labelClass}>Vehicle Plate{reqStar}</label>
                <input id="vehicle_plate" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className={ic("vehicle_plate")} />
                {showError("vehicle_plate") && <p className="text-xs text-destructive">{validationErrors.vehicle_plate}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mileage" className={labelClass}>Mileage{reqStar}</label>
              <input id="mileage" value={mileage} onChange={(e) => setMileage(e.target.value)} className={ic("mileage")} placeholder="Current odometer reading" />
              {showError("mileage") && <p className="text-xs text-destructive">{validationErrors.mileage}</p>}
            </div>
          </fieldset>

          {/* Checklist */}
          {categories.map((category) => (
            <fieldset key={category} className="flex flex-col gap-3">
              <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
                {category}
              </legend>
              {items
                .filter((item) => item.category === category)
                .map((item) => (
                  <div key={item.item_number} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-foreground">{item.item_number}. {item.item_label}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setItemStatus(item.item_number, "PASS")}
                          className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                            item.status === "PASS"
                              ? "bg-emerald-600 text-white"
                              : "border border-border bg-card text-muted-foreground hover:bg-emerald-600/10 hover:text-emerald-600"
                          }`}
                        >
                          PASS
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemStatus(item.item_number, "FAIL")}
                          className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                            item.status === "FAIL"
                              ? "bg-destructive text-destructive-foreground"
                              : "border border-border bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          }`}
                        >
                          FAIL
                        </button>
                      </div>
                    </div>
                    {item.status === "FAIL" && (
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Describe the issue (required)"
                          value={item.fail_notes}
                          onChange={(e) => setItemFailNotes(item.item_number, e.target.value)}
                          className={`w-full ${inputClass} ${submitAttempted && !item.fail_notes.trim() ? "border-destructive" : ""}`}
                        />
                        {submitAttempted && !item.fail_notes.trim() && (
                          <p className="mt-1 text-xs text-destructive">Please describe the issue</p>
                        )}
                      </div>
                    )}

                    {/* Tire Tread Depth: Wheel selection when FAIL */}
                    {item.item_number === TIRE_TREAD_ITEM_NUMBER && item.status === "FAIL" && (
                      <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
                        <p className="mb-3 text-xs font-medium text-muted-foreground">Select affected wheels and enter tread depth (32nds of an inch):</p>
                        <div className="grid grid-cols-2 gap-3">
                          {(["fl", "fr", "rl", "rr"] as const).map((wheel) => {
                            const label = { fl: "FL", fr: "FR", rl: "RL", rr: "RR" }[wheel]
                            const fullLabel = { fl: "Front Left", fr: "Front Right", rl: "Rear Left", rr: "Rear Right" }[wheel]
                            const isSelected = item.tire_depths?.[wheel] !== undefined
                            return (
                              <div key={wheel} className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleTireWheel(wheel)}
                                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                                    isSelected
                                      ? "bg-accent text-accent-foreground"
                                      : "border border-border bg-card text-muted-foreground hover:border-accent hover:text-accent"
                                  }`}
                                >
                                  {label} <span className="hidden sm:inline">({fullLabel})</span>
                                </button>
                                {isSelected && (
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    min="0"
                                    placeholder="Depth"
                                    value={item.tire_depths?.[wheel] || ""}
                                    onChange={(e) => setTireDepth(wheel, e.target.value)}
                                    className={`w-full ${inputClass} text-center ${submitAttempted && !item.tire_depths?.[wheel]?.trim() ? "border-destructive" : ""}`}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {submitAttempted && tireTreadInvalid && (
                          <p className="mt-3 text-xs text-destructive">Select at least one wheel and enter depth value</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </fieldset>
          ))}

          {/* Validation warning */}
          {submitAttempted && !allItemsAnswered && (
            <p className="text-center text-sm text-destructive">Please answer all checklist items.</p>
          )}
          {submitAttempted && tireTreadInvalid && (
            <p className="text-center text-sm text-destructive">Tire tread depth: select affected wheels and enter depth values.</p>
          )}

          {/* Additional Notes */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
              Additional Notes{reqStar}
            </legend>
            <textarea
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any additional observations..."
              className={`${showError("notes") ? inputErrorClass : inputClass} resize-y`}
            />
            {showError("notes") && <p className="text-xs text-destructive">{validationErrors.notes}</p>}
          </fieldset>

          {/* Photos */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-sans text-sm font-medium uppercase tracking-wider text-accent">
              Photos (at least 1, up to {MAX_PHOTOS}){reqStar}
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-2">
                        {photo.status === "error" ? (
                          <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-xs font-medium text-destructive">Failed</span>
                            <span className="line-clamp-2 text-[10px] text-destructive/80">{photo.error || "Unknown error"}</span>
                          </div>
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
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-accent px-4 py-3 font-sans text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save / Print"}
          </button>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">Add New Vehicle</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-4 p-5">
              {/* Customer selection */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Customer <span className="text-destructive">*</span></label>
                {!selectedCustomer ? (
                  <div className="relative" ref={customerDropdownRef}>
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                      className={`w-full ${inputClass}`}
                    />
                    {searchingCustomers && (
                      <div className="absolute right-3 top-3 text-xs text-muted-foreground">Searching...</div>
                    )}
                    {showCustomerDropdown && customerResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-card shadow-lg">
                        {customerResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c)
                              setShowCustomerDropdown(false)
                              setCustomerSearch("")
                            }}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent/10"
                          >
                            <span className="font-medium">{c.first_name} {c.last_name}</span>
                            <span className="text-xs text-muted-foreground">{c.email || c.phone || ""}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
                    <span className="text-sm text-foreground">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                    <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs text-accent hover:underline">Change</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>VIN</label>
                  <input value={newVehicleForm.vin} onChange={(e) => setNewVehicleForm((f) => ({ ...f, vin: e.target.value }))} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>License Plate</label>
                  <input value={newVehicleForm.license_plate} onChange={(e) => setNewVehicleForm((f) => ({ ...f, license_plate: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Year</label>
                  <input value={newVehicleForm.year} onChange={(e) => setNewVehicleForm((f) => ({ ...f, year: e.target.value }))} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Make <span className="text-destructive">*</span></label>
                  <input value={newVehicleForm.make} onChange={(e) => setNewVehicleForm((f) => ({ ...f, make: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Model <span className="text-destructive">*</span></label>
                  <input value={newVehicleForm.model} onChange={(e) => setNewVehicleForm((f) => ({ ...f, model: e.target.value }))} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Trim</label>
                  <input value={newVehicleForm.trim} onChange={(e) => setNewVehicleForm((f) => ({ ...f, trim: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Mileage</label>
                <input value={newVehicleForm.mileage} onChange={(e) => setNewVehicleForm((f) => ({ ...f, mileage: e.target.value }))} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Notes</label>
                <textarea value={newVehicleForm.notes} onChange={(e) => setNewVehicleForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputClass} resize-y`} />
              </div>

              {vehicleError && <p className="text-center text-sm text-destructive">{vehicleError}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                  Cancel
                </button>
                <button type="button" onClick={handleSaveNewVehicle} disabled={savingVehicle} className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
                  {savingVehicle ? "Saving..." : "Save Vehicle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
