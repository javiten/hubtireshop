import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LocalLanding } from "@/components/templates/local-landing"
import { serviceAreas } from "@/lib/site-config"

const area = serviceAreas.find((a) => a.slug === "north-miami-beach")

export const metadata: Metadata = {
  title: "Auto Repair & Tires in North Miami Beach, FL",
  description:
    "Full-service auto repair and tire shop serving North Miami Beach, FL. Oil changes, brakes, tires, alignment, A/C, and diagnostics for cars, trucks, SUVs, diesel & motorcycles. Call (305) 615-6286.",
  alternates: { canonical: "/service-area/north-miami-beach" },
}

export default function NorthMiamiBeachPage() {
  if (!area) notFound()
  return <LocalLanding area={area} />
}
