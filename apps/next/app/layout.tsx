import { NextTamaguiProvider } from './styles-provider'
import './globals.css'
import { Provider } from 'app/provider'
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
  title: 'Params',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <NextTamaguiProvider>
          <>{children}</>
        </NextTamaguiProvider>
      </body>
      <Analytics />
    </html>
  )
}
