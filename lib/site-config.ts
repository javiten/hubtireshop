// Central business data for Hub Tire Shop (public marketing site).
// English content now; structured so a Spanish (es) layer can be added later.

export const siteConfig = {
  name: "Hub Tire Shop",
  legalName: "Hub Tire Shop LLC",
  tagline: "Keep Moving",
  description:
    "Full-service auto repair shop and tire center in Miami, FL. We service cars, trucks, SUVs, diesel, and motorcycles.",
  url: "https://www.hubtireshop.com",
  phone: {
    display: "(305) 615-6286",
    href: "tel:+13056156286",
    // Texting uses a separate, SMS-enabled line.
    smsDisplay: "(701) 732-3935",
    sms: "sms:+17017323935",
  },
  email: "info@hubtireshop.com",
  address: {
    street: "20855 NE 16th Ave, Suite C27",
    city: "Miami",
    state: "FL",
    zip: "33179",
    full: "20855 NE 16th Ave, Suite C27, Miami, FL 33179",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=20855+NE+16th+Ave+Suite+C27+Miami+FL+33179",
    // Approximate coordinates for structured data
    geo: { lat: 25.9634, lng: -80.185 },
  },
  hours: {
    // Monday–Saturday 9:00 AM–6:00 PM, Closed Sunday
    weekdays: "Monday – Saturday",
    weekdayTime: "9:00 AM – 6:00 PM",
    weekend: "Sunday",
    weekendTime: "Closed",
    // For LocalBusiness structured data (openingHours)
    schema: ["Mo-Sa 09:00-18:00"],
  },
  social: {
    google: "https://www.google.com/search?q=Hub+Tire+Shop+Miami",
    // Official Google Maps listing (reviews). Resolves to the Hub Tire Shop listing.
    googleReviews: "https://www.google.com/maps/search/?api=1&query=Hub+Tire+Shop+20855+NE+16th+Ave+Miami+FL+33179",
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
  },
  vehicleTypes: ["Diesel", "Trucks", "Cars", "SUVs", "Motorcycles"],
} as const

export type NavItem = { label: string; href: string }

export const mainNav: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Tires", href: "/services/tires" },
  { label: "Diagnostics", href: "/services/diagnostics" },
  { label: "Fleet", href: "/fleet" },
  { label: "About", href: "/about" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact", href: "/contact" },
]

export const footerNav: { title: string; links: NavItem[] }[] = [
  {
    title: "Services",
    links: [
      { label: "All Services", href: "/services" },
      { label: "Oil Changes", href: "/services" },
      { label: "Brakes", href: "/services" },
      { label: "Tires & Alignment", href: "/services/tires" },
      { label: "A/C Service", href: "/services" },
      { label: "Diagnostics", href: "/services/diagnostics" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Fleet Services", href: "/fleet" },
      { label: "Reviews", href: "/reviews" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
]

export type Service = {
  slug: string
  name: string
  icon: string // key into the ServiceIcon map
  short: string
  description: string
  highlights: string[]
}

// Service catalog. Icons map to keys in components/site/service-icon.tsx
export const services: Service[] = [
  {
    slug: "oil-changes",
    name: "Oil Changes",
    icon: "oil",
    short: "Conventional, synthetic blend, and full synthetic oil changes.",
    description:
      "Keep your engine running clean with a full-service oil and filter change. We use manufacturer-recommended oil weights and inspect key components at every visit.",
    highlights: ["Conventional & full synthetic", "New filter included", "Multi-point inspection"],
  },
  {
    slug: "brakes",
    name: "Brake Repair",
    icon: "brake",
    short: "Pads, rotors, calipers, fluid, and complete brake inspections.",
    description:
      "From squeaky pads to full brake system service, we restore safe, confident stopping power for cars, trucks, and SUVs.",
    highlights: ["Pad & rotor replacement", "Brake fluid service", "Free brake inspection"],
  },
  {
    slug: "tires",
    name: "Tires & Alignment",
    icon: "tire",
    short: "New tires, mounting, balancing, rotation, and wheel alignment.",
    description:
      "Shop top tire brands and get precision mounting, balancing, and alignment to maximize tread life and handling.",
    highlights: ["All major brands", "Computerized alignment", "Rotation & balancing"],
  },
  {
    slug: "ac-service",
    name: "A/C Service",
    icon: "ac",
    short: "Recharge, leak detection, and full climate-control repair.",
    description:
      "Beat the Miami heat. We diagnose and repair air conditioning systems, recharge refrigerant, and fix leaks fast.",
    highlights: ["A/C recharge", "Leak detection", "Compressor repair"],
  },
  {
    slug: "diagnostics",
    name: "Diagnostics",
    icon: "diagnostics",
    short: "Check-engine light, computer scans, and electrical diagnostics.",
    description:
      "Our technicians use professional scan tools to pinpoint the real cause of dashboard warning lights and performance issues.",
    highlights: ["Check-engine light", "Computerized scans", "Electrical diagnostics"],
  },
  {
    slug: "suspension",
    name: "Suspension",
    icon: "suspension",
    short: "Shocks, struts, control arms, and steering components.",
    description:
      "Restore a smooth, stable ride with shock, strut, and steering-component repair for every type of vehicle we service.",
    highlights: ["Shocks & struts", "Steering repair", "Ride-quality inspection"],
  },
  {
    slug: "engine-repair",
    name: "Engine Repair",
    icon: "engine",
    short: "Tune-ups, belts, hoses, and major engine service.",
    description:
      "From routine tune-ups to major repairs, we keep gas and diesel engines running strong for the long haul.",
    highlights: ["Tune-ups", "Belts & hoses", "Diesel engine service"],
  },
  {
    slug: "transmission",
    name: "Transmission",
    icon: "transmission",
    short: "Fluid service, diagnostics, and transmission repair.",
    description:
      "Protect your drivetrain with transmission fluid service, diagnostics, and repairs performed by experienced technicians.",
    highlights: ["Fluid service", "Diagnostics", "Repair & rebuild"],
  },
]

// Miami service-area locations (used by the local-area landing template).
export type ServiceArea = {
  slug: string
  name: string
  headline: string
  intro: string
  neighborhoods: string[]
}

export const serviceAreas: ServiceArea[] = [
  {
    slug: "north-miami-beach",
    name: "North Miami Beach",
    headline: "Auto Repair & Tires in North Miami Beach, FL",
    intro:
      "Hub Tire Shop is the trusted full-service auto repair shop near North Miami Beach. From oil changes to diagnostics, we keep your car, truck, or SUV moving.",
    neighborhoods: ["Uleta", "Sky Lake", "Highland Lakes", "Eastern Shores"],
  },
]
