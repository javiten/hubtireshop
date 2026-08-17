import type { ReactNode } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MobileActionBar } from "@/components/site/mobile-action-bar"

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Spacer so the fixed mobile bar never covers footer content */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <MobileActionBar />
    </div>
  )
}
