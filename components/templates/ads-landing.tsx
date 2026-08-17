import Image from "next/image"
import Link from "next/link"
import { siteConfig } from "@/lib/site-config"
import type { LandingContent } from "@/lib/landing-content"
import { ServiceIcon } from "@/components/site/service-icon"
import { LeadForm } from "@/components/site/lead-form"
import { LocalBusinessJsonLd } from "@/components/site/structured-data"

const smsHref = `sms:+13056156286`

function CallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  )
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
      />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
    </svg>
  )
}

export function AdsLanding({
  content,
  formSlot,
}: {
  content: LandingContent
  formSlot?: React.ReactNode
}) {
  const {
    icon,
    eyebrow,
    headline,
    subhead,
    symptoms,
    serviceIntro,
    servicePoints,
    formHeading,
    formService,
  } = content

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LocalBusinessJsonLd />

      {/* Minimal nav: logo + click-to-call */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label={`${siteConfig.name} home`}>
            <Image
              src="/images/hub-20tire-20shop-20logo-20rectangle-20rounded.png"
              alt={siteConfig.name}
              width={150}
              height={44}
              className="h-9 w-auto md:h-10"
              priority
            />
          </Link>
          <a
            href={siteConfig.phone.href}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CallIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{siteConfig.phone.display}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-0">
        {/* Hero */}
        <section className="bg-brand-dark text-brand-dark-foreground">
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
              <ServiceIcon name={icon} className="h-5 w-5" />
              {eyebrow}
            </div>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-tight md:text-5xl">{headline}</h1>
            <p className="mt-4 max-w-2xl text-pretty text-lg text-brand-dark-muted">{subhead}</p>

            {/* Phone above the fold */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={siteConfig.phone.href}
                className="inline-flex items-center justify-center gap-3 rounded-lg bg-primary px-6 py-4 text-xl font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <CallIcon className="h-6 w-6" />
                {siteConfig.phone.display}
              </a>
              <div className="flex gap-3">
                <a
                  href={smsHref}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:flex-none"
                >
                  <TextIcon className="h-5 w-5" />
                  Text Us
                </a>
                <a
                  href="#request"
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/25 px-5 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:flex-none"
                >
                  Request Service
                </a>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CheckIcon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold">ASE-Certified Technicians</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                <span className="flex items-center text-primary" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                </span>
                <span className="text-sm font-semibold">Highly Rated on Google</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold">
                  {siteConfig.hours.weekdays}
                  <br className="hidden sm:block" /> {siteConfig.hours.weekdayTime}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Symptoms + Service details + Form */}
        <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-10">
              {/* Symptoms */}
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">Common Signs You Need Service</h2>
                <ul className="mt-5 space-y-3">
                  {symptoms.map((s) => (
                    <li key={s} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckIcon className="h-4 w-4" />
                      </span>
                      <span className="text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Service details */}
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">What We Do</h2>
                <p className="mt-4 text-pretty text-muted-foreground">{serviceIntro}</p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {servicePoints.map((p) => (
                    <li key={p} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckIcon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-foreground">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Form */}
            <div id="request" className="scroll-mt-24">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <h2 className="text-2xl font-bold text-foreground">{formHeading}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Send a quick request and we&apos;ll get right back to you. Prefer to talk now? Call{" "}
                  <a href={siteConfig.phone.href} className="font-semibold text-primary">
                    {siteConfig.phone.display}
                  </a>
                  .
                </p>
                <div className="mt-6">{formSlot ?? <LeadForm serviceLabel={formService} />}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Address & directions */}
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">Visit Our Miami Shop</h2>
                <address className="mt-4 not-italic text-muted-foreground">
                  <div className="font-semibold text-foreground">{siteConfig.name}</div>
                  <div>{siteConfig.address.street}</div>
                  <div>
                    {siteConfig.address.city}, {siteConfig.address.state} {siteConfig.address.zip}
                  </div>
                </address>
                <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <dt className="font-semibold text-foreground">Phone:</dt>
                    <dd>
                      <a href={siteConfig.phone.href} className="text-primary hover:underline">
                        {siteConfig.phone.display}
                      </a>
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-semibold text-foreground">Hours:</dt>
                    <dd>
                      {siteConfig.hours.weekdays} {siteConfig.hours.weekdayTime} · {siteConfig.hours.weekend}{" "}
                      {siteConfig.hours.weekendTime}
                    </dd>
                  </div>
                </dl>
                <a
                  href={siteConfig.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                    />
                  </svg>
                  Get Directions
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <iframe
                  title={`Map to ${siteConfig.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(siteConfig.address.full)}&output=embed`}
                  className="h-64 w-full md:h-80"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Minimal footer */}
        <footer className="border-t border-border bg-background">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} {siteConfig.legalName}
            </p>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Sticky mobile conversion bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-px border-t border-border bg-border md:hidden">
        <a
          href={siteConfig.phone.href}
          className="flex items-center justify-center gap-2 bg-primary py-3.5 text-sm font-bold text-primary-foreground"
        >
          <CallIcon className="h-5 w-5" />
          Call Now
        </a>
        <a
          href={smsHref}
          className="flex items-center justify-center gap-2 bg-brand-dark py-3.5 text-sm font-bold text-brand-dark-foreground"
        >
          <TextIcon className="h-5 w-5" />
          Text Us
        </a>
      </div>
    </div>
  )
}
