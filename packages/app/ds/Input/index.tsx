import { styled } from 'app/ds/styled'
import { Input as TInput } from 'tamagui'
import type * as native from 'react-native'

export const inputStyle = {
  fontSize: 16,
  px: '$2',
  py: '$1',
  bw: 1,
  boc: '$borderColor',
  fontFamily: '$body',
  bg: '$color3',
  color: '$color12',
  br: '$3',
} as const

export const Input = styled(TInput, {
  unstyled: true,
  variants: {
    unset: {
      false: inputStyle,
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

export type Input = native.TextInput
