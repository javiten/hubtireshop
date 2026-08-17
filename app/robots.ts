import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the private admin area and internal intake tools out of search engines.
      disallow: ["/admin", "/admin/", "/api/", "/checkin", "/inspection"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
