import { objectFromEntries, objectKeys } from './helpers'
import { color, colorTokens } from './token-colors'

export const palettes = (() => {
  const transparent = (hsl: string, opacity = 0) =>
    hsl.replace(`%)`, `%, ${opacity})`).replace(`hsl(`, `hsla(`)

  const getColorPalette = (colors: object, accentColors: object): string[] => {
    const colorPalette = Object.values(colors)
    // make the transparent color vibrant and towards the middle
    const colorI = colorPalette.length - 4

    // accents
    const accentPalette = Object.values(accentColors)
    const accentBackground = accentPalette[0]
    const accentColor = accentPalette[accentPalette.length - 1]

    // add our transparent colors first/last
    // and make sure the last (foreground) color is white/black rather than colorful
    // this is mostly for consistency with the older theme-base
    return [
      accentBackground,
      transparent(colorPalette[0], 0),
      transparent(colorPalette[0], 0.25),
      transparent(colorPalette[0], 0.5),
      transparent(colorPalette[0], 0.75),
      ...colorPalette,
      transparent(colorPalette[colorI], 0.75),
      transparent(colorPalette[colorI], 0.5),
      transparent(colorPalette[colorI], 0.25),
      transparent(colorPalette[colorI], 0),
      accentColor,
    ]
  }

  const brandColor = {
    light: color.blue4Light,
    dark: color.blue4Dark,
  }

  const lightPalette = [
    brandColor.light,
    color.white0,
    color.white025,
    color.white05,
    color.white075,
    color.white1,
    color.white2,
    color.white3,
    color.white4,
    color.white5,
    color.white6,
    color.white7,
    color.white8,
    color.white9,
    color.white10,
    color.white11,
    color.white12,
    color.black075,
    color.black05,
    color.black025,
    color.black0,
    brandColor.dark,
  ]

  const darkPalette = [
    brandColor.dark,
    color.black0,
    color.black025,
    color.black05,
    color.black075,
    color.black1,
    color.black2,
    color.black3,
    color.black4,
    color.black5,
    color.black6,
    color.black7,
    color.black8,
    color.black9,
    color.black10,
    color.black11,
    color.black12,
    color.white075,
    color.white05,
    color.white025,
    color.white0,
    brandColor.light,
  ]

  const lightColorNames = objectKeys(colorTokens.light)
  const lightPalettes = objectFromEntries(
    lightColorNames.map(
      (key, index) =>
        [
          `light_${key}`,
          getColorPalette(
            colorTokens.light[key],
            colorTokens.light[lightColorNames[(index + 1) % lightColorNames.length]]
          ),
        ] as const
    )
  )

  const darkColorNames = objectKeys(colorTokens.dark)
  const darkPalettes = objectFromEntries(
    darkColorNames.map(
      (key, index) =>
        [
          `dark_${key}`,
          getColorPalette(
            colorTokens.dark[key],
            colorTokens.light[darkColorNames[(index + 1) % darkColorNames.length]]
          ),
        ] as const
    )
  )

  const colorPalettes = {
    ...lightPalettes,
    ...darkPalettes,
  }

  return {
    light: lightPalette,
    dark: darkPalette,
    ...colorPalettes,
  }
})()
