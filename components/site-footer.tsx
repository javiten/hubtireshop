import Link from "next/link"
import Image from "next/image"
import { footerNav, siteConfig } from "@/lib/site-config"

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-brand-dark text-brand-dark-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand + contact */}
          <div className="lg:col-span-2">
            <Image
              src="/images/hub-20tire-20shop-20logo-20rectangle-20rounded.png"
              alt={siteConfig.name}
              width={170}
              height={54}
              className="h-11 w-auto"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-dark-muted">
              {siteConfig.description} Serving {siteConfig.vehicleTypes.join(", ")}.
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <a href={siteConfig.phone.href} className="flex items-center gap-2 hover:text-primary">
                <span className="text-primary">Call:</span> {siteConfig.phone.display}
              </a>
              <a
                href={siteConfig.address.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-primary"
              >
                <span className="text-primary">Visit:</span> {siteConfig.address.full}
              </a>
              <p className="flex flex-col gap-0.5 pt-1 text-brand-dark-muted">
                <span>
                  {siteConfig.hours.weekdays}: {siteConfig.hours.weekdayTime}
                </span>
                <span>
                  {siteConfig.hours.weekend}: {siteConfig.hours.weekendTime}
                </span>
              </p>
            </div>
          </div>

          {/* Link columns */}
          {footerNav.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-dark-muted transition-colors hover:text-brand-dark-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-brand-dark-muted sm:flex-row">
          <p>
            &copy; {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <p>{siteConfig.address.city}, {siteConfig.address.state} &middot; Full-Service Auto Repair &amp; Tires</p>
        </div>
      </div>
    </footer>
  )
}
