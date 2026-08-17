import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("admin_session")
  if (!session || !session.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      customer_id: body.customer_id,
      vin: body.vin?.trim() || null,
      year: body.year?.trim() || null,
      make: body.make?.trim() || null,
      model: body.model?.trim() || null,
      trim: body.trim?.trim() || null,
      license_plate: body.license_plate?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      if (error.message.includes("vin")) {
        return NextResponse.json({ error: "A vehicle with this VIN already exists." }, { status: 409 })
      }
      if (error.message.includes("license_plate") || error.message.includes("plate")) {
        return NextResponse.json({ error: "A vehicle with this license plate already exists." }, { status: 409 })
      }
      return NextResponse.json({ error: "Duplicate vehicle entry." }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
