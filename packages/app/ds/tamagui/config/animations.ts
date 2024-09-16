import { createAnimations } from '@tamagui/animations-css'

export const animations = createAnimations({
  '100ms': 'linear 100ms',
  '200ms': 'linear 200ms',
  bouncy: 'ease-out 100ms',
  lazy: 'ease-out 400ms',
  quick: 'ease-out 150ms',
  medium: 'ease-out 600ms',
  slow: 'ease-out 1000ms',
  tooltip: 'ease-out 200ms',
})
