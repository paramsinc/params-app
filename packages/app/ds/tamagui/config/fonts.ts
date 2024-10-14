import { createInterFont } from '@tamagui/font-inter'
import { createFont } from '@tamagui/core'
import { keys } from 'app/helpers/object'
import { fontVars } from 'app/ds/tamagui/font/font-vars'

const fontSizesBase = {
  // copied from: https://github.com/tamagui/tamagui/blob/968fb22afd1f9e4e313e7bf646f56aa89770203b/packages/font-inter/src/index.ts#L42
  1: 11,
  2: 12,
  3: 13,
  4: 14,
  5: 16,
  6: 18,
  7: 20,
  8: 23,
  9: 30,
  10: 46,
  11: 55,
  12: 62,
  13: 72,
  14: 92,
  15: 114,
  16: 134,
} satisfies Record<number, number>

const fontSizes = keys(fontSizesBase).reduce((acc, next) => {
  return {
    ...acc,
    [next]: fontSizesBase[next],
    true: 14,
  }
}, {} as Record<0 | keyof typeof fontSizesBase, number>)

const lineHeights = keys(fontSizesBase).reduce((acc, next) => {
  return {
    ...acc,
    [next]: fontSizesBase[next] * 1.2,
  }
}, {} as Record<`${keyof typeof fontSizesBase}`, number>)

export const monoFont = createFont({
  family: `var(${fontVars.mono})`,
  letterSpacing: {},
  lineHeight: lineHeights || {},
  size: fontSizes,

  weight: {},
  face: {},
})

export const roundFont = createFont({
  family: `var(${fontVars.heading})`,
  letterSpacing: {},
  lineHeight: lineHeights || {},
  size: fontSizes,
  weight: {},
  face: {
    // TODO native
  },
})

export const bodyFont = createInterFont(
  {
    face: {
      700: { normal: 'InterBold' },
    },
  },
  {
    sizeSize: (size) => Math.round(size * 1.1),
    sizeLineHeight: (size) => size + 5,
  }
)
