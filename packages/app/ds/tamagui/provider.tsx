'use client'

import { isWeb, TamaguiProvider as Provider, useDidFinishSSR } from 'tamagui'

import { useRootTheme, useThemeSetting } from './themes/UniversalThemeProvider'
import { tamaguiConfig } from './tamagui.config'
import { Toaster } from 'burnt/web'
import { useEffect, useState } from 'react'

export const TamaguiProvider = ({
  children,
  ...overrideProps
}: { children: React.ReactNode } & Partial<Parameters<typeof Provider>[0]>) => {
  const [rootTheme] = useRootTheme()
  const themeSetting = useThemeSetting()
  const isHydrated = useDidFinishSSR()
  const defaultTheme =
    isHydrated && isWeb ? themeSetting.resolvedTheme || 'light' : rootTheme

  return (
    <Provider
      config={tamaguiConfig}
      disableInjectCSS
      disableRootThemeClass
      defaultTheme={defaultTheme}
      // defaultTheme=
      {...overrideProps}
    >
      {children}
      <Toast />
    </Provider>
  )
}

function Toast() {
  const themeSetting = useThemeSetting()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  return (
    <Toaster
      theme={themeSetting.resolvedTheme !== 'dark' ? 'dark' : 'light'}
      closeButton
    />
  )
}
