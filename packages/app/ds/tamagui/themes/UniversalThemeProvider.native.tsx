import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { ThemeProviderProps, useThemeSetting as next_useThemeSetting } from '@tamagui/next-theme'
import { storage } from 'app/storage/storage'
import { StatusBar } from 'expo-status-bar'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance, useColorScheme } from 'react-native'

type ThemeContextValue = (ThemeProviderProps & { current?: string | null }) | null
export const ThemeContext = createContext<ThemeContextValue>(null)

type ThemeName = 'light' | 'dark' | 'system'

let persistedTheme = (storage.getString('@preferred_theme') as ThemeName) || null

export const UniversalThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [current, setCurrent] = useState<ThemeName>(persistedTheme ?? 'system')
  const systemTheme = useColorScheme() || 'system'

  useEffect(() => {
    if (current) {
      storage.set('@preferred_theme', current)
    }
  }, [current])

  const themeContext = useMemo(() => {
    return {
      themes: ['light', 'dark'],
      onChangeTheme: (next: string) => {
        setCurrent(next as ThemeName)
      },
      current,
      systemTheme,
    } satisfies ThemeContextValue
  }, [current, systemTheme])

  return (
    <ThemeContext.Provider value={themeContext}>
      <InnerProvider>{children}</InnerProvider>
    </ThemeContext.Provider>
  )
}

const InnerProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useThemeSetting()

  // ensure we set color scheme as soon as possible
  if (resolvedTheme !== Appearance.getColorScheme()) {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      Appearance.setColorScheme(resolvedTheme)
    }
  }

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  )
}

export const useThemeSetting: typeof next_useThemeSetting = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeSetting should be used within the context provider.')
  }

  const resolvedTheme =
    context.current === 'system' ? context.systemTheme : context.current ?? 'system'

  const outputContext: ReturnType<typeof next_useThemeSetting> = {
    ...context,
    systemTheme: context.systemTheme as 'light' | 'dark',
    themes: context.themes!,
    current: context.current ?? 'system',
    resolvedTheme,
    set: (value) => {
      context.onChangeTheme?.(value)
    },
    toggle: () => {
      const map = {
        light: 'dark',
        dark: 'system',
        system: 'light',
      }
      context.onChangeTheme?.(map[(context.current as ThemeName) ?? 'system'])
    },
  }

  return outputContext
}

export const useRootTheme = () => {
  const context = useThemeSetting()
  return [context.current === 'system' ? context.systemTheme : context.current, context.set]
}
