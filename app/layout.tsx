import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CleanBins Pro - Professional Bin Cleaning Service | Eco-Friendly & Reliable",
  description:
    "Professional bin cleaning service with eco-friendly products. Choose from single, double, or triple bin packages. Fully insured with regular service available. Book online today!",
  keywords:
    "bin cleaning, wheelie bin cleaning, garbage bin cleaning, eco-friendly cleaning, professional cleaning service",
  authors: [{ name: "CleanBins Pro" }],
  creator: "CleanBins Pro",
  publisher: "CleanBins Pro",
  robots: "index, follow",
  openGraph: {
    title: "CleanBins Pro - Professional Bin Cleaning Service",
    description:
      "Keep your bins fresh and clean with our eco-friendly professional cleaning service. Book online today!",
    url: "https://cleanbinspro.com",
    siteName: "CleanBins Pro",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CleanBins Pro - Professional Bin Cleaning Service",
    description: "Keep your bins fresh and clean with our eco-friendly professional cleaning service.",
  },
  generator: 'v0.dev'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://cleanbinspro.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "CleanBins Pro",
              description: "Professional bin cleaning service with eco-friendly products",
              url: "https://cleanbinspro.com",
              telephone: "(555) 123-4567",
              email: "info@cleanbinspro.com",
              serviceType: "Bin Cleaning Service",
              areaServed: "Local Area",
              priceRange: "$20-$50",
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
