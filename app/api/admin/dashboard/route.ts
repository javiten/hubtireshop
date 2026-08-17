import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const today = now.toISOString().split("T")[0]
  
  // Calculate week start (Monday)
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString()

  // Calculate month start
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthStartStr = monthStart.toISOString()

  try {
    // Parallel fetches for performance
    const [
      checkInsRes,
      inspectionsRes,
      customersRes,
      vehiclesThisMonthRes,
      workOrdersRes,
      inspectionItemsRes,
      checkInPhotosRes,
    ] = await Promise.all([
      // All check-ins with created_at for filtering
      supabase
        .from("check_ins")
        .select("id, created_at, customer_id, vehicle_id, shop_customers(id, first_name, last_name), vehicles(id, year, make, model)")
        .order("created_at", { ascending: false }),
      
      // All inspections
      supabase
        .from("inspections")
        .select("id, created_at, customer_name, vehicle_make, vehicle_model, vehicle_year")
        .order("created_at", { ascending: false }),
      
      // Total unique customers
      supabase.from("shop_customers").select("id", { count: "exact", head: true }),
      
      // Vehicles served this month (from check-ins)
      supabase
        .from("check_ins")
        .select("vehicle_id")
        .gte("created_at", monthStartStr),
      
      // Work orders for schedule
      supabase
        .from("work_orders")
        .select("id, task, status, due_date, start_time, end_time, assigned_to, shop_customers(first_name, last_name), vehicles(year, make, model)")
        .is("deleted_at", null)
        .gte("due_date", today)
        .order("due_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(10),
      
      // Inspection items for failure stats
      supabase.from("inspection_items").select("id, status"),
      
      // Check-in photos for avg calculation
      supabase.from("check_in_photos").select("id, check_in_id"),
    ])

    const checkIns = checkInsRes.data || []
    const inspections = inspectionsRes.data || []
    const workOrders = workOrdersRes.data || []
    const inspectionItems = inspectionItemsRes.data || []
    const checkInPhotos = checkInPhotosRes.data || []

    // Calculate metrics
    const todayStart = new Date(today).toISOString()
    const todayEnd = new Date(today + "T23:59:59.999Z").toISOString()

    const todayCheckIns = checkIns.filter(c => c.created_at >= todayStart && c.created_at <= todayEnd).length
    const weekCheckIns = checkIns.filter(c => c.created_at >= weekStartStr).length
    const totalCheckIns = checkIns.length

    const weekInspections = inspections.filter(i => i.created_at >= weekStartStr).length

    const totalCustomers = customersRes.count || 0

    // Unique vehicles served this month
    const vehicleIds = new Set((vehiclesThisMonthRes.data || []).map(v => v.vehicle_id).filter(Boolean))
    const vehiclesServedThisMonth = vehicleIds.size

    // Inspection failure rate
    const totalItems = inspectionItems.length
    const failedItems = inspectionItems.filter(i => i.status === "FAIL").length
    const failureRate = totalItems > 0 ? Math.round((failedItems / totalItems) * 100) : 0

    // Avg photos per check-in
    const checkInPhotoMap = new Map<string, number>()
    checkInPhotos.forEach(p => {
      checkInPhotoMap.set(p.check_in_id, (checkInPhotoMap.get(p.check_in_id) || 0) + 1)
    })
    const avgPhotos = checkInPhotoMap.size > 0 
      ? (checkInPhotos.length / checkInPhotoMap.size).toFixed(1) 
      : "0"

    // Most frequent vehicle make this month
    const makeCounts = new Map<string, number>()
    checkIns
      .filter(c => c.created_at >= monthStartStr && c.vehicles?.make)
      .forEach(c => {
        const make = c.vehicles!.make!
        makeCounts.set(make, (makeCounts.get(make) || 0) + 1)
      })
    const topMake = [...makeCounts.entries()].sort((a, b) => b[1] - a[1])[0]

    // Repeat customers (customers with more than 1 check-in)
    const customerCheckInCounts = new Map<string, number>()
    checkIns.forEach(c => {
      if (c.customer_id) {
        customerCheckInCounts.set(c.customer_id, (customerCheckInCounts.get(c.customer_id) || 0) + 1)
      }
    })
    const repeatCustomers = [...customerCheckInCounts.values()].filter(count => count > 1).length

    // Busiest day of week
    const dayCounts = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
    checkIns.forEach(c => {
      const day = new Date(c.created_at).getDay()
      dayCounts[day]++
    })
    const maxDayCount = Math.max(...dayCounts)
    const busiestDayIndex = dayCounts.indexOf(maxDayCount)
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const busiestDay = maxDayCount > 0 ? dayNames[busiestDayIndex] : null

    // Recent activity (combined check-ins and inspections)
    const recentActivity = [
      ...checkIns.slice(0, 10).map(c => ({
        type: "check_in" as const,
        id: c.id,
        name: c.shop_customers ? `${c.shop_customers.first_name} ${c.shop_customers.last_name}` : "Unknown",
        vehicle: c.vehicles ? [c.vehicles.year, c.vehicles.make, c.vehicles.model].filter(Boolean).join(" ") : "No vehicle",
        created_at: c.created_at,
      })),
      ...inspections.slice(0, 10).map(i => ({
        type: "inspection" as const,
        id: i.id,
        name: i.customer_name || "Unknown",
        vehicle: [i.vehicle_year, i.vehicle_make, i.vehicle_model].filter(Boolean).join(" ") || "No vehicle",
        created_at: i.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)

    // Today's schedule
    const todaySchedule = workOrders.filter(wo => wo.due_date === today)
    const upcomingSchedule = workOrders.filter(wo => wo.due_date > today).slice(0, 5)

    return NextResponse.json({
      kpis: {
        todayCheckIns,
        weekCheckIns,
        totalCheckIns,
        totalCustomers,
        weekInspections,
        vehiclesServedThisMonth,
      },
      insights: {
        failureRate,
        avgPhotos,
        topMake: topMake ? { make: topMake[0], count: topMake[1] } : null,
        repeatCustomers,
        busiestDay,
      },
      recentActivity,
      todaySchedule,
      upcomingSchedule,
    })
  } catch (err) {
    console.error("Dashboard API error:", err)
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 })
  }
}
