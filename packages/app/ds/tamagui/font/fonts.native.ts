import { platform } from 'app/ds/platform'
import type fonts from './fonts'

if (platform.OS === 'android') {
  throw new Error('Add fonts in app/ds/tamagui/font/fonts.android.ts')
}

export default {
  heading: 'SF Pro Display',
  mono: 'SF Mono',
  body: 'SF Pro Display',
} satisfies typeof fonts
