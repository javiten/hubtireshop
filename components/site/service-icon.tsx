import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

const base = {
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.75,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function Oil(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 13.5V11a1 1 0 0 1 1-1h6l3 3h5a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2Z" />
      <path d="M10 10V7h4" />
      <path d="M17 6c.8 1 1.5 1.8 1.5 2.6A1.5 1.5 0 0 1 17 10a1.5 1.5 0 0 1-1.5-1.4C15.5 7.8 16.2 7 17 6Z" />
    </svg>
  )
}

function Brake(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5V8M12 16v4.5M3.5 12H8M16 12h4.5" />
    </svg>
  )
}

function Tire(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9 18 18M18 6l-2.1 2.1M8.1 15.9 6 18" />
    </svg>
  )
}

function Ac(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18M3 12h18" />
      <path d="m6 6 12 12M18 6 6 18" />
      <path d="M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2M3 12l2-2M3 12l2 2M21 12l-2-2M21 12l-2 2" />
    </svg>
  )
}

function Diagnostics(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h3l2-5 3 10 2-7 2 4h6" />
    </svg>
  )
}

function Suspension(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3v3M7 18v3M17 3v3M17 18v3" />
      <path d="M7 6c0 1.5 2 1.5 2 3s-2 1.5-2 3 2 1.5 2 3M17 6c0 1.5-2 1.5-2 3s2 1.5 2 3-2 1.5-2 3" />
    </svg>
  )
}

function Engine(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 13v-2h2l2-2h4v2h3l2 2h2v4h-2v2H9v-2H6l-2-2Z" />
      <path d="M12 7V5h3" />
      <path d="M18 11h2V9" />
    </svg>
  )
}

function Transmission(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="7" cy="7" r="2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="7" r="2" />
      <path d="M7 9v6M7 7h10M17 9v0M7 17h6" />
      <path d="M17 12a3 3 0 0 1-3 3" />
    </svg>
  )
}

function Truck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z" />
      <circle cx="6.5" cy="18" r="1.8" />
      <circle cx="16.5" cy="18" r="1.8" />
    </svg>
  )
}

function Wrench(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 6a3.5 3.5 0 0 0-4.6 4.6L4 17l3 3 6.4-6.4A3.5 3.5 0 0 0 18 9l-2 2-2-2 2-2a3.5 3.5 0 0 0-1-1Z" />
    </svg>
  )
}

const icons: Record<string, (p: IconProps) => JSX.Element> = {
  oil: Oil,
  brake: Brake,
  tire: Tire,
  ac: Ac,
  diagnostics: Diagnostics,
  suspension: Suspension,
  engine: Engine,
  transmission: Transmission,
  truck: Truck,
  wrench: Wrench,
}

export function ServiceIcon({ name, ...props }: { name: string } & IconProps) {
  const Icon = icons[name] ?? Wrench
  return <Icon {...props} />
}
