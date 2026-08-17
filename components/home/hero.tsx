import Link from "next/link"
import Image from "next/image"
import { siteConfig } from "@/lib/site-config"
import { Reveal, ParallaxLayer } from "@/components/motion/motion-primitives"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-dark text-brand-dark-foreground">
      {/* Background image with gentle scroll parallax */}
      <ParallaxLayer className="absolute inset-0" amount={60}>
        <Image
          src="/images/hero-shop-interior.png"
          alt="Inside the Hub Tire Shop service bay in Miami with vehicles on lifts"
          fill
          priority
          className="scale-110 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-brand-dark/50" />
      </ParallaxLayer>

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24 lg:py-28">
        <Reveal className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {siteConfig.address.city}, {siteConfig.address.state} &middot; Full-Service Auto Repair
          </p>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-tight md:text-6xl">
            More Than Tires. <span className="text-primary">Complete Auto Care</span> That Keeps You Moving.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-brand-dark-muted">
            Trusted repair, maintenance, and tire service for cars, trucks, SUVs, diesel, and motorcycles in Miami.
            Honest work, fast turnaround, and expert technicians.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={siteConfig.phone.href}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              Call {siteConfig.phone.display}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md border border-white/25 px-6 py-3.5 text-base font-semibold text-brand-dark-foreground transition-colors duration-200 hover:bg-white/10 active:scale-[0.98]"
            >
              Request Service
            </Link>
          </div>

          {/* Vehicle types */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-brand-dark-muted">
            {siteConfig.vehicleTypes.map((type) => (
              <span key={type} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {type}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
