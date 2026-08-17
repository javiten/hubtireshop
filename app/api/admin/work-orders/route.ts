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

// GET – list work orders (active or trashed)
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceClient()

  const { searchParams } = new URL(req.url)
  const trash = searchParams.get("trash") === "1"
  const from = searchParams.get("from") // YYYY-MM-DD
  const to = searchParams.get("to")     // YYYY-MM-DD

  let query = supabase
    .from("work_orders")
    .select(`
      id, task, status, due_date, start_time, end_time, all_day,
      assigned_to, pending_items, notes,
      deleted_at, deleted_by, created_at, updated_at,
      shop_customers ( id, first_name, last_name, email, phone ),
      vehicles ( id, year, make, model, trim, vin, license_plate, mileage )
    `)
    .order("due_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false })
    .limit(500)

  if (trash) {
    query = query.not("deleted_at", "is", null)
  } else {
    query = query.is("deleted_at", null)
  }

  if (from) query = query.gte("due_date", from)
  if (to) query = query.lte("due_date", to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST – create work order
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceClient()

  const body = await req.json()
  const { customer_id, vehicle_id, task, status, due_date, start_time, end_time, all_day, assigned_to, pending_items, notes } = body

  if (!customer_id || !task || !due_date) {
    return NextResponse.json({ error: "customer_id, task, and due_date are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("work_orders")
    .insert({
      customer_id,
      vehicle_id: vehicle_id || null,
      task: task.trim(),
      status: status || "Scheduled",
      due_date,
      start_time: start_time || null,
      end_time: end_time || null,
      all_day: all_day ?? false,
      assigned_to: assigned_to?.trim() || null,
      pending_items: pending_items || [],
      notes: notes?.trim() || null,
    })
    .select(`
      id, task, status, due_date, start_time, end_time, all_day,
      assigned_to, pending_items, notes,
      deleted_at, deleted_by, created_at, updated_at,
      shop_customers ( id, first_name, last_name, email, phone ),
      vehicles ( id, year, make, model, trim, vin, license_plate, mileage )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
