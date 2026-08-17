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

// PATCH – update work order
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceClient()
  const { id } = await params
  const body = await req.json()

  // Build update object only with provided fields
  const updates: Record<string, unknown> = {}
  const allowedFields = ["customer_id", "vehicle_id", "task", "status", "due_date", "start_time", "end_time", "all_day", "assigned_to", "pending_items", "notes"]
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("work_orders")
    .update(updates)
    .eq("id", id)
    .select(`
      id, task, status, due_date, start_time, end_time, all_day,
      assigned_to, pending_items, notes,
      deleted_at, deleted_by, created_at, updated_at,
      shop_customers ( id, first_name, last_name, email, phone ),
      vehicles ( id, year, make, model, trim, vin, license_plate, mileage )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE – soft delete (move to trash) or hard delete
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceClient()
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const permanent = searchParams.get("permanent") === "1"

  if (permanent) {
    const { error } = await supabase.from("work_orders").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Soft delete
  const { error } = await supabase
    .from("work_orders")
    .update({ deleted_at: new Date().toISOString(), deleted_by: "admin" })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
