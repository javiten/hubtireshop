import type { Metadata } from "next"
import { ServiceLanding, type ServiceLandingConfig } from "@/components/templates/service-landing"
import { TireQuoteForm } from "@/components/site/tire-quote-form"

const config: ServiceLandingConfig = {
  slug: "tires",
  icon: "tire",
  eyebrow: "Tires & Alignment",
  title: "New tires, mounting, balancing & wheel alignment in Miami",
  subtitle:
    "Shop top tire brands and get precision mounting, balancing, and computerized alignment to maximize tread life, safety, and handling.",
  metaTitle: "Tires & Wheel Alignment in Miami, FL",
  intro:
    "Your tires are the only thing connecting your vehicle to the road. At Hub Tire Shop we carry a wide selection of tires for cars, trucks, SUVs, diesel vehicles, and motorcycles — and we back every set with expert mounting, balancing, and alignment. Whether you need a single replacement or a full set, we help you find the right tire for your budget and driving needs.",
  benefits: [
    {
      title: "All major brands",
      body: "From economy to premium performance tires, we help you choose the right fit for your vehicle and how you drive.",
    },
    {
      title: "Computerized alignment",
      body: "Precision alignment protects your new tires, improves handling, and keeps your vehicle tracking straight.",
    },
    {
      title: "Rotation & balancing",
      body: "Regular rotation and balancing extend tread life and keep your ride smooth and vibration-free.",
    },
  ],
  process: [
    { step: "1", title: "Tell us your vehicle", body: "Share your year, make, and model so we can match the right tire size and load rating." },
    { step: "2", title: "Pick your tires", body: "We present options across brands and price points, with honest recommendations." },
    { step: "3", title: "Install & align", body: "We mount, balance, and align — then get you back on the road." },
  ],
  faqs: [
    { q: "How often should I replace my tires?", a: "It depends on mileage, driving conditions, and tread wear, but most tires last 3–5 years. We offer free tread inspections to help you decide." },
    { q: "Do I need an alignment with new tires?", a: "We strongly recommend an alignment with a new set of tires. It protects your investment and prevents uneven wear." },
    { q: "Can you service trucks and diesel vehicles?", a: "Yes. We service tires for cars, trucks, SUVs, diesel vehicles, and motorcycles." },
    { q: "How long does tire installation take?", a: "Most tire installations are completed the same day. Call ahead and we'll give you an estimated time." },
  ],
}

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.subtitle,
  alternates: { canonical: "/services/tires" },
}

export default function TiresPage() {
  return (
    <ServiceLanding
      config={config}
      formTitle="Get a free tire quote"
      formSubtitle="Tell us your vehicle and tire size and we'll send pricing and availability."
      formSlot={<TireQuoteForm />}
    />
  )
}
