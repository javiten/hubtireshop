// Content for Google Ads / local SEO landing pages.
// Each entry powers a conversion-focused page rendered by
// components/templates/ads-landing.tsx.

export type LandingContent = {
  slug: string
  icon: string // key into components/site/service-icon.tsx
  metaTitle: string
  metaDescription: string
  keywords: string[]
  eyebrow: string
  headline: string
  subhead: string
  symptoms: string[]
  serviceIntro: string
  servicePoints: string[]
  formHeading: string
  formService: string // pre-selected value hint (free text for the message)
}

export const landingPages: Record<string, LandingContent> = {
  "auto-repair-miami": {
    slug: "auto-repair-miami",
    icon: "wrench",
    metaTitle: "Auto Repair in Miami, FL | ASE-Certified Mechanics | Hub Tire Shop",
    metaDescription:
      "Full-service auto repair in Miami, FL. ASE-certified mechanics for cars, trucks, SUVs & diesel. Oil changes, brakes, diagnostics & more. Open Mon–Sat 9–6. Call (305) 615-6286.",
    keywords: [
      "auto repair Miami",
      "mechanic Miami FL",
      "car repair Miami",
      "ASE certified mechanic Miami",
      "diesel repair Miami",
    ],
    eyebrow: "Miami Auto Repair",
    headline: "Honest, ASE-Certified Auto Repair in Miami",
    subhead:
      "From routine maintenance to major repairs, our certified technicians keep your car, truck, SUV, or diesel moving. Fast, fair, and done right the first time.",
    symptoms: [
      "Dashboard warning or check-engine light is on",
      "Strange noises, vibrations, or smells while driving",
      "Car is overdue for maintenance or a tune-up",
      "Leaking fluids or loss of power",
    ],
    serviceIntro:
      "Hub Tire Shop is a full-service auto repair center serving all of Miami. Whatever you drive, our team handles it with professional-grade equipment and upfront pricing.",
    servicePoints: [
      "Oil changes & scheduled maintenance",
      "Brakes, suspension & steering",
      "Engine & transmission service",
      "A/C repair & electrical diagnostics",
      "Gas & diesel vehicles welcome",
    ],
    formHeading: "Request Your Auto Repair",
    formService: "Auto Repair",
  },
  "tire-shop-miami": {
    slug: "tire-shop-miami",
    icon: "tire",
    metaTitle: "Tire Shop in Miami, FL | New Tires, Mounting & Alignment | Hub Tire Shop",
    metaDescription:
      "Miami tire shop with all major brands, expert mounting, balancing & computerized alignment. Cars, trucks, SUVs & more. Open Mon–Sat 9–6. Call (305) 615-6286.",
    keywords: [
      "tire shop Miami",
      "new tires Miami",
      "wheel alignment Miami",
      "tire mounting Miami",
      "tire balancing Miami",
    ],
    eyebrow: "Miami Tire Shop",
    headline: "New Tires & Alignment in Miami — All Major Brands",
    subhead:
      "Shop top tire brands at competitive prices with precision mounting, balancing, and computerized wheel alignment to maximize tread life and handling.",
    symptoms: [
      "Uneven or worn-down tread",
      "Car pulls to one side or steering wheel is off-center",
      "Vibration at highway speeds",
      "Low tire pressure warning or frequent air loss",
    ],
    serviceIntro:
      "Whether you need a single replacement or a full set, Hub Tire Shop gets you rolling on quality tires with expert installation and alignment.",
    servicePoints: [
      "New tires — all major brands",
      "Mounting & computerized balancing",
      "Tire rotation & flat repair",
      "Computerized wheel alignment",
      "Cars, trucks, SUVs & motorcycles",
    ],
    formHeading: "Get a Tire Quote",
    formService: "Tires & Alignment",
  },
  "brake-repair-miami": {
    slug: "brake-repair-miami",
    icon: "brake",
    metaTitle: "Brake Repair in Miami, FL | Pads, Rotors & Inspection | Hub Tire Shop",
    metaDescription:
      "Brake repair in Miami, FL by ASE-certified techs. Pads, rotors, calipers & brake fluid service with free inspection. Open Mon–Sat 9–6. Call (305) 615-6286.",
    keywords: [
      "brake repair Miami",
      "brake pads Miami",
      "brake service Miami FL",
      "rotor replacement Miami",
      "brake inspection Miami",
    ],
    eyebrow: "Miami Brake Repair",
    headline: "Safe, Reliable Brake Repair in Miami",
    subhead:
      "Squeaking, grinding, or a soft pedal? Our certified technicians restore confident stopping power for cars, trucks, and SUVs — with a free brake inspection.",
    symptoms: [
      "Squealing or grinding when braking",
      "Soft, spongy, or vibrating brake pedal",
      "Car pulls to one side when stopping",
      "Brake warning light is on",
    ],
    serviceIntro:
      "Don't gamble with your safety. Hub Tire Shop diagnoses and repairs the full brake system, using quality parts and honest recommendations.",
    servicePoints: [
      "Brake pad & rotor replacement",
      "Caliper & brake line service",
      "Brake fluid flush",
      "Free brake inspection",
      "Same-day service on most vehicles",
    ],
    formHeading: "Book Your Brake Service",
    formService: "Brake Repair",
  },
  "car-diagnostics-miami": {
    slug: "car-diagnostics-miami",
    icon: "diagnostics",
    metaTitle: "Car Diagnostics in Miami, FL | Check Engine Light | Hub Tire Shop",
    metaDescription:
      "Check-engine light on? Get professional car diagnostics in Miami, FL. Computer scans & electrical diagnostics by ASE-certified techs. Open Mon–Sat 9–6. Call (305) 615-6286.",
    keywords: [
      "car diagnostics Miami",
      "check engine light Miami",
      "engine diagnostics Miami FL",
      "car computer scan Miami",
      "electrical diagnostics Miami",
    ],
    eyebrow: "Miami Car Diagnostics",
    headline: "Check-Engine Light On? Get Real Answers in Miami",
    subhead:
      "Our technicians use professional scan tools to pinpoint the actual cause of warning lights and performance issues — no guesswork, no unnecessary parts.",
    symptoms: [
      "Check-engine or warning light is on",
      "Rough idle, stalling, or hard starts",
      "Poor fuel economy or loss of power",
      "Electrical or sensor issues",
    ],
    serviceIntro:
      "A warning light doesn't have to mean a big bill. Hub Tire Shop accurately diagnoses the problem first, then explains your options clearly.",
    servicePoints: [
      "Check-engine light diagnosis",
      "Computerized scan-tool analysis",
      "Electrical & sensor diagnostics",
      "Drivability & performance testing",
      "Clear, upfront repair estimates",
    ],
    formHeading: "Schedule a Diagnostic",
    formService: "Diagnostics",
  },
  "ac-repair-miami": {
    slug: "ac-repair-miami",
    icon: "ac",
    metaTitle: "Car A/C Repair in Miami, FL | Recharge & Leak Repair | Hub Tire Shop",
    metaDescription:
      "Car A/C repair in Miami, FL. A/C recharge, leak detection & compressor repair to beat the Miami heat. Open Mon–Sat 9–6. Call (305) 615-6286.",
    keywords: [
      "car AC repair Miami",
      "auto air conditioning Miami",
      "AC recharge Miami FL",
      "car AC not cold Miami",
      "AC compressor repair Miami",
    ],
    eyebrow: "Miami A/C Repair",
    headline: "Cold Air, Fast — Car A/C Repair in Miami",
    subhead:
      "Beat the Miami heat. We diagnose and repair automotive air conditioning, recharge refrigerant, and fix leaks so your cabin gets cold again.",
    symptoms: [
      "A/C blows warm or weak air",
      "Bad smell or noise when A/C runs",
      "A/C works intermittently",
      "Refrigerant leaks or low pressure",
    ],
    serviceIntro:
      "In Miami, a working A/C isn't a luxury. Hub Tire Shop gets your climate control back to ice-cold quickly and affordably.",
    servicePoints: [
      "A/C performance inspection",
      "Refrigerant recharge",
      "Leak detection & repair",
      "Compressor & component replacement",
      "Cabin air filter service",
    ],
    formHeading: "Fix My A/C",
    formService: "A/C Service",
  },
  "fleet-maintenance-miami": {
    slug: "fleet-maintenance-miami",
    icon: "truck",
    metaTitle: "Fleet Maintenance in Miami, FL | Vans, Trucks & Diesel | Hub Tire Shop",
    metaDescription:
      "Fleet maintenance & repair in Miami, FL. Keep vans, trucks & diesel vehicles on the road with scheduled service, tires & diagnostics. Open Mon–Sat 9–6. Call (305) 615-6286.",
    keywords: [
      "fleet maintenance Miami",
      "fleet repair Miami FL",
      "commercial vehicle repair Miami",
      "diesel fleet service Miami",
      "fleet tires Miami",
    ],
    eyebrow: "Miami Fleet Maintenance",
    headline: "Fleet Maintenance That Keeps Miami Moving",
    subhead:
      "Minimize downtime and control costs. Hub Tire Shop services vans, box trucks, and diesel fleets with scheduled maintenance, tires, and fast diagnostics.",
    symptoms: [
      "Vehicles overdue for scheduled service",
      "Rising downtime and repair costs",
      "Need a reliable single-shop partner",
      "Tire and brake wear across the fleet",
    ],
    serviceIntro:
      "From one work van to a full fleet, we help Miami businesses stay on the road with priority scheduling and dependable service.",
    servicePoints: [
      "Preventive maintenance programs",
      "Fleet tires, brakes & alignment",
      "Diesel & gas engine service",
      "Diagnostics & DOT-readiness checks",
      "Priority scheduling for businesses",
    ],
    formHeading: "Set Up Fleet Service",
    formService: "Fleet Services",
  },
}

export const landingSlugs = Object.keys(landingPages)
