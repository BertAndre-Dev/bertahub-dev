
import type { Metadata } from "next"
import { Geist, Geist_Mono, Varela_Round, Manrope } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";
import ClientProvider from "@/components/client-provider/page";

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _varelaRound = Varela_Round({ weight: "400", subsets: ["latin"] })
const _manrope = Manrope({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Estate Management System",
  description: "Modern estate management application for residents, managers, and administrators",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ClientProvider>{children}</ClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
