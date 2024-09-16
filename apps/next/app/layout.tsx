import { StylesProvider } from './styles-provider'
import './globals.css'
import { Provider } from 'app/provider'
import { TamaguiProvider } from 'app/ds/tamagui/provider'

export const metadata = {
  title: '(params)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <StylesProvider>
          <TamaguiProvider>
            <Provider>{children}</Provider>
          </TamaguiProvider>
        </StylesProvider>
      </body>
    </html>
  )
}
