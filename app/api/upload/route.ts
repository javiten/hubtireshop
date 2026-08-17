import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 30 days in milliseconds
const EXPIRATION_DAYS = 30
const EXPIRATION_MS = EXPIRATION_DAYS * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const relatedType = (formData.get("related_type") as string) || "check_in"
    const relatedId = formData.get("related_id") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const path = `checkin-photos/${timestamp}-${safeName}`

    const blob = await put(path, file, { access: "public" })

    // Track the uploaded image with 30-day expiration
    const expiresAt = new Date(Date.now() + EXPIRATION_MS).toISOString()
    await supabase.from("uploaded_images").insert({
      related_type: relatedType,
      related_id: relatedId || null,
      blob_url: blob.url,
      blob_pathname: path,
      file_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
      expires_at: expiresAt,
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
