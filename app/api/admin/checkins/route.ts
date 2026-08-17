import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("admin_session")
  if (!session || !session.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceClient()
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get("search")?.trim()

  let query = supabase
    .from("check_ins")
    .select(`
      id,
      mileage,
      notes,
      time_sensitivity,
      created_at,
      shop_customers (
        id, first_name, last_name, email, phone
      ),
      vehicles (
        id, vin, year, make, model, trim, license_plate, mileage
      ),
      check_in_photos (
        id, blob_url, file_name, content_type, size_bytes
      )
    `)
    .order("created_at", { ascending: false })
    .limit(200)

  if (search) {
    // PostgREST doesn't support .or() on embedded resources.
    // Search by finding matching customer/vehicle IDs first, then filter check_ins.
    const { data: matchingCustomers } = await supabase
      .from("shop_customers")
      .select("id")
      .or(`last_name.ilike.%${search}%,first_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)

    const { data: matchingVehicles } = await supabase
      .from("vehicles")
      .select("id")
      .or(`vin.ilike.%${search}%,license_plate.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`)

    const customerIds = (matchingCustomers || []).map((c: { id: string }) => c.id)
    const vehicleIds = (matchingVehicles || []).map((v: { id: string }) => v.id)
    const allIds = [...new Set([...customerIds, ...vehicleIds])]

    if (allIds.length === 0) {
      return NextResponse.json([])
    }

    // Build OR filter on check_ins columns
    const filters: string[] = []
    if (customerIds.length > 0) filters.push(`customer_id.in.(${customerIds.join(",")})`)
    if (vehicleIds.length > 0) filters.push(`vehicle_id.in.(${vehicleIds.join(",")})`)

    query = supabase
      .from("check_ins")
      .select(`
        id,
        mileage,
        notes,
        time_sensitivity,
        created_at,
        shop_customers (
          id, first_name, last_name, email, phone
        ),
        vehicles (
          id, vin, year, make, model, trim, license_plate, mileage
        ),
        check_in_photos (
          id, blob_url, file_name, content_type, size_bytes
        )
      `)
      .or(filters.join(","))
      .order("created_at", { ascending: false })
      .limit(200)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
