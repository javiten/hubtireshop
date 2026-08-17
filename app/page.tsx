import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Hero } from "@/components/home/hero"
import { TrustBar } from "@/components/home/trust-bar"
import { ServicesOverview } from "@/components/home/services-overview"
import { WhyChoose } from "@/components/home/why-choose"
import { VehiclesWeService } from "@/components/home/vehicles-we-service"
import { Process } from "@/components/home/process"
import { Reviews } from "@/components/site/reviews"
import { RequestSection } from "@/components/home/request-section"
import { CtaBand } from "@/components/site/cta-band"
import { LocalBusinessJsonLd, WebsiteJsonLd } from "@/components/site/structured-data"

export const metadata: Metadata = {
  title: "Full-Service Auto Repair & Tire Shop in Miami, FL",
  description:
    "Hub Tire Shop is a full-service auto repair and tire center in Miami, FL. We service cars, trucks, SUVs, diesel & motorcycles: oil changes, brakes, tires & alignment, A/C, diagnostics, suspension & more. Call (305) 615-6286.",
  alternates: { canonical: "/" },
}

export default function HomePage() {
  return (
    <>
      <LocalBusinessJsonLd />
      <WebsiteJsonLd />
      <SiteHeader />
      <main>
        <Hero />
        <TrustBar />
        <ServicesOverview />
        <WhyChoose />
        <VehiclesWeService />
        <Process />
        <Reviews />
        <RequestSection />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  )
}
