import type { Metadata } from "next"
import Link from "next/link"
import { PageShell } from "@/components/site/page-shell"
import { PageHero } from "@/components/site/page-hero"
import { ServiceCard } from "@/components/site/service-card"
import { CtaBand } from "@/components/site/cta-band"
import { services, siteConfig } from "@/lib/site-config"
import { BreadcrumbJsonLd } from "@/components/site/structured-data"
import { Stagger, StaggerItem } from "@/components/motion/motion-primitives"

export const metadata: Metadata = {
  title: "Auto Repair & Maintenance Services in Miami, FL",
  description:
    "Complete auto repair and maintenance services in Miami: oil changes, brakes, tires & alignment, A/C, diagnostics, suspension, engine, and transmission. Cars, trucks, SUVs, diesel & motorcycles.",
  alternates: { canonical: "/services" },
}

export default function ServicesPage() {
  return (
    <PageShell>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]} />
      <PageHero
        eyebrow="Our Services"
        title="Full-service auto repair & maintenance"
        subtitle="One shop for everything your vehicle needs — from routine maintenance to complex repairs, for every type of vehicle on the road."
      />

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <StaggerItem key={service.slug} className="h-full">
                <ServiceCard service={service} />
              </StaggerItem>
            ))}
          </Stagger>

          <p className="mx-auto mt-12 max-w-2xl text-pretty text-center leading-relaxed text-muted-foreground">
            {"Don't see what you need? We handle far more than the services listed above. "}
            <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
              Contact us
            </Link>{" "}
            or call{" "}
            <a href={siteConfig.phone.href} className="font-semibold text-primary underline-offset-4 hover:underline">
              {siteConfig.phone.display}
            </a>
            .
          </p>
        </div>
      </section>

      <CtaBand />
    </PageShell>
  )
}
