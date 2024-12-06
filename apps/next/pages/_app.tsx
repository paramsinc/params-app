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

// pages/_app.js
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { Auth } from 'app/auth'
import { useEffect } from 'app/react'
import { NextSeo, DefaultSeo } from 'next-seo'
import { useDashboardLinks } from 'app/features/web-layout/useDashboardLinks'

if (typeof window !== 'undefined') {
  // checks that we are client-side
  posthog.init(env.PUBLIC_POSTHOG_KEY, {
    api_host: env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug() // debug mode in development
    },
  })
}
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

  const metadata = (pageProps as any)?.metadata as React.ComponentProps<typeof NextSeo> | undefined

  return (
    <>
      <DefaultSeo
        title={env.APP_NAME}
        description={`Open source, code-reviewed AI starter templates.`}
        openGraph={{
          images: [{ url: `https://${env.APP_URL}/og.png` }],
        }}
      />
      {metadata && <NextSeo {...metadata} />}
      <Head>
        <link rel="icon" href="/paramsx1.png" />
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
      <PostHogProvider client={posthog}>
        <ThemeProvider>
          <TamaguiProvider>
            <Provider>
              {Layout === DashboardLayout && !metadata && <DashboardSeo />}
              <GlobalWebLayout hideHeader={'hideHeader' in Component}>
                <Layout>
                  <ActionSheetProvider useNativeDriver>
                    <Component {...pageProps} />
                  </ActionSheetProvider>
                  <Identify />
                </Layout>
              </GlobalWebLayout>
            </Provider>
          </TamaguiProvider>
        </ThemeProvider>
      </PostHogProvider>
      <Analytics />
    </>
  )
}

function DashboardSeo() {
  const links = useDashboardLinks()
  return (
    <NextSeo
      title={`${links.find((link) => link.isActive)?.label ?? 'Dashboard'} | ${env.APP_NAME}`}
    />
  )
}

function Identify() {
  const user = Auth.useUser()

  useEffect(() => {
    if (user.isSignedIn) {
      posthog.identify(user.userId, {
        email: user.userEmail,
        name: user.userFirstName,
        lastName: user.userLastName,
      })
    } else if (user.hasLoaded) {
      posthog.identify(undefined)
    }
  }, [user])

  return null
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
