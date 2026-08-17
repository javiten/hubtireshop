"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"

// Smooth, fast page transitions between public pages.
// Admin routes are passed through untouched (no wrapper, no animation).
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()

  if (pathname?.startsWith("/admin") || reduce) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
