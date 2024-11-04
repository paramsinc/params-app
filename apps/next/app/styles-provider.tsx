'use client'

import '@tamagui/core/reset.css'
import '@tamagui/polyfill-dev'

import { ReactNode } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { NextThemeProvider } from '@tamagui/next-theme'
import { TamaguiProvider } from 'tamagui'
import { StyleSheet } from 'react-native'
import { useRootTheme } from '@tamagui/next-theme'
import tamaguiConfig from 'app/ds/tamagui/tamagui.config'

export const NextTamaguiProvider = ({ children }: { children: ReactNode }) => {
  const [, setTheme] = useRootTheme()

  useServerInsertedHTML(() => {
    // @ts-ignore RN doesn't have this type
    const rnwStyle = StyleSheet.getSheet()
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: rnwStyle.textContent }} id={rnwStyle.id} />
        <style
          dangerouslySetInnerHTML={{
            // the first time this runs you'll get the full CSS including all themes
            // after that, it will only return CSS generated since the last call
            __html: tamaguiConfig.getCSS({}),
          }}
        />
      </>
    )
  })

  return (
    <NextThemeProvider
      skipNextHead
      enableSystem
      onChangeTheme={(next) => {
        setTheme(next as any)
      }}
    >
      <TamaguiProvider config={tamaguiConfig} disableRootThemeClass>
        {children}
      </TamaguiProvider>
    </NextThemeProvider>
  )
}
