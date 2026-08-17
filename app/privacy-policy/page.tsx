import type { Metadata } from "next"
import Link from "next/link"
import { PageShell } from "@/components/site/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Hub Tire Shop, including how we handle phone numbers and SMS communications.",
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">Privacy Policy</h1>
        <p className="mb-10 text-xs text-muted-foreground">Last updated: June 9, 2026</p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <p>
            {siteConfig.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy
            Policy explains how we collect, use, and protect the information you provide when you contact us or use our
            services.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Information we collect</h2>
            <p>
              We collect information you voluntarily provide to us, such as your name, email address, phone number, and
              details about your vehicle or service request when you submit our contact form, book an appointment, or
              communicate with us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">How we use your information</h2>
            <p>
              We use your information to respond to your inquiries, schedule appointments, provide estimates, deliver
              repair updates and maintenance reminders, and offer customer support.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">SMS / text messaging</h2>
            <p>
              If you provide your phone number and opt in to SMS communications, we will use your phone number only to
              communicate with you about your service request, appointment, estimate, repair updates, maintenance
              reminders, and customer support. Message and data rates may apply, and message frequency may vary. You can
              reply STOP at any time to opt out of SMS messages, or reply HELP for assistance.
            </p>
            <p>
              We do not sell or share your phone number with third parties for marketing purposes. Mobile information
              will not be shared with third parties or affiliates for marketing or promotional purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Data sharing</h2>
            <p>
              We do not sell your personal information. We may share information with trusted service providers who help
              us operate our business, but only to the extent necessary and subject to confidentiality obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Contact us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at{" "}
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
