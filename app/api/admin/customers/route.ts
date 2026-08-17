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
    .from("shop_customers")
    .select("id, first_name, last_name, email, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (search) {
    query = supabase
      .from("shop_customers")
      .select("id, first_name, last_name, email, phone, created_at")
      .or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      )
      .order("last_name", { ascending: true })
      .limit(200)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get("admin_session")
  if (!session || !session.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("shop_customers")
    .insert({
      first_name: body.first_name?.trim(),
      last_name: body.last_name?.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
    })
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
