'use client'

import { Text as TamaguiText, styled } from 'tamagui'

export const Text = styled(TamaguiText, {
  fontFamily: "'jetbrains mono'",
  userSelect: 'auto',
  defaultVariants: {
    inherit: false,
  },
  variants: {
    bold: {
      true: {
        fontWeight: '600',
      },
      false: {
        fontWeight: '400',
      },
    },
    center: {
      true: {
        textAlign: 'center',
      },
    },
    inherit: {
      false: {
        fontSize: 15,
      },
    },
  } as const,
})