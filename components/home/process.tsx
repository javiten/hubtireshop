import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"

const steps = [
  { n: "1", title: "Tell us what's up", body: "Call or request service online. Describe your vehicle and the issue." },
  { n: "2", title: "Get a clear estimate", body: "We inspect, diagnose, and give you an upfront price before any work." },
  { n: "3", title: "We fix it right", body: "Our technicians complete the repair using quality parts and proven methods." },
  { n: "4", title: "Back on the road", body: "Pick up your vehicle and keep moving with confidence." },
]

export function Process() {
  return (
    <section className="bg-brand-dark py-16 text-brand-dark-foreground md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
          <h2 className="mt-2 text-balance text-3xl font-bold md:text-4xl">Simple, Transparent Process</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <StaggerItem
              key={s.n}
              className="relative h-full rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-dark-muted">{s.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
