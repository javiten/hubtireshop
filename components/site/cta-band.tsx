import Link from "next/link"
import { siteConfig } from "@/lib/site-config"
import { Reveal } from "@/components/motion/motion-primitives"

export function CtaBand({
  title = "Ready to keep moving?",
  subtitle = "Call now or request service online. Same-day appointments available for most repairs.",
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <section className="bg-primary">
      <Reveal className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-12 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <h2 className="text-balance text-2xl font-bold text-primary-foreground md:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-pretty text-primary-foreground/90">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={siteConfig.phone.href}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark-foreground transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            Call {siteConfig.phone.display}
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-primary-foreground/70 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-foreground/10 active:scale-[0.98]"
          >
            Request Service
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
