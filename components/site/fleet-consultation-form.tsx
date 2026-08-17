"use client"

import { useState } from "react"
import Link from "next/link"
import { siteConfig } from "@/lib/site-config"
import {
  contactMethodOptions,
  fleetSizeOptions,
  fleetVehicleTypeOptions,
  fleetFuelOptions,
  fleetServiceOptions,
  useLeadMeta,
  todayISO,
} from "@/lib/lead-form"

type Status = "idle" | "submitting" | "success" | "error"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FleetErrors = {
  businessName?: string
  contactName?: string
  email?: string
  phone?: string
}

export function FleetConsultationForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [errors, setErrors] = useState<FleetErrors>({})
  const [smsConsent, setSmsConsent] = useState(false)
  const meta = useLeadMeta()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const businessName = ((data.get("businessName") as string) || "").trim()
    const contactName = ((data.get("contactName") as string) || "").trim()
    const email = ((data.get("email") as string) || "").trim()
    const phone = ((data.get("phone") as string) || "").trim()
    const fleetSize = (data.get("fleetSize") as string) || ""
    const fuelType = (data.get("fuelType") as string) || ""
    const preferredDate = (data.get("preferredDate") as string) || ""
    const preferredContact = (data.get("preferredContact") as string) || ""
    const notes = (data.get("notes") as string) || ""
    const vehicleTypes = data.getAll("vehicleTypes") as string[]
    const servicesNeeded = data.getAll("servicesNeeded") as string[]

    // Validate the required contact fields.
    const nextErrors: FleetErrors = {}
    if (businessName.length < 2) nextErrors.businessName = "Please enter your business name."
    if (contactName.length < 2) nextErrors.contactName = "Please enter a contact name."
    if (!EMAIL_RE.test(email)) nextErrors.email = "Please enter a valid email address."
    if (phone.replace(/\D/g, "").length < 10) nextErrors.phone = "Please enter a valid phone number."

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus("error")
      setErrorMsg("Please fix the highlighted fields and try again.")
      return
    }

    setErrors({})
    setStatus("submitting")
    setErrorMsg("")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType: "fleet-inquiry",
          serviceType: "Fleet Service",
          // The shared API expects name/email/phone for validation.
          name: contactName,
          businessName,
          contactName,
          email,
          phone,
          fleetSize,
          vehicleTypes,
          fuelType,
          servicesNeeded,
          preferredDate,
          preferredContact,
          concern: notes,
          smsConsent,
          ...meta,
        }),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || "Something went wrong.")
      }
      setStatus("success")
      form.reset()
      setSmsConsent(false)
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.")
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground">Consultation request received</h3>
        <p className="mt-2 text-muted-foreground">
          Thanks! We received your fleet consultation request. This is a request only &mdash; nothing is{" "}
          <strong>confirmed yet</strong>. A team member will reach out to discuss a maintenance plan for your vehicles.
          For faster service, call{" "}
          <a href={siteConfig.phone.href} className="font-semibold text-primary">
            {siteConfig.phone.display}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-primary hover:underline"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" required error={errors.businessName} htmlFor="fcf-business">
          <input
            id="fcf-business"
            name="businessName"
            autoComplete="organization"
            className={inputClass(errors.businessName)}
            placeholder="Miami Delivery Co."
          />
        </Field>
        <Field label="Contact name" required error={errors.contactName} htmlFor="fcf-contact">
          <input
            id="fcf-contact"
            name="contactName"
            autoComplete="name"
            className={inputClass(errors.contactName)}
            placeholder="John Smith"
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Phone" required error={errors.phone} htmlFor="fcf-phone">
          <input
            id="fcf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass(errors.phone)}
            placeholder="(305) 555-0123"
          />
        </Field>
        <Field label="Email" required error={errors.email} htmlFor="fcf-email">
          <input
            id="fcf-email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClass(errors.email)}
            placeholder="you@company.com"
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Number of vehicles" htmlFor="fcf-size">
          <select id="fcf-size" name="fleetSize" className={inputClass()} defaultValue={fleetSizeOptions[0]}>
            {fleetSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gasoline or diesel" htmlFor="fcf-fuel">
          <select id="fcf-fuel" name="fuelType" className={inputClass()} defaultValue={fleetFuelOptions[0]}>
            {fleetFuelOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Vehicle types (multi-select) */}
      <fieldset className="mt-5">
        <legend className="mb-2 block text-sm font-medium text-foreground">Vehicle types</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {fleetVehicleTypeOptions.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                name="vehicleTypes"
                value={type}
                className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/30"
              />
              {type}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Services needed (multi-select) */}
      <fieldset className="mt-5">
        <legend className="mb-2 block text-sm font-medium text-foreground">Services needed</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {fleetServiceOptions.map((service) => (
            <label
              key={service}
              className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                name="servicesNeeded"
                value={service}
                className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/30"
              />
              {service}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <Field label="Preferred start date" htmlFor="fcf-date">
          <input id="fcf-date" name="preferredDate" type="date" min={todayISO()} className={inputClass()} />
        </Field>
      </div>

      {/* Preferred contact method */}
      <div className="mt-4">
        <span className="mb-1.5 block text-sm font-medium text-foreground">Preferred contact method</span>
        <div className="flex flex-wrap gap-3">
          {contactMethodOptions.map((method, i) => (
            <label
              key={method}
              className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <input
                type="radio"
                name="preferredContact"
                value={method}
                defaultChecked={i === 0}
                className="h-4 w-4 text-primary focus:ring-2 focus:ring-primary/30"
              />
              {method}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Field label="Notes" htmlFor="fcf-notes">
          <textarea
            id="fcf-notes"
            name="notes"
            rows={3}
            className={inputClass()}
            placeholder="Tell us about your fleet, how the vehicles are used, and any scheduling needs (pickup/drop-off, hours, etc.)."
          />
        </Field>
      </div>

      {/* SMS consent (A2P/10DLC) */}
      <div className="mt-5 flex items-start gap-3 rounded-md bg-muted/60 p-3.5">
        <input
          id="fcf-sms"
          type="checkbox"
          checked={smsConsent}
          onChange={(e) => setSmsConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-2 focus:ring-primary/30"
        />
        <label htmlFor="fcf-sms" className="text-xs leading-relaxed text-muted-foreground">
          By checking this box, I agree to receive SMS text messages from {siteConfig.name} about my fleet account,
          service updates, and scheduling. Message &amp; data rates may apply. Message frequency varies. Reply STOP to
          opt out or HELP for help. Consent is not a condition of purchase.
        </label>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {status === "submitting" && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {status === "submitting" ? "Sending..." : "Request Fleet Consultation"}
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Submitting sends a consultation request only &mdash; it does not confirm an appointment. See our{" "}
        <Link href="/privacy-policy" className="underline hover:text-primary">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="underline hover:text-primary">
          Terms
        </Link>
        .
      </p>
    </form>
  )
}

// ---- Small presentational helpers --------------------------------------

function inputClass(error?: string) {
  return `w-full rounded-md border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
    error
      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
      : "border-input focus:border-primary focus:ring-primary/30"
  }`
}

function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
