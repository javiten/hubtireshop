import { siteConfig } from "@/lib/site-config"
import { RequestServiceForm } from "@/components/site/request-service-form"

export function RequestSection() {
  return (
    <section id="request" className="bg-muted/40 py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Get started</p>
          <h2 className="mt-2 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Request Service or Call Us Today
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Fill out the form and we&apos;ll get back to you fast. Prefer to talk? Give us a call and we&apos;ll get your
            vehicle scheduled.
          </p>

          <dl className="mt-8 space-y-5">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PhoneIcon className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Call us</dt>
                <dd>
                  <a href={siteConfig.phone.href} className="text-lg font-semibold text-foreground hover:text-primary">
                    {siteConfig.phone.display}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPinIcon className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Visit us</dt>
                <dd>
                  <a
                    href={siteConfig.address.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    {siteConfig.address.full}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClockIcon className="h-5 w-5" />
              </span>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Hours</dt>
                <dd className="font-semibold text-foreground">
                  {siteConfig.hours.weekdays}: {siteConfig.hours.weekdayTime}
                  <span className="block font-normal text-muted-foreground">
                    {siteConfig.hours.weekend}: {siteConfig.hours.weekendTime}
                  </span>
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <RequestServiceForm />
        </div>
      </div>
    </section>
  )
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  )
}
function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  )
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}
