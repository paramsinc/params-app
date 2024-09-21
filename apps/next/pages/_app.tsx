import 'raf/polyfill'
import '@tamagui/core/reset.css'
// import '@calcom/atoms/globals.min.css'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import { ColorScheme, NextThemeProvider, useRootTheme } from '@tamagui/next-theme'

import { Provider } from 'app/provider'
import { api } from 'app/trpc/client'

import { NextPage } from 'next'
import Head from 'next/head'
import { ReactElement, ReactNode } from 'react'
import type { SolitoAppProps } from 'solito'
import { TamaguiProvider } from 'app/ds/tamagui/provider'
import { GlobalWebLayout } from 'app/features/web-layout/global'
import localFont from 'next/font/local'

if (process.env.NODE_ENV === 'production') {
  // require('../public/tamagui.css')
}

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

const headingFont = localFont({
  src: [
    {
      path: '../fonts/CircularStd-Bold.ttf',
      weight: '400',
      style: 'normal',
    },
    // italic
    {
      path: '../fonts/CircularStd-BookItalic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/CircularStd-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    // italic
    {
      path: '../fonts/CircularStd-MediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },

    {
      path: '../fonts/CircularStd-Bold.ttf',
      weight: '600',
      style: 'normal',
    },
    // italic
    {
      path: '../fonts/CircularStd-BoldItalic.ttf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../fonts/CircularStd-BlackItalic.ttf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../fonts/CircularStd-Black.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
})

console.log({ headingFont })

const APP_NAME = 'Params'

function MyApp({ Component, pageProps }: SolitoAppProps) {
  const getLayout = Component.getLayout || ((page) => page)

  return (
    <div
      className={`${GeistSans.variable} ${GeistMono.variable} ${headingFont.className} font_body`}
      style={{ display: 'contents', fontFamily: 'var(--f-family)' }}
    >
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content={APP_NAME} />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <ThemeProvider>
        <TamaguiProvider>
          <GlobalWebLayout>
            <Provider>{getLayout(<Component {...pageProps} />)}</Provider>
          </GlobalWebLayout>
        </TamaguiProvider>
      </ThemeProvider>
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
