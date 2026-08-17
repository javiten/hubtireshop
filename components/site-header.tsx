"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { m, LazyMotion, domAnimation, useReducedMotion } from "framer-motion"
import { mainNav, siteConfig } from "@/lib/site-config"

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors ${
        scrolled ? "border-border bg-background/95 backdrop-blur" : "border-transparent bg-background"
      }`}
    >
      {/* Mobile click-to-call strip - keeps the phone number above the fold */}
      <a
        href={siteConfig.phone.href}
        className="flex items-center justify-center gap-2 bg-brand-dark py-2 text-sm font-semibold text-brand-dark-foreground md:hidden"
        aria-label={`Call us at ${siteConfig.phone.display}`}
      >
        <PhoneIcon className="h-4 w-4 text-primary" />
        Call {siteConfig.phone.display}
      </a>

      {/* Top utility bar */}
      <div className="hidden bg-brand-dark text-brand-dark-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
          <p className="flex items-center gap-2">
            <MapPinIcon className="h-3.5 w-3.5 text-primary" />
            {siteConfig.address.full}
          </p>
          <p className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5 text-primary" />
              {siteConfig.hours.weekdays}: {siteConfig.hours.weekdayTime}
            </span>
            <span className="text-brand-dark-muted">|</span>
            <span>
              {siteConfig.hours.weekend}: {siteConfig.hours.weekendTime}
            </span>
          </p>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${siteConfig.name} home`}>
          <Image
            src="/images/hub-20tire-20shop-20logo-20rectangle-20rounded.png"
            alt={siteConfig.name}
            width={150}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <LazyMotion features={domAnimation}>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {mainNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                  {/* Hover underline (grows from center) */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-primary/40 transition-transform duration-200 ease-out group-hover:scale-x-100"
                  />
                  {/* Active indicator (slides between items) */}
                  {active && (
                    <m.span
                      aria-hidden
                      layoutId="nav-active-indicator"
                      className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary"
                      transition={
                        reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }
                      }
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </LazyMotion>

        <div className="flex items-center gap-2">
          <a
            href={siteConfig.phone.href}
            className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary sm:flex"
          >
            <PhoneIcon className="h-4 w-4 text-primary" />
            {siteConfig.phone.display}
          </a>
          <Link
            href="/contact"
            className="hidden rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
          >
            Request Service
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3" aria-label="Mobile">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <a
                href={siteConfig.phone.href}
                className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-semibold"
              >
                <PhoneIcon className="h-4 w-4 text-primary" />
                {siteConfig.phone.display}
              </a>
              <Link
                href="/contact"
                className="rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Request Service
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
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
function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
