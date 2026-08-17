"use client"

import { useState } from "react"
import Link from "next/link"
import { siteConfig } from "@/lib/site-config"
import {
  serviceTypeOptions,
  vehicleMakeOptions,
  contactMethodOptions,
  getVehicleYears,
  useLeadMeta,
  validateLead,
  todayISO,
  type LeadErrors,
} from "@/lib/lead-form"

type Status = "idle" | "submitting" | "success" | "error"

// Short, conversion-focused lead form for ads landing pages.
// Posts to the same /api/contact endpoint used site-wide.
export function LeadForm({ serviceLabel }: { serviceLabel: string }) {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [errors, setErrors] = useState<LeadErrors>({})
  const [smsConsent, setSmsConsent] = useState(false)
  const meta = useLeadMeta()
  const years = getVehicleYears()

  // Prefer an exact match to a known service type; otherwise fall back to "Other".
  const defaultService = serviceTypeOptions.includes(serviceLabel) ? serviceLabel : "Other / Not sure"

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
      mileage: (data.get("mileage") as string) || "",
      serviceType: (data.get("serviceType") as string) || serviceLabel,
      concern: (data.get("concern") as string) || "",
      preferredDate: (data.get("preferredDate") as string) || "",
      preferredContact: (data.get("preferredContact") as string) || "",
    }

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
        body: JSON.stringify({ ...fields, smsConsent, ...meta }),
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
        <h3 className="text-xl font-semibold text-foreground">Request received</h3>
        <p className="mt-2 text-muted-foreground">
          Thanks! This is a request only &mdash; your appointment is <strong>not confirmed yet</strong>. We&apos;ll reach
          out shortly to confirm. Need help now? Call{" "}
          <a href={siteConfig.phone.href} className="font-semibold text-primary">
            {siteConfig.phone.display}
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="lf-name" className="mb-1.5 block text-sm font-medium text-foreground">
          Full name <span className="text-primary">*</span>
        </label>
        <input id="lf-name" name="name" autoComplete="name" className={inputClass(errors.name)} placeholder="John Smith" />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lf-phone" className="mb-1.5 block text-sm font-medium text-foreground">
            Phone <span className="text-primary">*</span>
          </label>
          <input
            id="lf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass(errors.phone)}
            placeholder="(305) 555-0123"
          />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="lf-email" className="mb-1.5 block text-sm font-medium text-foreground">
            Email <span className="text-primary">*</span>
          </label>
          <input
            id="lf-email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClass(errors.email)}
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lf-service" className="mb-1.5 block text-sm font-medium text-foreground">
            Service type
          </label>
          <select id="lf-service" name="serviceType" className={inputClass()} defaultValue={defaultService}>
            {serviceTypeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lf-date" className="mb-1.5 block text-sm font-medium text-foreground">
            Preferred date
          </label>
          <input id="lf-date" name="preferredDate" type="date" min={todayISO()} className={inputClass(errors.preferredDate)} />
          {errors.preferredDate && <p className="mt-1 text-xs text-destructive">{errors.preferredDate}</p>}
        </div>
      </div>

      {/* Vehicle details */}
      <div className="grid gap-4 sm:grid-cols-3">
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
        <input name="vehicleModel" aria-label="Vehicle model" className={inputClass()} placeholder="Model" />
      </div>

      <div>
        <input
          name="mileage"
          inputMode="numeric"
          aria-label="Mileage"
          className={inputClass(errors.mileage)}
          placeholder="Mileage (e.g. 62000)"
        />
        {errors.mileage && <p className="mt-1 text-xs text-destructive">{errors.mileage}</p>}
      </div>

      {/* Preferred contact method */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">Preferred contact method</span>
        <div className="flex flex-wrap gap-2">
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

      <div>
        <label htmlFor="lf-concern" className="mb-1.5 block text-sm font-medium text-foreground">
          What do you need? <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="lf-concern"
          name="concern"
          rows={3}
          className={inputClass()}
          placeholder="Describe the concern or symptoms..."
        />
      </div>

      {/* SMS consent (A2P/10DLC) */}
      <div className="flex items-start gap-3 rounded-md bg-muted/60 p-3.5">
        <input
          id="lf-sms"
          type="checkbox"
          checked={smsConsent}
          onChange={(e) => setSmsConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-2 focus:ring-primary/30"
        />
        <label htmlFor="lf-sms" className="text-xs leading-relaxed text-muted-foreground">
          By checking this box, I agree to receive SMS text messages from {siteConfig.name} about my service request,
          appointment reminders, and updates. Message &amp; data rates may apply. Message frequency varies. Reply STOP to
          opt out or HELP for help. Consent is not a condition of purchase.
        </label>
      </div>

      {status === "error" && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {status === "submitting" && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {status === "submitting" ? "Sending..." : "Request Service"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Submitting sends a request only &mdash; it does not confirm an appointment. See our{" "}
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

function inputClass(error?: string) {
  return `w-full rounded-md border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
    error
      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
      : "border-input focus:border-primary focus:ring-primary/30"
  }`
}
