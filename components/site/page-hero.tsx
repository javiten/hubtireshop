import Link from "next/link"
import { Reveal } from "@/components/motion/motion-primitives"

type Crumb = { name: string; href: string }

export function PageHero({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  breadcrumbs?: Crumb[]
  children?: React.ReactNode
}) {
  return (
    <section className="border-b border-white/10 bg-brand-dark text-brand-dark-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-brand-dark-muted">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden>/</span>}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-brand-dark-foreground">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors hover:text-primary">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <Reveal>
          {eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>}
          <h1 className="max-w-3xl text-balance text-3xl font-bold md:text-5xl">{title}</h1>
          {subtitle && (
            <p className="mt-4 max-w-2xl text-pretty text-base text-brand-dark-muted md:text-lg">{subtitle}</p>
          )}
          {children}
        </Reveal>
      </div>
    </section>
  )
}
