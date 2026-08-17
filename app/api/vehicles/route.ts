import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// GET /api/vehicles?customer_id=UUID — returns vehicles for a customer
export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customer_id")
  if (!customerId) {
    return NextResponse.json({ error: "customer_id required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/vehicles — creates a new vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, vin, license_plate, year, make, model, trim, mileage, notes } = body

    if (!customer_id) {
      return NextResponse.json({ error: "customer_id is required" }, { status: 400 })
    }
    if (!make || !model) {
      return NextResponse.json({ error: "make and model are required" }, { status: 400 })
    }

    // Check for duplicate VIN
    if (vin?.trim()) {
      const { data: existingVin } = await supabase
        .from("vehicles")
        .select("id")
        .eq("vin", vin.trim())
        .limit(1)
        .single()
      if (existingVin) {
        return NextResponse.json({ error: "A vehicle with this VIN already exists" }, { status: 409 })
      }
    }

    // Check for duplicate license plate
    if (license_plate?.trim()) {
      const { data: existingPlate } = await supabase
        .from("vehicles")
        .select("id")
        .eq("license_plate", license_plate.trim())
        .limit(1)
        .single()
      if (existingPlate) {
        return NextResponse.json({ error: "A vehicle with this license plate already exists" }, { status: 409 })
      }
    }

    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        customer_id,
        vin: vin?.trim() || null,
        license_plate: license_plate?.trim() || null,
        year: year?.trim() || null,
        make: make.trim(),
        model: model.trim(),
        trim: trim?.trim() || null,
        mileage: mileage?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Vehicle creation error:", err)
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 })
  }
}
