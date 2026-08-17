import { type NextRequest, NextResponse } from "next/server"
import { verifyTurnstileToken } from "@/lib/turnstile"

// Where lead notifications are delivered.
const NOTIFY_TO = "info@hubtireshop.com"
// Sender must be on a domain verified in Resend.
const NOTIFY_FROM = "Hub Tire Shop Website <noreply@hubtireshop.com>"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function row(label: string, value: unknown): string {
  const v = String(value ?? "").trim()
  if (!v) return ""
  return `<tr>
    <td style="padding:6px 12px;font-weight:600;color:#111;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
    <td style="padding:6px 12px;color:#333;">${esc(v).replace(/\n/g, "<br/>")}</td>
  </tr>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Block bot submissions before doing any work or sending email.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    const captcha = await verifyTurnstileToken(body?.turnstileToken, ip)
    if (!captcha.success) {
      return NextResponse.json({ error: captcha.reason }, { status: 400 })
    }

    const {
      name,
      email,
      phone,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      mileage,
      serviceType,
      concern,
      preferredDate,
      preferredContact,
      smsConsent,
      // Tire quote fields.
      leadType,
      tireSize,
      quantity,
      preferredBrand,
      budget,
      // Fleet inquiry fields.
      businessName,
      contactName,
      fleetSize,
      vehicleTypes,
      fuelType,
      servicesNeeded,
      sourcePage,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      // Back-compat: some callers may still send a prebuilt message.
      message,
    } = body

    // Server-side validation.
    const digits = String(phone ?? "").replace(/\D/g, "")
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 })
    }
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }
    if (!phone || digits.length < 10) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 })
    }

    const vehicle = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ").trim()
    const submittedAt = new Date().toISOString()
    const isTireQuote = leadType === "tire-quote"
    const isFleet = leadType === "fleet-inquiry"

    // Multi-select fields may arrive as arrays.
    const vehicleTypesStr = Array.isArray(vehicleTypes) ? vehicleTypes.join(", ") : vehicleTypes || ""
    const servicesNeededStr = Array.isArray(servicesNeeded) ? servicesNeeded.join(", ") : servicesNeeded || ""

    // Build the notification email.
    const subjectService = serviceType ? ` — ${serviceType}` : ""
    const subject = isFleet
      ? `New Fleet Consultation — ${String(businessName || name).trim()}`
      : isTireQuote
        ? `New Tire Quote Request — ${String(name).trim()}`
        : `New Service Request${subjectService} — ${String(name).trim()}`

    const leadLabel = isFleet ? "New Fleet Consultation" : isTireQuote ? "New Tire Quote Request" : "New Website Lead"

    const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f5;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e5e5;">
      <tr>
        <td style="background:#171717;padding:20px 24px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;">Hub Tire Shop</span>
          <span style="color:#f97316;font-size:18px;font-weight:700;"> — ${leadLabel}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 12px 4px;">
          <p style="margin:0 0 8px 12px;color:#555;font-size:13px;">
            This is a <strong>${isFleet ? "fleet consultation request" : isTireQuote ? "tire quote request" : "service request"}</strong>, not a confirmed ${isTireQuote ? "quote or appointment" : "appointment"}. Please contact the ${isFleet ? "business" : "customer"} to follow up.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 12px 8px;">
          <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">
            ${row("Business name", businessName)}
            ${row(isFleet ? "Contact name" : "Name", isFleet ? contactName || name : name)}
            ${row("Phone", phone)}
            ${row("Email", email)}
            ${row("Preferred contact", preferredContact)}
            ${row("Preferred date", preferredDate)}
            ${row("Number of vehicles", fleetSize)}
            ${row("Vehicle types", vehicleTypesStr)}
            ${row("Fuel type", fuelType)}
            ${row("Services needed", servicesNeededStr)}
            ${row("Service type", serviceType)}
            ${row("Vehicle", vehicle)}
            ${row("Mileage", mileage)}
            ${row("Tire size", tireSize)}
            ${row("Quantity", quantity)}
            ${row("Preferred brand", preferredBrand)}
            ${row("Budget preference", budget)}
            ${row(isFleet || isTireQuote ? "Notes" : "Customer concern", concern || message)}
            ${row("SMS consent", smsConsent ? "Yes (opted in)" : "No")}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 12px 20px;">
          <p style="margin:12px 12px 6px;color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">Attribution</p>
          <table role="presentation" width="100%" style="border-collapse:collapse;font-size:13px;">
            ${row("Source page", sourcePage)}
            ${row("Referrer", referrer)}
            ${row("UTM source", utmSource)}
            ${row("UTM medium", utmMedium)}
            ${row("UTM campaign", utmCampaign)}
            ${row("UTM term", utmTerm)}
            ${row("UTM content", utmContent)}
            ${row("Submitted", submittedAt)}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

    const text = [
      `${leadLabel} — Hub Tire Shop`,
      isFleet
        ? "(Fleet consultation request — NOT a confirmed appointment. Contact the business to follow up.)"
        : isTireQuote
          ? "(Tire quote request — NOT confirmed pricing or an appointment. Contact the customer to confirm.)"
          : "(Service request — NOT a confirmed appointment. Contact the customer to confirm.)",
      "",
      businessName && `Business name: ${businessName}`,
      `${isFleet ? "Contact name" : "Name"}: ${isFleet ? contactName || name : name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      preferredContact && `Preferred contact: ${preferredContact}`,
      preferredDate && `Preferred date: ${preferredDate}`,
      fleetSize && `Number of vehicles: ${fleetSize}`,
      vehicleTypesStr && `Vehicle types: ${vehicleTypesStr}`,
      fuelType && `Fuel type: ${fuelType}`,
      servicesNeededStr && `Services needed: ${servicesNeededStr}`,
      serviceType && `Service type: ${serviceType}`,
      vehicle && `Vehicle: ${vehicle}`,
      mileage && `Mileage: ${mileage}`,
      tireSize && `Tire size: ${tireSize}`,
      quantity && `Quantity: ${quantity}`,
      preferredBrand && `Preferred brand: ${preferredBrand}`,
      budget && `Budget preference: ${budget}`,
      (concern || message) && `${isFleet || isTireQuote ? "Notes" : "Concern"}: ${concern || message}`,
      `SMS consent: ${smsConsent ? "Yes" : "No"}`,
      "",
      "-- Attribution --",
      sourcePage && `Source page: ${sourcePage}`,
      referrer && `Referrer: ${referrer}`,
      utmSource && `UTM source: ${utmSource}`,
      utmMedium && `UTM medium: ${utmMedium}`,
      utmCampaign && `UTM campaign: ${utmCampaign}`,
      utmTerm && `UTM term: ${utmTerm}`,
      utmContent && `UTM content: ${utmContent}`,
      `Submitted: ${submittedAt}`,
    ]
      .filter(Boolean)
      .join("\n")

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error("[v0] RESEND_API_KEY is not set — cannot send lead email.")
      return NextResponse.json(
        { error: "Email service is not configured. Please call us directly." },
        { status: 500 },
      )
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        reply_to: String(email).trim(),
        subject,
        html,
        text,
      }),
    })

    if (!resendRes.ok) {
      const detail = await resendRes.text().catch(() => "")
      console.error("[v0] Resend send failed:", resendRes.status, detail)
      return NextResponse.json(
        { error: "We couldn't send your request. Please call us and we'll help right away." },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Contact submission error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
