import type { Metadata } from "next"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import { PageShell } from "@/components/site/page-shell"
import { PageHero } from "@/components/site/page-hero"
import { RequestServiceForm } from "@/components/site/request-service-form"
import { siteConfig } from "@/lib/site-config"
import { BreadcrumbJsonLd, LocalBusinessJsonLd } from "@/components/site/structured-data"

export const metadata: Metadata = {
  title: "Contact & Directions | Hub Tire Shop Miami",
  description:
    "Contact Hub Tire Shop in Miami, FL. Request service, get an estimate, or ask a question. Call (305) 615-6286. Open Monday–Saturday, 9 AM–6 PM.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <PageShell>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <LocalBusinessJsonLd />
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        subtitle="Have a question or ready to book? Send us a message and our team will get right back to you. We service all makes and models."
      />

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1fr_1.1fr] md:gap-16">
          {/* Shop info */}
          <div className="space-y-8">
            <a href={siteConfig.phone.href} className="group block">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Phone</span>
              </div>
              <p className="text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                {siteConfig.phone.display}
              </p>
            </a>

            <a href={`mailto:${siteConfig.email}`} className="group block">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
              </div>
              <p className="text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                {siteConfig.email}
              </p>
            </a>

            <a href={siteConfig.address.mapsUrl} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Location</span>
              </div>
              <p className="text-lg text-foreground transition-colors group-hover:text-primary">
                {siteConfig.address.street}
                <br />
                {siteConfig.address.city}, {siteConfig.address.state} {siteConfig.address.zip}
              </p>
            </a>

            <div>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Shop Hours</span>
              </div>
              <p className="text-lg text-foreground">
                {siteConfig.hours.weekdays}: {siteConfig.hours.weekdayTime}
                <br />
                {siteConfig.hours.weekend}: {siteConfig.hours.weekendTime}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title="Map to Hub Tire Shop"
                src="https://www.google.com/maps?q=20855+NE+16th+Ave+Suite+C27+Miami+FL+33179&output=embed"
                width="100%"
                height="240"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block"
              />
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-xl font-bold text-foreground">Request service</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us about your vehicle and we&apos;ll follow up shortly.
            </p>
            <div className="mt-6">
              <RequestServiceForm />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
