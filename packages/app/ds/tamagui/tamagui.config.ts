import { shorthands } from '@tamagui/shorthands'
import { createTokens, createTamagui, setupDev } from 'tamagui'

import { animations } from './config/animations'
import { bodyFont, monoFont, roundFont } from './config/fonts'
import { media, mediaQueryDefaultActive } from './config/media'
import { color } from './themes/token-colors'
import { radius } from './themes/token-radius'
import { size } from './themes/token-size'
import { zIndex } from './themes/token-z-index'
import { themesNew } from './themes/themes-old'

// Hold down Option for a second to see some helpful visuals
setupDev({
  visualizer: true,
})

/**
 * This avoids shipping themes as JS. Instead, Tamagui will hydrate them from CSS.
 */

const themes =
  process.env.TAMAGUI_TARGET !== 'web' || process.env.TAMAGUI_IS_SERVER || process.env.STORYBOOK
    ? themesNew
    : ({} as typeof themesNew)

const { bc, ...alias } = shorthands

export const tamaguiConfig = createTamagui({
  themes,
  animations,
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: true,
  mediaQueryDefaultActive,
  selectionStyles: (theme) => {
    console.log('[selectionStyles]', Object.keys(theme))
    return {
      backgroundColor: theme.pinkDark10,
      color: theme.pinkDark12,
    }
  },
  shorthands: {
    ...alias,
    d: 'display',
    align: 'textAlign',
    bg: 'backgroundColor',
    weight: 'fontWeight',
    radius: 'borderRadius',
  } as const,
  fonts: {
    heading: roundFont,
    body: monoFont,
  },
  defaultFont: 'body',

  tokens: createTokens({
    color,
    radius: {
      ...radius,
      rounded: 999999,
    },
    zIndex,
    space: {
      0: 0,
      0.5: 2,
      1: 4,
      1.5: 6,
      2: 8,
      2.5: 12,
      3: 16,
      4: 32,
      5: 64,
      6: 128,
      7: 256,
      '-1': -4,
      '-2': -8,
      '-3': -16,
      '-4': -32,
      true: 16,
      marketingPageWidth: 900,
    },
    size,
    // space: space,
  }),
  media,
  settings: {
    // allowedStyleValues: 'somewhat-strict',
    // autocompleteSpecificTokens: 'except-special',
    fastSchemeChange: true,
  },
})

type ThemeConfig = typeof tamaguiConfig

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends ThemeConfig {}
}

export default tamaguiConfig
