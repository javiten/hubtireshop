"use client"

import { useEffect, useState } from "react"
import { services } from "@/lib/site-config"

// Options reused across every Hub Tire Shop form.
export const serviceTypeOptions: string[] = [
  ...services.map((s) => s.name),
  "Scheduled Maintenance",
  "Fleet Service",
  "Other / Not sure",
]

export const vehicleMakeOptions: string[] = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ford", "GMC",
  "Honda", "Hyundai", "Infiniti", "Jeep", "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Nissan",
  "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo", "Other",
]

export const contactMethodOptions: string[] = ["Phone call", "Text message", "Email"]

// Tire quote options.
export const tireQuantityOptions: string[] = ["1", "2", "3", "4", "5", "6+"]

export const tireBrandOptions: string[] = [
  "No preference / best value",
  "Michelin",
  "Bridgestone",
  "Goodyear",
  "Continental",
  "Pirelli",
  "Firestone",
  "BFGoodrich",
  "Cooper",
  "Falken",
  "Hankook",
  "Toyo",
  "Yokohama",
  "Other",
]

export const tireBudgetOptions: string[] = [
  "Best value / economy",
  "Mid-range",
  "Premium / performance",
  "Not sure — need a recommendation",
]

// Fleet consultation options.
export const fleetSizeOptions: string[] = ["1–3 vehicles", "4–10 vehicles", "11–25 vehicles", "26+ vehicles"]

export const fleetVehicleTypeOptions: string[] = [
  "Cars / sedans",
  "SUVs",
  "Pickup trucks",
  "Cargo / passenger vans",
  "Box trucks",
  "Heavy-duty / diesel trucks",
]

export const fleetFuelOptions: string[] = ["Gasoline", "Diesel", "Mixed (gas & diesel)"]

export const fleetServiceOptions: string[] = [
  "Preventive maintenance",
  "Tires",
  "Brakes",
  "Diagnostics",
  "Diesel service",
  "Oil changes",
  "A/C service",
  "Suspension",
]

// Build a list of selectable model years (current year + 1 down to 1990).
export function getVehicleYears(): string[] {
  const current = new Date().getFullYear() + 1
  const years: string[] = []
  for (let y = current; y >= 1990; y--) years.push(String(y))
  return years
}

// Marketing metadata captured from the URL / browser for lead attribution.
export type LeadMeta = {
  sourcePage: string
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
}

const EMPTY_META: LeadMeta = {
  sourcePage: "",
  referrer: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
}

const UTM_STORAGE_KEY = "hts_utm"

// Capture source page + UTM parameters. UTMs are persisted in sessionStorage so
// they survive internal navigation from the original ad-clicked landing page.
export function useLeadMeta(): LeadMeta {
  const [meta, setMeta] = useState<LeadMeta>(EMPTY_META)

  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const fromUrl = {
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmTerm: params.get("utm_term") || "",
      utmContent: params.get("utm_content") || "",
    }

    const hasUrlUtms = Object.values(fromUrl).some(Boolean)

    let stored: Partial<LeadMeta> = {}
    try {
      if (hasUrlUtms) {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl))
      } else {
        stored = JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) || "{}")
      }
    } catch {
      // sessionStorage unavailable — ignore
    }

    setMeta({
      sourcePage: window.location.pathname + window.location.search,
      referrer: document.referrer || "",
      utmSource: fromUrl.utmSource || stored.utmSource || "",
      utmMedium: fromUrl.utmMedium || stored.utmMedium || "",
      utmCampaign: fromUrl.utmCampaign || stored.utmCampaign || "",
      utmTerm: fromUrl.utmTerm || stored.utmTerm || "",
      utmContent: fromUrl.utmContent || stored.utmContent || "",
    })
  }, [])

  return meta
}

// ---- Validation ---------------------------------------------------------

export type LeadFields = {
  name: string
  email: string
  phone: string
  vehicleYear?: string
  vehicleMake?: string
  vehicleModel?: string
  mileage?: string
  serviceType?: string
  concern?: string
  preferredDate?: string
  preferredContact?: string
}

export type LeadErrors = Partial<Record<keyof LeadFields, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLead(fields: LeadFields): LeadErrors {
  const errors: LeadErrors = {}

  if (!fields.name || fields.name.trim().length < 2) {
    errors.name = "Please enter your full name."
  }

  if (!fields.email || !EMAIL_RE.test(fields.email.trim())) {
    errors.email = "Please enter a valid email address."
  }

  const digits = (fields.phone || "").replace(/\D/g, "")
  if (!fields.phone || digits.length < 10) {
    errors.phone = "Please enter a valid phone number."
  }

  if (fields.mileage && !/^\d{1,7}$/.test(fields.mileage.replace(/[,\s]/g, ""))) {
    errors.mileage = "Enter mileage as a number."
  }

  if (fields.preferredDate) {
    const picked = new Date(fields.preferredDate + "T00:00:00")
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (Number.isNaN(picked.getTime())) {
      errors.preferredDate = "Choose a valid date."
    } else if (picked < today) {
      errors.preferredDate = "Choose a date that isn't in the past."
    }
  }

  return errors
}

// Today's date as YYYY-MM-DD for the date input's min attribute.
export function todayISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}
