import Link from "next/link"
import { PageShell } from "@/components/site/page-shell"
import { PageHero } from "@/components/site/page-hero"
import { ServiceCard } from "@/components/site/service-card"
import { CtaBand } from "@/components/site/cta-band"
import { RequestServiceForm } from "@/components/site/request-service-form"
import { BreadcrumbJsonLd } from "@/components/site/structured-data"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"
import { services, siteConfig, type ServiceArea } from "@/lib/site-config"

export function LocalLanding({ area }: { area: ServiceArea }) {
  // Feature the six most common services on local pages.
  const featured = services.slice(0, 6)

  return (
    <PageShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Service Area", path: "/service-area" },
          { name: area.name, path: `/service-area/${area.slug}` },
        ]}
      />

      <PageHero eyebrow="Service Area" title={area.headline} subtitle={area.intro} />

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Auto repair &amp; tire services near {area.name}
            </h2>
            <p className="mt-4 max-w-3xl text-pretty leading-relaxed text-muted-foreground">
              {siteConfig.name} proudly serves drivers in and around {area.name}. Our full-service shop handles cars,
              trucks, SUVs, diesel vehicles, and motorcycles — so whatever you drive near{" "}
              {area.neighborhoods.slice(0, 3).join(", ")}, we can keep it moving.
            </p>
          </Reveal>

          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((service) => (
              <StaggerItem key={service.slug} className="h-full">
                <ServiceCard service={service} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="bg-secondary py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <Reveal direction="right">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Convenient for {area.name} drivers
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              We&apos;re located at {siteConfig.address.full}, a short drive from {area.name}. Call us at{" "}
              <a href={siteConfig.phone.href} className="font-semibold text-primary underline-offset-4 hover:underline">
                {siteConfig.phone.display}
              </a>{" "}
              or request service online and we&apos;ll get you scheduled.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Neighborhoods we serve near {area.name}: {area.neighborhoods.join(", ")}.
            </p>
            <p className="mt-6">
              <Link href="/services" className="font-semibold text-primary underline-offset-4 hover:underline">
                View all services
              </Link>
            </p>
          </Reveal>
          <Reveal direction="left" className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h3 className="text-xl font-bold text-foreground">Request service in {area.name}</h3>
            <div className="mt-6">
              <RequestServiceForm />
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </PageShell>
  )
}
