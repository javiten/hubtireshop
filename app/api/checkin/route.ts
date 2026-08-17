import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

type PhotoMeta = {
  blob_url: string
  file_name: string
  content_type: string
  size_bytes: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_id,
      first_name,
      last_name,
      email,
      phone,
      // Vehicle - either select existing or create new
      vehicle_id,
      vin,
      year,
      make,
      model,
      trim: vehicleTrim,
      license_plate,
      mileage,
      notes,
      time_sensitivity,
      photos,
    } = body

    const supabase = getAnonClient()
    let finalCustomerId = customer_id

    // --- Customer ---
    if (!finalCustomerId) {
      if (!first_name || !last_name) {
        return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
      }

      const trimmedFirst = first_name.trim()
      const trimmedLast = last_name.trim()
      const trimmedEmail = email?.trim() || null
      const trimmedPhone = phone?.trim() || null

      // Try to insert; on duplicate, find the existing customer instead
      const { data: customer, error: customerError } = await supabase
        .from("shop_customers")
        .insert({
          first_name: trimmedFirst,
          last_name: trimmedLast,
          email: trimmedEmail,
          phone: trimmedPhone,
        })
        .select("id")
        .single()

      if (customerError) {
        if (customerError.code === "23505") {
          // Duplicate - find the existing customer by name
          const { data: existing } = await supabase
            .from("shop_customers")
            .select("id")
            .ilike("first_name", trimmedFirst)
            .ilike("last_name", trimmedLast)
            .limit(1)
            .single()

          if (existing) {
            finalCustomerId = existing.id
          } else {
            return NextResponse.json({ error: "Customer exists but could not be found. Please search and select from the list." }, { status: 409 })
          }
        } else {
          return NextResponse.json({ error: customerError.message }, { status: 500 })
        }
      } else {
        finalCustomerId = customer.id
      }
    }

    // Helper: treat empty strings & "N/A" as null
    const clean = (v: string | null | undefined): string | null => {
      const s = v?.trim()
      if (!s || s.toLowerCase() === "n/a") return null
      return s
    }

    // --- Vehicle ---
    let finalVehicleId = vehicle_id

    if (finalVehicleId) {
      // Existing vehicle selected - update mileage if provided
      if (mileage?.trim()) {
        await supabase
          .from("vehicles")
          .update({ mileage: mileage.trim() })
          .eq("id", finalVehicleId)
      }
    } else {
      // Create new vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
          customer_id: finalCustomerId,
          vin: clean(vin),
          year: clean(year),
          make: clean(make),
          model: clean(model),
          trim: clean(vehicleTrim),
          license_plate: clean(license_plate),
          mileage: clean(mileage),
        })
        .select("id")
        .single()

      if (vehicleError) {
        if (vehicleError.code === "23505") {
          if (vehicleError.message.includes("vin")) {
            return NextResponse.json({ error: "A vehicle with this VIN already exists.", field: "vin" }, { status: 409 })
          }
          if (vehicleError.message.includes("plate")) {
            return NextResponse.json({ error: "A vehicle with this license plate already exists.", field: "license_plate" }, { status: 409 })
          }
        }
        return NextResponse.json({ error: vehicleError.message }, { status: 500 })
      }

      finalVehicleId = vehicle.id
    }

    // --- Check-in ---
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .insert({
        customer_id: finalCustomerId,
        vehicle_id: finalVehicleId,
        mileage: clean(mileage),
        notes: clean(notes),
        time_sensitivity: time_sensitivity || null,
      })
      .select("id")
      .single()

    if (checkInError) {
      return NextResponse.json({ error: checkInError.message }, { status: 500 })
    }

    // --- Photos ---
    if (photos && Array.isArray(photos) && photos.length > 0) {
      const photoRecords = (photos as PhotoMeta[]).map((p) => ({
        check_in_id: checkIn.id,
        blob_url: p.blob_url,
        file_name: p.file_name,
        content_type: p.content_type,
        size_bytes: p.size_bytes,
      }))

      const { error: photoError } = await supabase
        .from("check_in_photos")
        .insert(photoRecords)

      if (photoError) {
        console.error("Photo insert error:", photoError)
      }
    }

    // --- Email notification (non-blocking) ---
    let emailWarning: string | null = null
    try {
      const emailRes = await fetch(new URL("/api/checkin/notify", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_in_id: checkIn.id,
          customer: { first_name, last_name, email, phone },
          vehicle: { year, make, model, trim: vehicleTrim, vin, license_plate },
          mileage,
          notes,
          time_sensitivity,
          photos: photos || [],
        }),
      })
      if (!emailRes.ok) {
        emailWarning = "Check-in saved, but email notification failed."
      }
    } catch {
      emailWarning = "Check-in saved, but email notification failed."
    }

    return NextResponse.json({
      success: true,
      check_in_id: checkIn.id,
      customer_id: finalCustomerId,
      vehicle_id: finalVehicleId,
      emailWarning,
    })
  } catch (error) {
    console.error("Checkin error:", error)
    return NextResponse.json({ error: "Failed to create check-in" }, { status: 500 })
  }
}
