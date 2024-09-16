import React, { ComponentProps } from 'react'
import { View } from '../View'
import { Theme, ThemeName, styled } from 'tamagui'
import { focusedItemContext } from './focusedItemContext'

const Container = styled(View, {
  variants: {
    row: {
      true: {
        fd: 'row',
        ai: 'center',
      },
    },
  } as const,
  defaultVariants: {
    row: true,
  },
})

export const ItemFrame = ({
  children,
  focused,
  destructive,
  theme = destructive ? 'red' : undefined,
  height = 32,
  row = true,
  px = '$3',
}: {
  children: React.ReactNode
  focused: boolean
  destructive?: boolean
  theme?: ThemeName
  height?: number | 'auto'
  row?: boolean
  px?: ComponentProps<typeof View>['px']
}) => {
  return (
    <Theme name={theme}>
      <focusedItemContext.Provider value={focused}>
        <Container cursor='pointer' height={height} row={row} px={px}>
          <View
            zi={-1}
            fullscreen
            // TODO tix-web light mode?
            bg={destructive ? '$color4' : 'rgba(124, 124, 163, 0.125)'}
            $theme-light={{
              bg: destructive ? '$color4' : 'rgba(216, 216, 216, 0.125)',
            }}
            borderRadius={6}
            left={4}
            right={4}
            opacity={focused ? 1 : 0}
            className='dropdown-menu-item-frame-focus-indicator context-menu-item-frame-focus-indicator'
          />
          {children}
        </Container>
      </focusedItemContext.Provider>
    </Theme>
  )
}
