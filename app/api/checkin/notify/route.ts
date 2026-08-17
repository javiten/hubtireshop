import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SHOP_EMAIL = process.env.SHOP_NOTIFICATION_EMAIL || "info@hubtireshop.com"

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured")
    return NextResponse.json({ error: "Email not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { customer, vehicle, mileage, notes, time_sensitivity, photos } = body

    const vehicleStr = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
      .filter(Boolean)
      .join(" ") || "N/A"

    const now = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    const photoHtml = photos && photos.length > 0
      ? `
        <h3 style="margin:24px 0 12px 0;font-size:14px;color:#666;">Photos (${photos.length})</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${photos.map((p: { blob_url: string; file_name: string }) =>
            `<a href="${p.blob_url}" target="_blank" style="display:inline-block;">
              <img src="${p.blob_url}" alt="${p.file_name || "photo"}" width="200" style="border-radius:8px;border:1px solid #e5e5e5;" />
            </a>`
          ).join("")}
        </div>`
      : ""

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0a1628;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:#ffffff;font-size:20px;margin:0;">New Vehicle Check-In</h1>
          <p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">${now}</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;">
          <h3 style="margin:0 0 12px 0;font-size:14px;color:#666;">Customer</h3>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;color:#999;width:100px;">Name</td><td style="padding:4px 8px;">${customer.first_name} ${customer.last_name}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">Email</td><td style="padding:4px 8px;">${customer.email || "N/A"}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">Phone</td><td style="padding:4px 8px;">${customer.phone || "N/A"}</td></tr>
          </table>

          <h3 style="margin:24px 0 12px 0;font-size:14px;color:#666;">Time Sensitivity</h3>
          <p style="font-size:14px;margin:0;padding:12px;background:${time_sensitivity === "Today / ASAP" ? "#fef3c7" : "#f0fdf4"};border-radius:8px;font-weight:500;">${time_sensitivity || "N/A"}</p>

          <h3 style="margin:24px 0 12px 0;font-size:14px;color:#666;">Vehicle</h3>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;color:#999;width:100px;">Vehicle</td><td style="padding:4px 8px;">${vehicleStr}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">VIN</td><td style="padding:4px 8px;font-family:monospace;">${vehicle.vin || "N/A"}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">Plate</td><td style="padding:4px 8px;">${vehicle.license_plate || "N/A"}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">Mileage</td><td style="padding:4px 8px;">${mileage || "N/A"}</td></tr>
          </table>

          ${notes ? `
            <h3 style="margin:24px 0 12px 0;font-size:14px;color:#666;">Notes</h3>
            <p style="font-size:14px;margin:0;padding:12px;background:#f8f9fa;border-radius:8px;">${notes}</p>
          ` : ""}

          ${photoHtml}
        </div>
      </div>
    `

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Hub Tire Shop <onboarding@resend.dev>",
        to: [SHOP_EMAIL],
        subject: "New Vehicle Check In",
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error("Resend error:", errBody)
      return NextResponse.json({ error: "Email send failed" }, { status: 500 })
    }

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error("Email notification error:", error)
    return NextResponse.json({ error: "Email send failed" }, { status: 500 })
  }
}
