import { del } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Batch size for processing
const BATCH_SIZE = 50

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()

    // Find expired images that haven't been deleted yet
    const { data: expiredImages, error: fetchError } = await supabase
      .from("uploaded_images")
      .select("id, blob_url, blob_pathname")
      .eq("delete_status", "active")
      .lte("expires_at", now)
      .limit(BATCH_SIZE)

    if (fetchError) {
      console.error("Error fetching expired images:", fetchError)
      return NextResponse.json({ error: "Failed to fetch expired images" }, { status: 500 })
    }

    if (!expiredImages || expiredImages.length === 0) {
      return NextResponse.json({ message: "No expired images to clean up", deleted: 0 })
    }

    let deletedCount = 0
    let failedCount = 0

    for (const image of expiredImages) {
      try {
        // Delete from Vercel Blob
        await del(image.blob_url)

        // Mark as deleted in database
        await supabase
          .from("uploaded_images")
          .update({ delete_status: "deleted", deleted_at: now })
          .eq("id", image.id)

        deletedCount++
      } catch (deleteError) {
        console.error(`Failed to delete image ${image.id}:`, deleteError)

        // Mark as failed so we can retry later or investigate
        await supabase
          .from("uploaded_images")
          .update({ delete_status: "failed" })
          .eq("id", image.id)

        failedCount++
      }
    }

    // Also clean up orphaned photo records from check_in_photos and inspection_photos
    // that reference deleted blob URLs
    const deletedUrls = expiredImages
      .filter((_, i) => i < deletedCount)
      .map((img) => img.blob_url)

    if (deletedUrls.length > 0) {
      await supabase
        .from("check_in_photos")
        .delete()
        .in("blob_url", deletedUrls)

      await supabase
        .from("inspection_photos")
        .delete()
        .in("blob_url", deletedUrls)
    }

    return NextResponse.json({
      message: "Cleanup completed",
      deleted: deletedCount,
      failed: failedCount,
      remaining: expiredImages.length - deletedCount - failedCount,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
