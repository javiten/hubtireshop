import { siteConfig } from "@/lib/site-config"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"

export function VehiclesWeService() {
  return (
    <section className="bg-brand-dark py-16 text-brand-dark-foreground md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">What We Service</p>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            One shop for every vehicle you drive
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-brand-dark-muted">
            From daily commuters to heavy-duty diesel and motorcycles, our technicians work on it all.
          </p>
        </Reveal>

        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-5" stagger={0.06}>
          {siteConfig.vehicleTypes.map((vehicle) => (
            <StaggerItem
              key={vehicle}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-white/10"
            >
              <span className="text-base font-semibold uppercase tracking-wide">{vehicle}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
