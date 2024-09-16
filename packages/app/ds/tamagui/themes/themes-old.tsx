import { addChildren, createTheme } from '@tamagui/create-theme'
import { mauve, slate, mauveDark, slateDark } from '@tamagui/colors'

import { colorTokens } from '@tamagui/themes'
import { keys } from 'app/helpers/object'

export const darkColors = {
  ...colorTokens.dark.blue,
  ...colorTokens.dark.gray,
  ...colorTokens.dark.green,
  ...colorTokens.dark.orange,
  ...colorTokens.dark.pink,
  ...colorTokens.dark.purple,
  ...colorTokens.dark.red,
  ...colorTokens.dark.yellow,
}

export const lightColors = {
  ...colorTokens.light.blue,
  ...colorTokens.light.gray,
  ...colorTokens.light.green,
  ...colorTokens.light.orange,
  ...colorTokens.light.pink,
  ...colorTokens.light.purple,
  ...colorTokens.light.red,
  ...colorTokens.light.yellow,
}

type ColorName = keyof typeof colorTokens.dark

const lightTransparent = 'rgba(255,255,255,0)'
const darkTransparent = 'rgba(10,10,10,0)'

// background => foreground
const palettes = {
  light: [
    lightTransparent, // transparent
    slate.slate1,
    slate.slate2,
    slate.slate3,
    slate.slate4,
    slate.slate5,
    slate.slate6,
    slate.slate7,
    slate.slate8,
    slate.slate9,
    slate.slate10,
    slate.slate11,
    slate.slate12,
    darkTransparent,
    'black', // contrast foreground
    'white', // background strong
  ],
  dark: [
    darkTransparent,
    slateDark.slate1,
    slateDark.slate2,
    slateDark.slate3,
    slateDark.slate4,
    slateDark.slate5,
    slateDark.slate6,
    slateDark.slate7,
    slateDark.slate8,
    slateDark.slate9,
    slateDark.slate10,
    slateDark.slate11,
    slateDark.slate12,
    lightTransparent,
    'white',
    'black',
  ],
}

const templateColors = {
  color1: 1,
  color2: 2,
  color3: 3,
  color4: 4,
  color5: 5,
  color6: 6,
  color7: 7,
  color8: 8,
  color9: 9,
  color10: 10,
  color11: 11,
  color12: 12,
}

const templateShadows = {
  shadowColor: 1,
  shadowColorHover: 1,
  shadowColorPress: 2,
  shadowColorFocus: 2,
}

// we can use subset of our template as a "skip" so it doesn't get adjusted with masks
const skip = {
  ...templateColors,
  ...templateShadows,
}

// templates use the palette and specify index
// negative goes backwards from end so -1 is the last item
const template = {
  ...skip,
  // the background, color, etc keys here work like generics - they make it so you
  // can publish components for others to use without mandating a specific color scale
  // the @tamagui/button Button component looks for `$background`, so you set the
  // dark_red_Button theme to have a stronger background than the dark_red theme.
  background: 2,
  backgroundHover: 3,
  backgroundPress: 1,
  backgroundFocus: 2,
  backgroundStrong: -0,
  backgroundTransparent: 0,
  color: -3,
  colorHover: -4,
  colorPress: -3,
  colorFocus: -4,
  colorTransparent: -2,
  borderColor: 4,
  borderColorHover: 5,
  borderColorPress: 3,
  borderColorFocus: 4,
  placeholderColor: -7,
  contrastColor: -1,
}

const lightShadowColor = 'rgba(0,0,0,0.02)'
const lightShadowColorStrong = 'rgba(0,0,0,0.066)'
const darkShadowColor = 'rgba(0,0,0,0.2)'
const darkShadowColorStrong = 'rgba(0,0,0,0.3)'

const lightShadows = {
  shadowColor: lightShadowColorStrong,
  shadowColorHover: lightShadowColorStrong,
  shadowColorPress: lightShadowColor,
  shadowColorFocus: lightShadowColor,
}

const darkShadows = {
  shadowColor: darkShadowColorStrong,
  shadowColorHover: darkShadowColorStrong,
  shadowColorPress: darkShadowColor,
  shadowColorFocus: darkShadowColor,
}

const lightTemplate = {
  ...template,
  // our light color palette is... a bit unique
  borderColor: 6,
  borderColorHover: 7,
  borderColorFocus: 5,
  borderColorPress: 6,
  ...lightShadows,
}

const darkTemplate = { ...template, ...darkShadows }

const light = createTheme(palettes.light, lightTemplate)
const dark = createTheme(palettes.dark, darkTemplate)

type SubTheme = typeof light

const baseThemes: {
  light: SubTheme
  dark: SubTheme
} = {
  light,
  dark,
}

const allThemes = addChildren(baseThemes, (name, theme) => {
  const isLight = name === 'light'
  const inverseName = isLight ? 'dark' : 'light'
  const transparent = (hsl: string, opacity = 0) =>
    hsl.replace(`%)`, `%, ${opacity})`).replace(`hsl(`, `hsla(`)

  // setup colorThemes and their inverses
  const [colorThemes] = [colorTokens[name], colorTokens[inverseName]].map(
    (colorSet) => {
      return Object.fromEntries(
        keys(colorSet).map((color) => {
          const colorPalette = Object.values(colorSet[color]) as string[]
          // were re-ordering these

          const [head, tail] = [colorPalette.slice(0, 6), colorPalette.slice(6)]
          const contrasts: Record<typeof color, 'black' | 'white'> = {
            blue: 'white',
            gray: 'white',
            green: 'white',
            orange: 'white',
            pink: 'white',
            purple: 'white',
            red: 'white',
            yellow: 'black',
          }
          // add our transparent colors first/last
          // and make sure the last (foreground) color is white/black rather than colorful
          // this is mostly for consistency with the older theme-base
          const palette = [
            transparent(colorPalette[0]!),
            ...head,
            ...tail,
            theme.color,
            transparent(colorPalette[colorPalette.length - 1]!),
            contrasts[color], // contrastColor
            isLight ? 'white' : 'black', // backgroundStrong
          ]
          const colorTheme = createTheme(
            palette,
            isLight
              ? {
                  ...lightTemplate,
                  // light color themes are a bit less sensitive
                  borderColor: 4,
                  borderColorHover: 5,
                  borderColorFocus: 4,
                  borderColorPress: 4,
                }
              : darkTemplate
          )
          return [color, colorTheme]
        })
      ) as Record<ColorName, SubTheme>
    }
  )

  return {
    ...colorThemes,
  }
})

export const themesNew = {
  ...allThemes,
  // bring back the full type, the rest use a subset to avoid clogging up ts,
  // tamagui will be smart and use the top level themes as the type for useTheme() etc
  light: createTheme(palettes.light, lightTemplate, {
    nonInheritedValues: lightColors,
  }),
  dark: createTheme(palettes.dark, darkTemplate, {
    nonInheritedValues: darkColors,
  }),
}

export const themes = themesNew
