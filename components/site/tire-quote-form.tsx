"use client"

import { useState } from "react"
import Link from "next/link"
import { siteConfig } from "@/lib/site-config"
import {
  vehicleMakeOptions,
  contactMethodOptions,
  tireQuantityOptions,
  tireBrandOptions,
  tireBudgetOptions,
  getVehicleYears,
  useLeadMeta,
  validateLead,
  todayISO,
  type LeadErrors,
} from "@/lib/lead-form"

type Status = "idle" | "submitting" | "success" | "error"

export function TireQuoteForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [errors, setErrors] = useState<LeadErrors>({})
  const [smsConsent, setSmsConsent] = useState(false)
  const meta = useLeadMeta()
  const years = getVehicleYears()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const fields = {
      name: (data.get("name") as string) || "",
      email: (data.get("email") as string) || "",
      phone: (data.get("phone") as string) || "",
      vehicleYear: (data.get("vehicleYear") as string) || "",
      vehicleMake: (data.get("vehicleMake") as string) || "",
      vehicleModel: (data.get("vehicleModel") as string) || "",
      preferredDate: (data.get("preferredDate") as string) || "",
      preferredContact: (data.get("preferredContact") as string) || "",
    }

    // Tire-specific fields (not part of the shared validator).
    const tireSize = (data.get("tireSize") as string) || ""
    const quantity = (data.get("quantity") as string) || ""
    const preferredBrand = (data.get("preferredBrand") as string) || ""
    const budget = (data.get("budget") as string) || ""
    const notes = (data.get("notes") as string) || ""

    const validationErrors = validateLead(fields)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
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
          ...fields,
          leadType: "tire-quote",
          serviceType: "Tire Quote",
          tireSize,
          quantity,
          preferredBrand,
          budget,
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
        <h3 className="text-xl font-semibold text-foreground">Quote request received</h3>
        <p className="mt-2 text-muted-foreground">
          Thanks! We received your tire quote request. This is a request only &mdash; your quote and appointment are{" "}
          <strong>not confirmed yet</strong>. A team member will reach out with pricing and availability. For faster
          service, call{" "}
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
          Request another quote
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name} htmlFor="tqf-name">
          <input id="tqf-name" name="name" autoComplete="name" className={inputClass(errors.name)} placeholder="John Smith" />
        </Field>
        <Field label="Phone" required error={errors.phone} htmlFor="tqf-phone">
          <input
            id="tqf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass(errors.phone)}
            placeholder="(305) 555-0123"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Email" required error={errors.email} htmlFor="tqf-email">
          <input
            id="tqf-email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClass(errors.email)}
            placeholder="you@example.com"
          />
        </Field>
      </div>

      {/* Vehicle details */}
      <fieldset className="mt-4">
        <legend className="mb-1.5 block text-sm font-medium text-foreground">Vehicle</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <select name="vehicleYear" aria-label="Vehicle year" className={inputClass()} defaultValue="">
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select name="vehicleMake" aria-label="Vehicle make" className={inputClass()} defaultValue="">
            <option value="">Make</option>
            {vehicleMakeOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <input name="vehicleModel" aria-label="Vehicle model" className={inputClass()} placeholder="Model (e.g. F-150)" />
        </div>
      </fieldset>

      {/* Tire details */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Tire size" htmlFor="tqf-size">
          <input id="tqf-size" name="tireSize" className={inputClass()} placeholder="e.g. 225/65R17" />
          <p className="mt-1 text-xs text-muted-foreground">Found on the tire sidewall. Not sure? Leave blank.</p>
        </Field>
        <Field label="Quantity" htmlFor="tqf-qty">
          <select id="tqf-qty" name="quantity" className={inputClass()} defaultValue="4">
            {tireQuantityOptions.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Preferred brand" htmlFor="tqf-brand">
          <select id="tqf-brand" name="preferredBrand" className={inputClass()} defaultValue={tireBrandOptions[0]}>
            {tireBrandOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Budget preference" htmlFor="tqf-budget">
          <select id="tqf-budget" name="budget" className={inputClass()} defaultValue={tireBudgetOptions[0]}>
            {tireBudgetOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Preferred date" error={errors.preferredDate} htmlFor="tqf-date">
          <input id="tqf-date" name="preferredDate" type="date" min={todayISO()} className={inputClass(errors.preferredDate)} />
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
        <Field label="Notes" htmlFor="tqf-notes">
          <textarea
            id="tqf-notes"
            name="notes"
            rows={3}
            className={inputClass()}
            placeholder="Anything else we should know? (driving needs, run-flats, current tire condition, etc.)"
          />
        </Field>
      </div>

      {/* SMS consent (A2P/10DLC) */}
      <div className="mt-5 flex items-start gap-3 rounded-md bg-muted/60 p-3.5">
        <input
          id="tqf-sms"
          type="checkbox"
          checked={smsConsent}
          onChange={(e) => setSmsConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-2 focus:ring-primary/30"
        />
        <label htmlFor="tqf-sms" className="text-xs leading-relaxed text-muted-foreground">
          By checking this box, I agree to receive SMS text messages from {siteConfig.name} about my tire quote,
          appointment reminders, and updates. Message &amp; data rates may apply. Message frequency varies. Reply STOP to
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
        {status === "submitting" ? "Sending..." : "Get My Tire Quote"}
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Submitting sends a quote request only &mdash; it does not confirm pricing or an appointment. See our{" "}
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
