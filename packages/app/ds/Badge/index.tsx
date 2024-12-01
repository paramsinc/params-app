import { GetProps, styled, withStaticProperties } from 'tamagui'
import { Text } from '../Text'
import { View } from '../View'
import type * as Lucide from '@tamagui/lucide-icons'

import { getTokens } from '@tamagui/core'
import { getButtonSized as getSize } from '@tamagui/get-button-sized'
import { createContext, useContext } from 'react'

const BadgeContext = createContext<GetProps<typeof BadgeFrame>>({})

const BadgeFrame = styled(View, {
  fd: 'row',
  space: '$1',
  bg: '$color3',
  px: 6,
  ai: 'center',
  borderWidth: 1,
  borderColor: 'transparent',
  variants: {
    size: {
      '...size': getSize,
      ':number': (val) => ({
        paddingHorizontal: val * 0.1,
        height: val,
        borderRadius: val * 0.2,
      }),
    },
    rounded: {
      true: {
        borderRadius: '$rounded',
      },
    },
    border: {
      true: {
        // borderWidth: 2,
        borderColor: '$color6',
      },
    },
    mode: {
      outlined: {
        bg: 'transparent',
        borderColor: '$color3',
      },
      contrast: {
        bg: '$color10',
        borderColor: '$color10',
      },
    },
  } as const,
  defaultVariants: {
    rounded: true,
    border: true,
  },
})

const BadgeTextFrame = styled(Text, {
  color: '$color11',
  variants: {
    mode: {
      outlined: {
        color: '$color11',
      },
      contrast: {
        color: '$contrastColor',
      },
    },
  } as const,
})

const BadgeText = BadgeTextFrame.styleable(function BadgeText(props, ref) {
  const { mode, size } = useContext(BadgeContext)

  return (
    <BadgeTextFrame
      userSelect="none"
      mode={mode}
      fontSize={size as any}
      lineHeight={size as any}
      ref={ref}
      {...props}
    />
  )
})

const Dot = styled(View, {
  width: 4,
  height: 4,
  borderRadius: 999,
  bg: '$color11',
})

const Icon = (
  props: GetProps<(typeof Lucide)['Accessibility']> & {
    icon: (typeof Lucide)['Accessibility']
  }
) => {
  const { icon: Icon, ...rest } = props
  // @ts-ignore
  const { size = '$4' } = useContext(BadgeContext)
  let tokenSize = 14
  return <Icon color="$color11" size={tokenSize} {...rest} />
}

export const Badge = withStaticProperties(
  BadgeFrame.styleable(function Badge(props, ref) {
    return (
      <BadgeContext.Provider value={props}>
        <BadgeFrame {...props} ref={ref} />
      </BadgeContext.Provider>
    )
  }),
  {
    Text: BadgeText,
    Dot,
    Icon,
  }
)
