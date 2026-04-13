import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Nunito } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })
const nunito = Nunito({ subsets: ["latin"], variable: "--font-heading" })

export const metadata: Metadata = {
  title: "Params Design System",
  description: "Design system reference for paramsinc/params-app — tokens, colors, typography, components, and patterns.",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} ${nunito.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
