import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { del } from "@vercel/blob"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// PATCH — update check-in, vehicle, or customer fields
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

  // Update check-in fields
  if (body.checkin) {
    const { error } = await supabase
      .from("check_ins")
      .update(body.checkin)
      .eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update vehicle fields
  if (body.vehicle && body.vehicle_id) {
    const { error } = await supabase
      .from("vehicles")
      .update(body.vehicle)
      .eq("id", body.vehicle_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update customer fields
  if (body.customer && body.customer_id) {
    const { error } = await supabase
      .from("shop_customers")
      .update(body.customer)
      .eq("id", body.customer_id)
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
  }

  return NextResponse.json({ success: true })
}

// DELETE — delete check-in and clean up photos from blob storage
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

  // Get photos to delete from blob storage
  const { data: photos } = await supabase
    .from("check_in_photos")
    .select("blob_url")
    .eq("check_in_id", id)

  // Delete photos from blob storage (non-blocking)
  if (photos && photos.length > 0) {
    for (const photo of photos) {
      try {
        await del(photo.blob_url)
      } catch (err) {
        console.error("Failed to delete blob:", photo.blob_url, err)
      }
    }
  }

  // Delete check-in (cascades to check_in_photos)
  const { error } = await supabase
    .from("check_ins")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
