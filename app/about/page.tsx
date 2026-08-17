import type { Metadata } from "next"
import Image from "next/image"
import { PageShell } from "@/components/site/page-shell"
import { PageHero } from "@/components/site/page-hero"
import { CtaBand } from "@/components/site/cta-band"
import { siteConfig } from "@/lib/site-config"
import { BreadcrumbJsonLd } from "@/components/site/structured-data"

export const metadata: Metadata = {
  title: "About Hub Tire Shop | Miami Auto Repair",
  description:
    "Learn about Hub Tire Shop, a full-service auto repair and tire center in Miami, FL serving cars, trucks, SUVs, diesel, and motorcycles with honest, expert service.",
  alternates: { canonical: "/about" },
}

const values = [
  { title: "Honest work", body: "Straightforward estimates and clear explanations — we fix what needs fixing and tell you why." },
  { title: "Every vehicle", body: "Cars, trucks, SUVs, diesel, and motorcycles. If you drive it, we can service it." },
  { title: "Quality parts", body: "We use quality parts and manufacturer-recommended fluids to keep your vehicle running its best." },
  { title: "Local & trusted", body: "A neighborhood shop in Miami built on repeat customers and word of mouth." },
]

export default function AboutPage() {
  return (
    <PageShell>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <PageHero
        eyebrow="About Us"
        title="Miami's full-service auto repair shop"
        subtitle="More than a tire shop — a complete automotive care center your neighbors trust to keep them moving."
      />

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
            <Image
              src="/images/hero-shop.png"
              alt="Inside the Hub Tire Shop service bay in Miami"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Keep moving with a shop that does it all
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              {siteConfig.name} started with tires — but our customers kept asking for more. Today we&apos;re a
              full-service auto repair center handling everything from oil changes and brakes to diagnostics,
              suspension, A/C, engine, and transmission work.
            </p>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Our technicians work on cars, trucks, SUVs, diesel vehicles, and motorcycles. Whatever you drive, our goal
              is the same: honest service, quality parts, and getting you safely back on the road.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            What we stand for
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground">{v.title}</h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </PageShell>
  )
}
