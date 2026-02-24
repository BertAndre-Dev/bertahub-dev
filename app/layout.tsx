
import type { Metadata } from "next"
import { Geist, Geist_Mono, Varela_Round, Albert_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";
import ClientProvider from "@/components/client-provider/page";
import { CookieBanner } from "@/components/cookie-banner";

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _varelaRound = Varela_Round({ weight: "400", subsets: ["latin"] })
const _albertSans = Albert_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Estate Management System",
  description: "Modern estate management application for residents, managers, and administrators",
  generator: "v0.app",
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
      <body className={`font-albert-sans antialiased`}>
        <ClientProvider>{children}</ClientProvider>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  )
}
