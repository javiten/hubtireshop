"use client"

import { useState } from "react"
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion"

type Faq = { q: string; a: string }

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()

  return (
    <LazyMotion features={domAnimation}>
      <dl className="mt-8 divide-y divide-border">
        {faqs.map((f, i) => {
          const isOpen = openIndex === i
          return (
            <div key={f.q} className="py-2">
              <dt>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-3 text-left font-semibold text-foreground transition-colors hover:text-primary"
                >
                  <span>{f.q}</span>
                  <ChevronIcon
                    className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </dt>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.dd
                    key="content"
                    initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-pretty leading-relaxed text-muted-foreground">{f.a}</p>
                  </m.dd>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </dl>
    </LazyMotion>
  )
}

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
