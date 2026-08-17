import type { Metadata } from "next"
import { PageShell } from "@/components/site/page-shell"
import { PageHero } from "@/components/site/page-hero"
import { CtaBand } from "@/components/site/cta-band"
import { FleetConsultationForm } from "@/components/site/fleet-consultation-form"
import { BreadcrumbJsonLd } from "@/components/site/structured-data"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Fleet Maintenance & Repair in Miami, FL",
  description:
    "Fleet maintenance and repair in Miami for small local fleets, contractors, delivery companies, rental fleets, and work vehicles. Preventive maintenance, tires, brakes, diagnostics, and diesel service with priority scheduling.",
  alternates: { canonical: "/fleet" },
}

// Who we serve.
const segments = [
  { title: "Small local fleets", body: "A few vehicles or a couple dozen — we scale service to your operation." },
  { title: "Contractors", body: "Keep your trucks and vans working so your crews stay on the job." },
  { title: "Delivery companies", body: "High-mileage vehicles kept road-ready to protect your routes and deadlines." },
  { title: "Rental fleets", body: "Consistent turnaround and upkeep so your vehicles are ready to rent." },
  { title: "Work vehicles", body: "Service trucks, utility vans, and specialty vehicles maintained under one roof." },
]

// What we offer fleets.
const capabilities = [
  { title: "Preventive maintenance", body: "Scheduled service plans that catch problems early and reduce costly breakdowns." },
  { title: "Tires", body: "Sales, mounting, balancing, rotation, and alignment to maximize tire life." },
  { title: "Brakes", body: "Inspections, pads, rotors, and full brake service to keep drivers safe." },
  { title: "Diagnostics", body: "Professional scan tools to pinpoint check-engine and drivability issues fast." },
  { title: "Diesel service", body: "Maintenance and repair for diesel vans, pickups, and trucks." },
  { title: "Priority scheduling", body: "Fleet accounts get priority booking to minimize vehicle downtime." },
  { title: "Digital estimates", body: "Clear, written estimates you can review and approve before work begins." },
  { title: "Vehicle service history", body: "We keep records for each vehicle so you always know what was done and when." },
  { title: "Local pickup & drop-off", body: "Pickup and drop-off available where possible to save your team time." },
]

export default function FleetPage() {
  return (
    <PageShell>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Fleet", path: "/fleet" }]} />
      <PageHero
        eyebrow="Fleet Services"
        title="Keep your fleet moving in Miami"
        subtitle="One local shop for the vehicles your business depends on — from a few vans to a full lineup of work trucks. Preventive maintenance, tires, brakes, diagnostics, and diesel service with priority scheduling."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#fleet-consultation"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Request a Fleet Consultation
          </a>
          <a
            href={siteConfig.phone.href}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Call {siteConfig.phone.display}
          </a>
        </div>
      </PageHero>

      {/* Who we serve */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Built for local businesses
          </h2>
          <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            If your business runs on its vehicles, downtime costs money. We help Miami businesses keep their fleets
            reliable, safe, and on the road.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {segments.map((s) => (
              <div key={s.title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="bg-brand-dark py-16 text-brand-dark-foreground md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Everything your fleet needs</h2>
          <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-brand-dark-muted">
            One shop, one point of contact, and complete records for every vehicle.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <div key={c.title} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-semibold text-brand-dark-foreground">{c.title}</h3>
                  <p className="mt-1 text-pretty text-sm leading-relaxed text-brand-dark-muted">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation form */}
      <section id="fleet-consultation" className="scroll-mt-24 bg-secondary py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Set up your fleet account
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Tell us about your vehicles and how you use them. We&apos;ll follow up to build a maintenance plan that
              fits your schedule and budget, so your team can stay focused on the work that matters.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Prefer to talk it through? Call us at{" "}
              <a href={siteConfig.phone.href} className="font-semibold text-primary">
                {siteConfig.phone.display}
              </a>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h3 className="text-xl font-bold text-foreground">Request a fleet consultation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This sends a request only &mdash; no appointment is confirmed until we follow up.
            </p>
            <div className="mt-6">
              <FleetConsultationForm />
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </PageShell>
  )
}
