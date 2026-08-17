import type { Metadata } from "next"
import Link from "next/link"
import { PageShell } from "@/components/site/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms & Conditions for Hub Tire Shop, including SMS messaging terms.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">Terms &amp; Conditions</h1>
        <p className="mb-10 text-xs text-muted-foreground">Last updated: June 9, 2026</p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <p>
            These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of services provided by {siteConfig.name}
            {" "}(&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By contacting us or using our services, you agree
            to these Terms.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Services</h2>
            <p>
              {siteConfig.name} provides automotive repair, maintenance, tire, and related services. Estimates are
              provided in good faith and may be subject to change based on inspection findings and parts availability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">SMS messaging terms</h2>
            <p>
              By opting in to SMS messages, you agree to receive text messages from {siteConfig.name} regarding
              appointments, estimates, repair updates, maintenance reminders, and customer support. Message and data
              rates may apply. Message frequency may vary.
            </p>
            <p>
              You can opt out of SMS messages at any time by replying STOP. For help, reply HELP or contact us directly.
              Opting out of SMS will not affect your ability to receive service through other communication channels.
            </p>
            <p>
              Carriers are not liable for delayed or undelivered messages. We do not sell or share your phone number
              with third parties for marketing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, {siteConfig.name} shall not be liable for any indirect,
              incidental, or consequential damages arising from the use of our services or website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Contact us</h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href={`mailto:${siteConfig.email}`} className="font-medium text-primary underline underline-offset-2">
                {siteConfig.email}
              </a>{" "}
              or call{" "}
              <a href={siteConfig.phone.href} className="font-medium text-primary underline underline-offset-2">
                {siteConfig.phone.display}
              </a>
              . {siteConfig.name}, {siteConfig.address.full}.
            </p>
          </section>

          <div className="pt-4">
            <Link href="/contact" className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-80">
              &larr; Back to contact
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  )
}
