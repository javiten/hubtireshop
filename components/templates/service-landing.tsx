import Link from "next/link"
import { PageShell } from "@/components/site/page-shell"
import { PageHero } from "@/components/site/page-hero"
import { CtaBand } from "@/components/site/cta-band"
import { RequestServiceForm } from "@/components/site/request-service-form"
import { ServiceIcon } from "@/components/site/service-icon"
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/site/structured-data"
import { FaqAccordion } from "@/components/site/faq-accordion"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"
import { siteConfig } from "@/lib/site-config"

export type ServiceFaq = { q: string; a: string }

export type ServiceCoverage = {
  heading: string
  intro?: string
  groups: { label: string; body: string }[]
}

export type ServiceLandingConfig = {
  slug: string
  icon: string
  eyebrow: string
  title: string
  subtitle: string
  intro: string
  benefits: { title: string; body: string }[]
  process: { step: string; title: string; body: string }[]
  faqs: ServiceFaq[]
  metaTitle: string
  /** Optional strong CTA button shown in the hero (anchors to the request form). */
  heroCta?: string
  /** Optional capability grid (e.g. what our diagnostics cover). */
  capabilities?: { heading: string; items: { title: string; body: string }[] }
  /** Optional vehicle-coverage block (American / Asian / European, older & late-model). */
  coverage?: ServiceCoverage
}

export function ServiceLanding({
  config,
  formSlot,
  formTitle = "Request this service",
  formSubtitle = "Tell us about your vehicle and we'll get right back to you.",
}: {
  config: ServiceLandingConfig
  formSlot?: React.ReactNode
  formTitle?: string
  formSubtitle?: string
}) {
  return (
    <PageShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: config.eyebrow, path: `/services/${config.slug}` },
        ]}
      />
      <ServiceJsonLd name={config.metaTitle} description={config.subtitle} />

      <PageHero eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle}>
        <div className="mt-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ServiceIcon name={config.icon} className="h-7 w-7" />
        </div>
        {config.heroCta && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#request"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {config.heroCta}
            </Link>
            <a
              href={siteConfig.phone.href}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Call {siteConfig.phone.display}
            </a>
          </div>
        )}
      </PageHero>

      {/* Intro + benefits */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{config.intro}</p>
          </div>

          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {config.benefits.map((b) => (
              <StaggerItem
                key={b.title}
                className="h-full rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <h3 className="text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{b.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Capabilities (optional) */}
      {config.capabilities && (
        <section className="border-t border-border py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {config.capabilities.heading}
              </h2>
            </Reveal>
            <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {config.capabilities.items.map((item) => (
                <StaggerItem
                  key={item.title}
                  className="flex h-full gap-4 rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* Vehicle coverage (optional) */}
      {config.coverage && (
        <section className="bg-brand-dark py-16 text-brand-dark-foreground md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{config.coverage.heading}</h2>
              {config.coverage.intro && (
                <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-brand-dark-muted">
                  {config.coverage.intro}
                </p>
              )}
            </Reveal>
            <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
              {config.coverage.groups.map((g) => (
                <StaggerItem
                  key={g.label}
                  className="h-full rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-white/10"
                >
                  <h3 className="text-lg font-semibold text-primary">{g.label}</h3>
                  <p className="mt-2 text-pretty leading-relaxed text-brand-dark-muted">{g.body}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* Process */}
      <section className="bg-secondary py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              How it works
            </h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
            {config.process.map((p) => (
              <StaggerItem
                key={p.step}
                className="relative h-full rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="text-3xl font-bold text-primary">{p.step}</span>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{p.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* FAQ + form */}
      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <Reveal direction="right">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Frequently asked questions
            </h2>
            <FaqAccordion faqs={config.faqs} />
            <p className="mt-6 text-muted-foreground">
              Still have questions?{" "}
              <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
                Contact us
              </Link>{" "}
              or call{" "}
              <a href={siteConfig.phone.href} className="font-semibold text-primary underline-offset-4 hover:underline">
                {siteConfig.phone.display}
              </a>
              .
            </p>
          </Reveal>

          <Reveal
            direction="left"
            id="request"
            className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 md:p-8"
          >
            <h2 className="text-xl font-bold text-foreground">{formTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{formSubtitle}</p>
            <div className="mt-6">{formSlot ?? <RequestServiceForm defaultService={config.eyebrow} />}</div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </PageShell>
  )
}
