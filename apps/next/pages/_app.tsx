import 'raf/polyfill'
import '@tamagui/core/reset.css'
// import '@calcom/atoms/globals.min.css'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

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

if (process.env.NODE_ENV === 'production') {
  // require('../public/tamagui.css')
}

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

const { APP_NAME } = env

function MyApp({ Component, pageProps, router }: SolitoAppProps) {
  const getLayout = Component.getLayout || ((page) => page)

  const Layout = router.pathname.startsWith('/dashboard') ? DashboardLayout : Fragment

  return (
    <div
      className={`${GeistSans.variable} ${GeistMono.variable}  font_body`}
      style={{ display: 'contents', fontFamily: 'var(--f-family)' }}
    >
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content={APP_NAME} />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <ThemeProvider>
        <TamaguiProvider>
          <Provider>
            <GlobalWebLayout>
              <Layout>{getLayout(<Component {...pageProps} />)}</Layout>
            </GlobalWebLayout>
          </Provider>
        </TamaguiProvider>
      </ThemeProvider>
      <style jsx global>
        {`
          body {
            background-color: var(--color1);
            font-family: var(--f-family);
          }
        `}
      </style>
    </div>
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
