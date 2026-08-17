import type { Metadata } from "next"
import { PageShell } from "@/components/site/page-shell"
import { PageHero } from "@/components/site/page-hero"
import { Reviews } from "@/components/site/reviews"
import { CtaBand } from "@/components/site/cta-band"
import { BreadcrumbJsonLd } from "@/components/site/structured-data"

export const metadata: Metadata = {
  title: "Customer Reviews | Hub Tire Shop Miami",
  description:
    "Read reviews for Hub Tire Shop in Miami, FL and share your own experience. Full-service auto repair and tires for cars, trucks, SUVs, diesel, and motorcycles.",
  alternates: { canonical: "/reviews" },
}

export default function ReviewsPage() {
  return (
    <PageShell>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Reviews", path: "/reviews" }]} />
      <PageHero
        eyebrow="Real Google Reviews"
        title="What our customers say"
        subtitle="We're proud of the trust our Miami customers place in us. Here are real, verified reviews from Google."
      />
      <Reviews showHeading={false} />
      <CtaBand />
    </PageShell>
  )
}
