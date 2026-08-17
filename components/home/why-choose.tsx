import Image from "next/image"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"

const reasons = [
  {
    title: "One shop for every vehicle",
    body: "Diesel, trucks, cars, SUVs, and motorcycles. Skip juggling multiple shops for the vehicles you rely on.",
  },
  {
    title: "Straightforward estimates",
    body: "We explain what your vehicle needs and what it costs before we start. No surprise add-ons.",
  },
  {
    title: "Quality parts & workmanship",
    body: "We use quality parts and stand behind our work so your repairs last.",
  },
  {
    title: "Fast, local, and reliable",
    body: "Conveniently located in Miami with same-day service on most maintenance and repairs.",
  },
]

export function WhyChoose() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2">
        <Reveal direction="right" className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="/images/shop-storefront.png"
            alt="Hub Tire Shop storefront in Miami with open service bays and a car parked out front"
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Reveal>
        <Reveal direction="left">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Why Hub Tire Shop</p>
          <h2 className="mt-2 text-balance text-3xl font-bold text-foreground md:text-4xl">
            The Auto Shop Miami Drivers Trust
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            We started as a tire shop, but our customers kept asking for more. Today we&apos;re a full-service repair
            center focused on honest work and keeping you moving.
          </p>
          <Stagger className="mt-8 grid gap-6 sm:grid-cols-2">
            {reasons.map((r) => (
              <StaggerItem key={r.title} className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{r.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
      </div>
    </section>
  )
}
