import './tailwind.css'
import 'raf/polyfill'
import '@tamagui/core/reset.css'

import { ColorScheme, NextThemeProvider, useRootTheme } from '@tamagui/next-theme'
import { Fragment } from 'react'

import { Provider } from 'app/provider'
import { api } from 'app/trpc/client'

import { NextPage } from 'next'
import Head from 'next/head'
import { ReactElement, ReactNode } from 'react'
import type { SolitoAppProps } from 'solito'
import { TamaguiProvider } from 'app/ds/tamagui/provider'
import { GlobalWebLayout } from 'app/features/web-layout/global'
import { DashboardLayout } from 'app/features/web-layout/dashboard'
import { env } from 'app/env'
import { entries } from 'app/helpers/object'
import fonts from 'app/ds/tamagui/font/fonts'
import { fontVars } from 'app/ds/tamagui/font/font-vars'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import { Analytics } from '@vercel/analytics/next'

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

const { APP_NAME } = env

function MyApp({ Component, pageProps, router }: SolitoAppProps) {
  const Layout =
    router.pathname.startsWith('/dashboard') ||
    router.pathname.startsWith('/bookings') ||
    router.pathname.startsWith('/new')
      ? DashboardLayout
      : Fragment

  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content={`Open source, code-reviewed AI starter templates.`} />
        <link rel="icon" href="/paramsx1.png" />
        {/* og image */}
        <meta property="og:image" content={`https://${env.APP_URL}/og.png`} />
      </Head>
      <style jsx global>
        {`
          :root {
            ${entries(fonts)
              .map(([varName, family]) => `${fontVars[varName]}: ${family};`)
              .join('\n')}
          }
          html {
            font-family: var(${fontVars.body});
          }
          body {
            background-color: var(--backgroundStrong);
          }
        `}
      </style>
      <ThemeProvider>
        <TamaguiProvider>
          <Provider>
            <GlobalWebLayout hideHeader={'hideHeader' in Component}>
              <Layout>
                <ActionSheetProvider useNativeDriver>
                  <Component {...pageProps} />
                </ActionSheetProvider>
              </Layout>
            </GlobalWebLayout>
          </Provider>
        </TamaguiProvider>
      </ThemeProvider>
      <Analytics />
    </>
  )
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [, setTheme] = useRootTheme()
  return (
    <NextThemeProvider
      onChangeTheme={(next) => {
        setTheme(next as ColorScheme)
      }}
    >
      {children}
    </NextThemeProvider>
  )
}

export default api.withTRPC(MyApp)
