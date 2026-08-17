import Link from "next/link"
import { services } from "@/lib/site-config"
import { ServiceCard } from "@/components/site/service-card"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"

export function ServicesOverview() {
  return (
    <section className="bg-muted/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">What we do</p>
          <h2 className="mt-2 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Complete Service Under One Roof
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            From routine maintenance to complex repairs and diagnostics, our technicians handle it all so you can get
            back on the road with confidence.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <StaggerItem key={service.slug} className="h-full">
              <ServiceCard service={service} />
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-10 text-center">
          <Link
            href="/services"
            className="inline-flex items-center justify-center rounded-md bg-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark-foreground transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            View All Services
          </Link>
        </div>
      </div>
    </section>
  )
}
