import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

type PhotoMeta = {
  blob_url: string
  file_name: string
  content_type: string
  size_bytes: number
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
  tire_depths?: TireDepthData
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicle_id,
      customer_id,
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

    const supabase = getAnonClient()

    // Create the inspection record
    const { data: inspection, error: inspectionError } = await supabase
      .from("inspections")
      .insert({
        vehicle_id: vehicle_id || null,
        customer_id: customer_id || null,
        inspection_date: inspection_date || new Date().toISOString().split("T")[0],
        customer_name: customer_name || null,
        vehicle_plate: vehicle_plate || null,
        mileage: mileage || null,
        vehicle_year: vehicle_year || null,
        vehicle_make: vehicle_make || null,
        vehicle_model: vehicle_model || null,
        vehicle_trim: vehicle_trim || null,
        vehicle_vin: vehicle_vin || null,
        additional_notes: additional_notes || null,
      })
      .select("id")
      .single()

    if (inspectionError) {
      console.error("Inspection insert error:", inspectionError)
      return NextResponse.json({ error: inspectionError.message }, { status: 500 })
    }

    // Insert all inspection items
    if (items && Array.isArray(items) && items.length > 0) {
      const itemRecords = (items as InspectionItem[]).map((item) => ({
        inspection_id: inspection.id,
        item_number: item.item_number,
        category: item.category,
        item_label: item.item_label,
        status: item.status,
        fail_notes: item.status === "FAIL" ? item.fail_notes : null,
        tire_depths: item.tire_depths && Object.keys(item.tire_depths).length > 0 ? item.tire_depths : null,
      }))

      const { error: itemsError } = await supabase
        .from("inspection_items")
        .insert(itemRecords)

      if (itemsError) {
        console.error("Inspection items insert error:", itemsError)
      }
    }

    // Insert photos
    if (photos && Array.isArray(photos) && photos.length > 0) {
      const photoRecords = (photos as PhotoMeta[]).map((p) => ({
        inspection_id: inspection.id,
        blob_url: p.blob_url,
        file_name: p.file_name,
        content_type: p.content_type,
        size_bytes: p.size_bytes,
      }))

      const { error: photoError } = await supabase
        .from("inspection_photos")
        .insert(photoRecords)

      if (photoError) {
        console.error("Inspection photos insert error:", photoError)
      }
    }

    // Send email notification (non-blocking)
    try {
      await fetch(new URL("/api/inspection/notify", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection_id: inspection.id,
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
          photos: photos || [],
        }),
      })
    } catch {
      console.error("Failed to send inspection notification email")
    }

    return NextResponse.json({
      success: true,
      inspection_id: inspection.id,
    })
  } catch (error) {
    console.error("Inspection error:", error)
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 })
  }
}
