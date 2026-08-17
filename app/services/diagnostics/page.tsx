import type { Metadata } from "next"
import { ServiceLanding, type ServiceLandingConfig } from "@/components/templates/service-landing"
import { RequestServiceForm } from "@/components/site/request-service-form"

const config: ServiceLandingConfig = {
  slug: "diagnostics",
  icon: "diagnostics",
  eyebrow: "Diagnostics",
  title: "Check-engine light & computer diagnostics in Miami",
  subtitle:
    "Our technicians use professional, manufacturer-level scan tools to pinpoint the real cause of dashboard warning lights, electrical faults, and performance issues — no guesswork.",
  metaTitle: "Car Diagnostics & Check-Engine Light in Miami, FL",
  heroCta: "Schedule a Diagnostic",
  intro:
    "A warning light doesn't have to mean the worst — but ignoring it can turn a small fix into a big repair. At Hub Tire Shop, we run computerized diagnostics with professional scan tools to read your vehicle's trouble codes and, more importantly, interpret what they actually mean. We diagnose engine, electrical, and drivability issues across American, Asian, and European vehicles — both older and late-model — then explain your options in plain language.",
  benefits: [
    { title: "Professional scan tools", body: "We read manufacturer-level codes, not just generic ones, for a more accurate diagnosis." },
    { title: "Root-cause analysis", body: "A code is only a starting point. We test and verify to find the actual problem before recommending repairs." },
    { title: "Clear, honest estimates", body: "You'll get a straightforward explanation and a written estimate before any work begins." },
  ],
  capabilities: {
    heading: "What our diagnostics cover",
    items: [
      { title: "Check-engine lights", body: "We read and interpret stored and pending trouble codes to find why your light is on." },
      { title: "ABS & airbag systems", body: "Diagnosis of anti-lock brake and SRS/airbag warning lights and fault codes." },
      { title: "Electrical troubleshooting", body: "Tracing shorts, parasitic draws, bad grounds, sensors, and wiring faults." },
      { title: "Module communication", body: "Diagnosing CAN bus and control-module communication errors between vehicle computers." },
      { title: "Drivability diagnosis", body: "Rough idle, stalling, misfires, hesitation, poor fuel economy, and no-start conditions." },
      { title: "Professional scan tools", body: "Manufacturer-level scan equipment for deeper, more accurate results than a basic code reader." },
    ],
  },
  coverage: {
    heading: "American, Asian & European vehicle coverage",
    intro:
      "Our technicians and scan tools support a wide range of makes — from older vehicles to the latest computer-controlled models across cars, trucks, SUVs, diesel vehicles, and motorcycles.",
    groups: [
      { label: "American", body: "Ford, Chevrolet, GMC, Dodge, RAM, Jeep, Chrysler, Cadillac, Buick, and more." },
      { label: "Asian", body: "Toyota, Honda, Nissan, Hyundai, Kia, Subaru, Mazda, Lexus, Acura, Infiniti, and more." },
      { label: "European", body: "BMW, Mercedes-Benz, Volkswagen, Audi, Volvo, MINI, and more." },
    ],
  },
  process: [
    { step: "1", title: "Scan & read codes", body: "We connect to your vehicle's computer and pull all stored trouble codes." },
    { step: "2", title: "Test & verify", body: "We perform component testing to confirm the true source of the issue." },
    { step: "3", title: "Review & repair", body: "We walk you through findings and options, then fix it right the first time." },
  ],
  faqs: [
    { q: "My check-engine light is on but the car drives fine. Should I worry?", a: "It's best to have it checked promptly. Some issues are minor, but others can worsen or affect emissions and fuel economy if left unaddressed." },
    { q: "Can you diagnose ABS and airbag warning lights?", a: "Yes. Our scan tools read ABS (anti-lock brake) and SRS/airbag fault codes so we can diagnose those systems, not just the engine." },
    { q: "Do you diagnose electrical and module communication problems?", a: "Yes. We troubleshoot electrical faults, sensors, wiring, and control-module (CAN bus) communication errors in addition to engine trouble codes." },
    { q: "Do you cover American, Asian, and European vehicles?", a: "We do — across both older and late-model vehicles, including cars, trucks, SUVs, diesel vehicles, and motorcycles." },
    { q: "Will the diagnostic fee apply to my repair?", a: "Call us for current diagnostic pricing — we'll explain everything up front before any work is done." },
  ],
}

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.subtitle,
  alternates: { canonical: "/services/diagnostics" },
}

export default function DiagnosticsPage() {
  return (
    <ServiceLanding
      config={config}
      formTitle="Schedule a Diagnostic"
      formSubtitle="Tell us what your vehicle is doing and we'll get you scheduled — no guesswork."
      formSlot={<RequestServiceForm compact defaultService="Diagnostics" />}
    />
  )
}
