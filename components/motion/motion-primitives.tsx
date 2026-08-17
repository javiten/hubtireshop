"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  motion,
  useReducedMotion,
  useInView,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  animate,
  type Variants,
} from "framer-motion"

// Shared premium easing + fast, restrained timing.
const EASE = [0.22, 1, 0.36, 1] as const
const DURATION = 0.5

type Direction = "up" | "down" | "left" | "right" | "none"

function offset(direction: Direction, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance }
    case "down":
      return { y: -distance }
    case "left":
      return { x: distance }
    case "right":
      return { x: -distance }
    default:
      return {}
  }
}

/**
 * Reveal — fades and gently slides its children into view on scroll.
 * Falls back to a plain, static element when the user prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  direction = "up",
  distance = 24,
  delay = 0,
  once = true,
  id,
}: {
  children: ReactNode
  className?: string
  direction?: Direction
  distance?: number
  delay?: number
  once?: boolean
  id?: string
}) {
  const reduce = useReducedMotion()

  if (reduce)
    return (
      <div id={id} className={className}>
        {children}
      </div>
    )

  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, ...offset(direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "0px 0px -12% 0px" }}
      transition={{ duration: DURATION, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger — orchestrates a staggered reveal for its StaggerItem children.
 * Use for grids of cards, review tiles, and trust badges.
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  once = true,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  once?: boolean
}) {
  const reduce = useReducedMotion()

  if (reduce) return <div className={className}>{children}</div>

  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  direction = "up",
  distance = 18,
}: {
  children: ReactNode
  className?: string
  direction?: Direction
  distance?: number
}) {
  const reduce = useReducedMotion()

  if (reduce) return <div className={className}>{children}</div>

  const variants: Variants = {
    hidden: { opacity: 0, ...offset(direction, distance) },
    show: { opacity: 1, x: 0, y: 0, transition: { duration: DURATION, ease: EASE } },
  }

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}

/**
 * CountUp — animates a number from 0 to `value` once it scrolls into view.
 * Intended for verified metrics only. Respects reduced-motion (shows final value).
 */
export function CountUp({
  value,
  duration = 1.4,
  className,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  value: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
  decimals?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value, duration, reduce])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/**
 * ParallaxLayer — very subtle scroll-linked vertical drift for decorative
 * backgrounds (e.g. the hero image). GPU-only transform; disabled for
 * reduced-motion users.
 */
export function ParallaxLayer({
  children,
  className,
  amount = 40,
}: {
  children: ReactNode
  className?: string
  amount?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const rawY = useTransform(scrollYProgress, [0, 1], [0, amount])
  const y = useSpring(rawY, { stiffness: 120, damping: 30, mass: 0.2 })

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  )
}

// Re-export a shared spring-based hover value helper for bespoke use if needed.
export { useMotionValue }
