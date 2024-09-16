export {
  blue,
  blueDark,
  gray,
  grayDark,
  green,
  greenDark,
  orange,
  orangeDark,
  pink,
  pinkDark,
  purple,
  purpleDark,
  red,
  redDark,
  yellow,
  yellowDark,
} from '@tamagui/themes'

import { mauve, slate, mauveDark, slateDark } from '@tamagui/colors'

export const lightTransparent = 'rgba(255,255,255,0)'
export const darkTransparent = 'rgba(10,10,10,0)'

// background => foreground
const palettes = {
  light: [
    lightTransparent, // transparent
    mauve.mauve1,
    mauve.mauve2,
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
    mauveDark.mauve1,
    mauveDark.mauve2,
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

export const lightColor = 'hsl(0, 0%, 9.0%)'
export let lightPalette = [
  lightTransparent,
  '#fff',
  '#f9f9f9',
  'hsl(0, 0%, 97.3%)',
  'hsl(0, 0%, 95.1%)',
  'hsl(0, 0%, 94.0%)',
  'hsl(0, 0%, 92.0%)',
  'hsl(0, 0%, 89.5%)',
  'hsl(0, 0%, 81.0%)',
  'hsl(0, 0%, 56.1%)',
  'hsl(0, 0%, 50.3%)',
  'hsl(0, 0%, 42.5%)',
  lightColor,
  darkTransparent,
]

lightPalette = palettes.light

export const darkColor = '#fff'
export const darkPalette = [
  darkTransparent,
  '#050505',
  '#151515',
  '#191919',
  '#232323',
  '#282828',
  '#323232',
  '#424242',
  '#494949',
  '#545454',
  '#626262',
  '#a5a5a5',
  darkColor,
  lightTransparent,
]
