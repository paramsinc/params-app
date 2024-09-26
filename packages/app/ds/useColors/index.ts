import { useTheme, ThemeName, useThemeName } from 'tamagui'

export const useColors = (themeName?: ThemeName) => {
  const fallback = useThemeName()
  return useTheme({
    name: themeName || fallback,
  })
}
