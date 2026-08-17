import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function isAuthed(req: NextRequest) {
  const session = req.cookies.get("admin_session")
  return !!session?.value
}

// GET – single inspection with full details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceClient()
  const { id } = await params

  const { data, error } = await supabase
    .from("inspections")
    .select(`
      *,
      inspection_items (*),
      inspection_photos (*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  // Sort items by item_number
  if (data.inspection_items) {
    data.inspection_items.sort((a: { item_number: number }, b: { item_number: number }) => a.item_number - b.item_number)
  }

  return NextResponse.json(data)
}

// PATCH – update inspection
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceClient()
  const { id } = await params

  try {
    const body = await req.json()
    const { inspection, items } = body

    // Update main inspection record
    if (inspection) {
      const { error: inspError } = await supabase
        .from("inspections")
        .update({
          customer_name: inspection.customer_name,
          vehicle_plate: inspection.vehicle_plate,
          vehicle_vin: inspection.vehicle_vin,
          vehicle_year: inspection.vehicle_year,
          vehicle_make: inspection.vehicle_make,
          vehicle_model: inspection.vehicle_model,
          vehicle_trim: inspection.vehicle_trim,
          mileage: inspection.mileage,
          additional_notes: inspection.additional_notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (inspError) {
        return NextResponse.json({ error: inspError.message }, { status: 500 })
      }
    }

    // Update inspection items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const { error: itemError } = await supabase
          .from("inspection_items")
          .update({
            status: item.status,
            fail_notes: item.fail_notes || null,
            tire_depths: item.tire_depths || null,
          })
          .eq("id", item.id)

        if (itemError) {
          console.error("Failed to update item:", item.id, itemError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("PATCH error:", err)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

// DELETE – delete inspection and related records
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceClient()
  const { id } = await params

  // Delete inspection items first (foreign key)
  await supabase.from("inspection_items").delete().eq("inspection_id", id)
  
  // Delete inspection photos (foreign key)
  await supabase.from("inspection_photos").delete().eq("inspection_id", id)

  // Delete the inspection itself
  const { error } = await supabase.from("inspections").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
