import { siteConfig, services } from "@/lib/site-config"

// LocalBusiness + AutoRepair structured data for local SEO.
// Uses both @types so search engines treat it as a local business and an auto repair shop.
export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "LocalBusiness"],
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    image: `${siteConfig.url}/images/og-hub-tire-shop.png`,
    logo: `${siteConfig.url}/images/hub-20tire-20shop-20logo-20rectangle-20rounded.png`,
    "@id": `${siteConfig.url}/#localbusiness`,
    url: siteConfig.url,
    telephone: siteConfig.phone.display,
    email: siteConfig.email,
    priceRange: "$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, Debit Card",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.address.geo.lat,
      longitude: siteConfig.address.geo.lng,
    },
    hasMap: siteConfig.address.mapsUrl,
    // Human-readable + structured hours: Mon–Sat 9 AM–6 PM, closed Sunday.
    openingHours: "Mo-Sa 09:00-18:00",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "00:00",
        closes: "00:00",
      },
    ],
    areaServed: [
      { "@type": "City", name: "Miami" },
      { "@type": "City", name: "North Miami Beach" },
      { "@type": "City", name: "Aventura" },
    ],
    makesOffer: services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name },
    })),
    sameAs: [siteConfig.social.google, siteConfig.social.facebook, siteConfig.social.instagram],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Reusable Service structured data.
export function ServiceJsonLd({ name, description }: { name: string; description: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    description,
    provider: {
      "@type": "AutoRepair",
      name: siteConfig.name,
      telephone: siteConfig.phone.display,
      address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address.street,
        addressLocality: siteConfig.address.city,
        addressRegion: siteConfig.address.state,
        postalCode: siteConfig.address.zip,
        addressCountry: "US",
      },
    },
    areaServed: { "@type": "City", name: "Miami" },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

// Breadcrumb structured data.
export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

// Website structured data with sitelinks search box.
export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
