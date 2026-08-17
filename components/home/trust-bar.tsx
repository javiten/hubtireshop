import { Stagger, StaggerItem } from "@/components/motion/motion-primitives"

const points = [
  { label: "Expert Technicians", sub: "Trained on all makes & models" },
  { label: "Honest Pricing", sub: "Upfront estimates, no surprises" },
  { label: "Fast Turnaround", sub: "Same-day on most repairs" },
  { label: "All Vehicles", sub: "Diesel, trucks, cars, SUVs, moto" },
]

export function TrustBar() {
  return (
    <section className="border-b border-border bg-background">
      <Stagger className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 py-8 md:grid-cols-4">
        {points.map((p) => (
          <StaggerItem key={p.label} className="flex flex-col items-center px-2 text-center md:px-4">
            <CheckIcon className="mb-2 h-6 w-6 text-primary" />
            <p className="text-sm font-semibold text-foreground md:text-base">{p.label}</p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{p.sub}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}
