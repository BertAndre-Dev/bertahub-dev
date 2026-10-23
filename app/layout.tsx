
import type { Metadata } from "next"
import { Suspense } from "react"
import { Geist, Geist_Mono, Varela_Round, Albert_Sans } from "next/font/google"
import { absoluteUrl, getSiteUrl } from "@/lib/site-url"
import { DeferredVercelAnalytics } from "@/components/analytics/deferred-vercel-analytics"
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner"; 
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { GoogleAnalytics } from "@next/third-parties/google";

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _varelaRound = Varela_Round({ weight: "400", subsets: ["latin"] })
const _albertSans = Albert_Sans({ subsets: ["latin"] })

const SITE_DESCRIPTION =
  "Manage property and energy operations, payments, and residents in one platform. Bertahub helps Nigerian estates deliver modern, connected living with smart metering, billing, and maintenance tools.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "Bertahub",
  title: {
    default: "Bertahub | Digital Companion for Smart Living",
    template: "%s | Bertahub",
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: "BertAndre Consulting Limited", url: getSiteUrl() }],
  creator: "BertAndre Consulting Limited",
  publisher: "BertAndre Consulting Limited",
  category: "Estate management",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Bertahub",
    title: "Bertahub | Digital Companion for Smart Living",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/assets/blog/blogHero.png"),
        width: 1200,
        height: 630,
        alt: "Bertahub digital operating system for Nigerian estates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bertahub | Digital Companion for Smart Living",
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/assets/blog/blogHero.png")],
  },
  icons: {
    icon: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <CookieBanner />
        <Suspense fallback={null}>
          <DeferredVercelAnalytics />
        </Suspense>
        <GoogleAnalytics gaId="G-2QKPRW9HZL" />
      </body>
    </html>
  )
}
