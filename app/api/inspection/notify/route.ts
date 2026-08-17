import { NextRequest, NextResponse } from "next/server"

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
  tire_depths?: TireDepthData
}

export async function POST(request: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SHOP_EMAIL = process.env.SHOP_NOTIFICATION_EMAIL || "info@hubtireshop.com"

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured")
    return NextResponse.json({ error: "Email not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const {
      inspection_date,
      customer_name,
      vehicle_plate,
      mileage,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      vehicle_trim,
      vehicle_vin,
      items,
      additional_notes,
      photos,
    } = body

    const vehicleStr = [vehicle_year, vehicle_make, vehicle_model, vehicle_trim]
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

    // Group items by category
    const categories = Array.from(new Set((items as InspectionItem[]).map((i) => i.category)))
    
    const checklistHtml = categories.map((category) => {
      const categoryItems = (items as InspectionItem[]).filter((i) => i.category === category)
      const categoryRows = categoryItems.map((item) => {
        const statusColor = item.status === "PASS" ? "#10b981" : "#ef4444"
        const statusBg = item.status === "PASS" ? "#d1fae5" : "#fee2e2"
        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;font-size:13px;">${item.item_number}. ${item.item_label}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:center;">
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${statusBg};color:${statusColor};">
                ${item.status}
              </span>
            </td>
          </tr>
          ${item.status === "FAIL" && item.fail_notes ? `
            <tr>
              <td colspan="2" style="padding:4px 8px 12px 24px;font-size:12px;color:#666;background:#fef2f2;">
                <em>Issue: ${item.fail_notes}</em>
              </td>
            </tr>
          ` : ""}
          ${item.tire_depths && Object.keys(item.tire_depths).length > 0 ? `
            <tr>
              <td colspan="2" style="padding:8px 8px 12px 24px;font-size:12px;background:#fef2f2;">
                <strong style="color:#666;">Tire Tread Depths (32nds):</strong>
                <div style="margin-top:4px;display:flex;gap:12px;flex-wrap:wrap;">
                  ${item.tire_depths.fl !== undefined ? `<span style="background:#fee2e2;padding:4px 8px;border-radius:4px;"><strong>FL:</strong> ${item.tire_depths.fl || "N/A"}</span>` : ""}
                  ${item.tire_depths.fr !== undefined ? `<span style="background:#fee2e2;padding:4px 8px;border-radius:4px;"><strong>FR:</strong> ${item.tire_depths.fr || "N/A"}</span>` : ""}
                  ${item.tire_depths.rl !== undefined ? `<span style="background:#fee2e2;padding:4px 8px;border-radius:4px;"><strong>RL:</strong> ${item.tire_depths.rl || "N/A"}</span>` : ""}
                  ${item.tire_depths.rr !== undefined ? `<span style="background:#fee2e2;padding:4px 8px;border-radius:4px;"><strong>RR:</strong> ${item.tire_depths.rr || "N/A"}</span>` : ""}
                </div>
              </td>
            </tr>
          ` : ""}
        `
      }).join("")

      return `
        <h4 style="margin:16px 0 8px 0;font-size:13px;color:#f97316;text-transform:uppercase;letter-spacing:0.5px;">${category}</h4>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5;border-radius:8px;">
          ${categoryRows}
        </table>
      `
    }).join("")

    // Count passed and failed
    const passCount = (items as InspectionItem[]).filter((i) => i.status === "PASS").length
    const failCount = (items as InspectionItem[]).filter((i) => i.status === "FAIL").length

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
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:0 auto;">
        <div style="background:#0a1628;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:#ffffff;font-size:20px;margin:0;">Vehicle Safety Inspection Report</h1>
          <p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">${now}</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;">
          
          <!-- Summary -->
          <div style="display:flex;gap:16px;margin-bottom:24px;">
            <div style="flex:1;background:#d1fae5;border-radius:8px;padding:12px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:700;color:#10b981;">${passCount}</p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#047857;">PASSED</p>
            </div>
            <div style="flex:1;background:#fee2e2;border-radius:8px;padding:12px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:700;color:#ef4444;">${failCount}</p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#b91c1c;">FAILED</p>
            </div>
          </div>

          <h3 style="margin:0 0 12px 0;font-size:14px;color:#666;">Inspection Details</h3>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;color:#999;width:120px;">Date</td><td style="padding:4px 8px;">${inspection_date || "N/A"}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">Customer</td><td style="padding:4px 8px;">${customer_name || "N/A"}</td></tr>
          </table>

          <h3 style="margin:24px 0 12px 0;font-size:14px;color:#666;">Vehicle</h3>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="padding:4px 8px;color:#999;width:120px;">Vehicle</td><td style="padding:4px 8px;">${vehicleStr}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">Plate</td><td style="padding:4px 8px;">${vehicle_plate || "N/A"}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">VIN</td><td style="padding:4px 8px;font-family:monospace;">${vehicle_vin || "N/A"}</td></tr>
            <tr><td style="padding:4px 8px;color:#999;">Mileage</td><td style="padding:4px 8px;">${mileage || "N/A"}</td></tr>
          </table>

          <h3 style="margin:24px 0 12px 0;font-size:14px;color:#666;">Inspection Checklist</h3>
          ${checklistHtml}

          ${additional_notes ? `
            <h3 style="margin:24px 0 12px 0;font-size:14px;color:#666;">Additional Notes</h3>
            <p style="font-size:14px;margin:0;padding:12px;background:#f8f9fa;border-radius:8px;">${additional_notes}</p>
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
        subject: `Vehicle Inspection Report - ${vehicleStr} (${failCount > 0 ? failCount + " issues found" : "All passed"})`,
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
