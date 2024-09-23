import { styled } from 'app/ds/styled'
import { Input as TInput } from 'tamagui'

export const Input = styled(TInput, {
  unstyled: true,
  variants: {
    unset: {
      false: {
        fontSize: 16,
        px: '$2',
        py: '$1',
        bw: 1,
        boc: '$borderColor',
        fontFamily: '$body',
        bg: '$color3',
        color: '$color12',
      },
    },
    editable: {
      false: {
        cursor: 'not-allowed',
      },
      true: {},
    },
  } as const,
  defaultVariants: {
    unset: false,
    editable: true,
  },
})
