import type { MetadataRoute } from "next"
import { siteConfig, serviceAreas } from "@/lib/site-config"
import { landingSlugs } from "@/lib/landing-content"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url
  const now = new Date()

  const staticRoutes = [
    "",
    "/services",
    "/services/tires",
    "/services/diagnostics",
    "/fleet",
    "/about",
    "/reviews",
    "/contact",
    "/privacy-policy",
    "/terms",
  ]

  const areaRoutes = serviceAreas.map((a) => `/service-area/${a.slug}`)
  const landingRoutes = landingSlugs.map((slug) => `/${slug}`)

  return [...staticRoutes, ...areaRoutes, ...landingRoutes].map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/services") ? 0.8 : 0.6,
  }))
}
