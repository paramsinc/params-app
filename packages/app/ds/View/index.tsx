'use client'

import { platform } from 'app/ds/platform'
import { styled, YStack } from 'tamagui'

export const View = styled(YStack, {
  variants: {
    jbtwn: {
      true: {
        justifyContent: 'space-between',
      },
    },
    row: {
      true: {
        fd: 'row',
      },
      wrap: {
        flexWrap: 'wrap',
        fd: 'row',
      },
      reverse: {
        flexDirection: 'row-reverse',
      },
    },
    grow: {
      true: {
        fg: 1,
        fb: 0,
      },
    },
    box: {
      '...size': (size) => {
        return {
          width: size,
          height: size,
        }
      },
      ':number': (number) => {
        return {
          width: number,
          height: number,
        }
      },
    },
    center: {
      true: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    inlineFlex: {
      true: {
        '$platform-web': {
          display: 'inline-flex',
        },
      },
    },
    absolute: {
      true: {
        position: 'absolute',
      },
    },
    stretch: {
      true: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },

      web: {
        ...platform.select({
          web: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          } as const,
          default: {
            flex: 1,
          },
        }),
      },
    },
  } as const,
})
