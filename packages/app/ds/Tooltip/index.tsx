import { Tooltip as TamaguiTooltip } from '@tamagui/tooltip'
import { styled, withStaticProperties } from 'tamagui'

export const Tooltip = withStaticProperties(
  styled(TamaguiTooltip, {
    delay: 0,
    restMs: 0,
    allowFlip: true,
    stayInFrame: {
      mainAxis: true,
      padding: 8,
    },

    placement: 'top',
  }),
  {
    Content: styled(TamaguiTooltip.Content, {
      py: '$2',
      px: '$2',
      zIndex: 1_000_000_000,
      br: '$2',
      enterStyle: { x: 0, y: 5, o: 0, scale: 0.9 },
      exitStyle: { x: 0, y: 5, o: 0, scale: 0.9 },
      scale: 1,
      x: 0,
      y: 0,
      o: 1,
      unstyled: true,
      bg: '$color2',
      animation: [
        'quick',
        {
          opacity: {
            overshootClamping: true,
          },
        },
      ],
      variants: {
        padded: {
          true: {
            br: '$3',
            bw: 2,
            boc: '$borderColor',
            p: '$2',
          },
        },
      } as const,
    }),
    Trigger: TamaguiTooltip.Trigger,
    Anchor: TamaguiTooltip.Anchor,
    Arrow: TamaguiTooltip.Arrow,
  }
)
