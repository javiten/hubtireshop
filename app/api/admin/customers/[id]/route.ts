import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// GET /api/admin/customers/[id] — full customer with vehicles and check-ins
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = request.cookies.get("admin_session")
  if (!session || !session.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const supabase = getServiceClient()

  const { data: customer, error: customerError } = await supabase
    .from("shop_customers")
    .select("id, first_name, last_name, email, phone, created_at")
    .eq("id", id)
    .single()

  if (customerError) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, vin, year, make, model, trim, license_plate, notes, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select(`
      id, mileage, notes, created_at,
      vehicles (id, vin, year, make, model, trim, license_plate),
      check_in_photos (id, blob_url, file_name)
    `)
    .eq("customer_id", id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ ...customer, vehicles: vehicles || [], check_ins: checkIns || [] })
}

// PATCH /api/admin/customers/[id] — update customer fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = request.cookies.get("admin_session")
  if (!session || !session.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const supabase = getServiceClient()
  const body = await request.json()

  const updateData: Record<string, string | null> = {}
  if (body.first_name !== undefined) updateData.first_name = body.first_name.trim()
  if (body.last_name !== undefined) updateData.last_name = body.last_name.trim()
  if (body.email !== undefined) updateData.email = body.email?.trim() || null
  if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null

  const { data, error } = await supabase
    .from("shop_customers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    if (error.message.includes("idx_customers_name_unique")) {
      return NextResponse.json({ error: "A customer with this name already exists.", field: "name" }, { status: 409 })
    }
    if (error.message.includes("idx_customers_email_unique")) {
      return NextResponse.json({ error: "This email is already used by another customer.", field: "email" }, { status: 409 })
    }
    if (error.message.includes("idx_customers_phone_unique")) {
      return NextResponse.json({ error: "This phone number is already used by another customer.", field: "phone" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/admin/customers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = request.cookies.get("admin_session")
  if (!session || !session.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const supabase = getServiceClient()

  const { error } = await supabase
    .from("shop_customers")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
