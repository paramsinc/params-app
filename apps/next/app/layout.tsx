import { StylesProvider } from './styles-provider'
import './globals.css'
import { Provider } from 'app/provider'

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
          <Provider>{children}</Provider>
        </StylesProvider>
      </body>
    </html>
  )
}
