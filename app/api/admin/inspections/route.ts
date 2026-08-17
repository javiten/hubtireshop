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

// GET – list inspections with search and filters
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = getServiceClient()

  const url = new URL(req.url)
  const search = url.searchParams.get("search")?.toLowerCase() || ""
  const status = url.searchParams.get("status") // all, passed, failed
  const from = url.searchParams.get("from") // date range start
  const to = url.searchParams.get("to") // date range end

  let query = supabase
    .from("inspections")
    .select(`
      *,
      inspection_items (*),
      inspection_photos (*)
    `)
    .order("created_at", { ascending: false })

  // Date range filter
  if (from) {
    query = query.gte("inspection_date", from)
  }
  if (to) {
    query = query.lte("inspection_date", to)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Process results to add computed fields
  let results = (data || []).map((inspection) => {
    const items = inspection.inspection_items || []
    const failedItems = items.filter((i: { status: string }) => i.status === "FAIL")
    const passedItems = items.filter((i: { status: string }) => i.status === "PASS")
    const hasFailedItems = failedItems.length > 0
    const overallStatus = items.length === 0 ? "pending" : hasFailedItems ? "failed" : "passed"

    return {
      ...inspection,
      failed_count: failedItems.length,
      passed_count: passedItems.length,
      total_items: items.length,
      photo_count: inspection.inspection_photos?.length || 0,
      overall_status: overallStatus,
    }
  })

  // Status filter
  if (status === "passed") {
    results = results.filter((r) => r.overall_status === "passed")
  } else if (status === "failed") {
    results = results.filter((r) => r.overall_status === "failed")
  }

  // Search filter (case insensitive)
  if (search) {
    results = results.filter((r) => {
      const searchFields = [
        r.customer_name,
        r.vehicle_make,
        r.vehicle_model,
        r.vehicle_year,
        r.vehicle_vin,
        r.vehicle_plate,
      ].filter(Boolean).join(" ").toLowerCase()
      return searchFields.includes(search)
    })
  }

  return NextResponse.json(results)
}
