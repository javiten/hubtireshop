import type React from "react"
import type { Metadata } from "next"
import { Geist, Oswald } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ChatAssistantMount } from "@/components/site/chat-assistant-mount"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hubtireshop.com"),
  title: {
    default: "Hub Tire Shop | Full-Service Auto Repair & Tires | Miami FL",
    template: "%s | Hub Tire Shop Miami",
  },
  description:
    "Full-service auto repair shop in Miami, FL for cars, trucks, SUVs, diesel & motorcycles. Oil changes, brakes, tires & alignment, A/C service, diagnostics & suspension. Call (305) 615-6286.",
  keywords: [
    "auto repair Miami",
    "tire shop Miami",
    "oil change Miami",
    "brake repair Miami",
    "wheel alignment Miami",
    "diesel repair Miami",
    "fleet maintenance Miami",
    "car AC repair Miami",
    "check engine light Miami",
  ],
  authors: [{ name: "Hub Tire Shop" }],
  generator: "v0.app",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.hubtireshop.com",
    siteName: "Hub Tire Shop",
    title: "Hub Tire Shop | Full-Service Auto Repair & Tires | Miami FL",
    description:
      "Full-service auto repair and tire center in Miami, FL. Cars, trucks, SUVs, diesel & motorcycles. Call (305) 615-6286.",
    images: [
      {
        url: "/images/og-hub-tire-shop.png",
        width: 1200,
        height: 630,
        alt: "Hub Tire Shop — Full-Service Auto Repair & Tires in Miami, FL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hub Tire Shop | Full-Service Auto Repair & Tires | Miami FL",
    description:
      "Full-service auto repair and tire center in Miami, FL. Cars, trucks, SUVs, diesel & motorcycles.",
    images: ["/images/og-hub-tire-shop.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${geist.variable} ${oswald.variable}`}>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <ChatAssistantMount />
      </body>
    </html>
  )
}
