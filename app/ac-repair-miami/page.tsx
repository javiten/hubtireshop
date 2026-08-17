import type { Metadata } from "next"
import { AdsLanding } from "@/components/templates/ads-landing"
import { landingPages } from "@/lib/landing-content"

const content = landingPages["ac-repair-miami"]

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  keywords: content.keywords,
  alternates: { canonical: `/${content.slug}` },
  openGraph: {
    title: content.metaTitle,
    description: content.metaDescription,
    url: `https://www.hubtireshop.com/${content.slug}`,
    type: "website",
  },
}

export default function Page() {
  return <AdsLanding content={content} />
}
