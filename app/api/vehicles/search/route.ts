import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || ""
  if (q.length < 2) {
    return NextResponse.json([])
  }

  const supabase = getAnonClient()

  // Search vehicles by plate, VIN, make, or model
  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      id,
      customer_id,
      vin,
      year,
      make,
      model,
      trim,
      license_plate,
      mileage,
      shop_customers (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .or(`license_plate.ilike.%${q}%,vin.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%`)
    .limit(20)

  if (error) {
    console.error("Vehicle search error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the customer
  const results = (data || []).map((v) => ({
    ...v,
    customer: v.shop_customers || null,
    shop_customers: undefined,
  }))

  return NextResponse.json(results)
}
