import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

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

  const { data, error } = await supabase
    .from("vehicles")
    .update(body)
    .eq("id", id)
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
    .from("vehicles")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
