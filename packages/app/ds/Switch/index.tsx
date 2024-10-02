import { View } from 'app/ds/View'
import { ComponentProps } from 'react'
import { Switch as TSwitch, createStyledContext, styled } from 'tamagui'
import { MotiView } from 'moti'

const padding = 2

const thumbSize = 20

const width = thumbSize * 2 + padding * 2
const height = thumbSize + padding * 2

const xChecked = width - thumbSize - padding

console.log('[switch.thumb]', {
  xChecked,
})

const Thumb = styled(TSwitch.Thumb, {
  unstyled: true,
  bg: '$color12',
  height: thumbSize,
  width: thumbSize,
  br: '$rounded',
  variants: {
    checked: {
      true: {
        bg: '$brandContrast',
        // x: xChecked,
      },
      false: {
        bg: '$color11',
        // x: padding,
      },
    },
  } as const,
})

const Frame = styled(View, {
  borderRadius: '$rounded',
  borderWidth: 0,
  padding: 0,
  width: width,
  cur: 'pointer',
  height,
  minHeight: 0,
  justifyContent: 'center',
  variants: {
    checked: {
      true: {
        bg: '$brand',
      },
      false: {
        bg: '$color5',
        pressStyle: {
          bg: '$color6',
        },
      },
    },
  } as const,
})

export const Switch = ({
  checked,
  onCheckedChange,
  id,
  labeledBy,
  disabled,
  onPress,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  labeledBy?: string
  disabled?: boolean
  onPress?: ComponentProps<typeof Frame>['onPress']
}) => {
  return (
    <Frame
      checked={checked}
      id={id}
      disabled={disabled}
      onPress={(e) => {
        onPress?.(e)
        // haptic?.selectionAsync()
        onCheckedChange(!checked)
      }}
      height={height}
    >
      <MotiView
        animate={{ translateX: checked ? xChecked : padding }}
        transition={{
          // decently quick spring meant for a switch toggle
          type: 'spring',
          damping: 10,
          stiffness: 100,
          mass: 0.5,
        }}
      >
        <Thumb checked={checked} animation="quick" />
      </MotiView>
    </Frame>
  )
}
