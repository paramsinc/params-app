import { NextTamaguiProvider } from './styles-provider'
import './globals.css'
import { Provider } from 'app/provider'
import { TamaguiProvider } from 'app/ds/tamagui/provider'

export const metadata = {
  title: '(params)',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <NextTamaguiProvider>
          <Provider>{children}</Provider>
        </NextTamaguiProvider>
      </body>
    </html>
  )
}
