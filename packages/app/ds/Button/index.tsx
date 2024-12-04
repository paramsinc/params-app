import { LoadingSpinner } from 'app/ds/LoadingSpinner'
import { platform } from 'app/ds/platform'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import { useContext } from 'app/react'
import { createStyledContext } from 'tamagui'

const height = 32

const context = createStyledContext<{ loading?: boolean; inverse?: boolean }>({
  loading: false,
  inverse: false,
})

const borderWidth = 0

const Frame = styled(View, {
  py: 0,
  px: '$2.5',
  height,
  bg: '$color3',
  bw: borderWidth,
  boc: '$color6',
  animation: '100ms',
  scale: 1,
  style: {
    // @ts-ignore
    '--icon-color': 'var(--color11)',
  },
  hoverStyle: {
    // bg: '$color4',
    scale: 1.02,
    // @ts-ignore
    '--icon-color': 'var(--color12)',
  },
  context,
  variants: {
    loading: {
      true: {
        cursor: 'not-allowed',
        opacity: 0.5,
      },
      false: {
        opacity: 1,
      },
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
        opacity: 0.5,
      },
      false: {
        cursor: 'pointer',
      },
    },
    square: {
      true: {
        width: height,
      },
    },
    inverse: {
      true: {
        bg: '$color12',
        boc: '$color9',
        '--icon-color': 'var(--color1)',
      },
    },
  } as const,
  jc: 'center',
  tag: 'button',
  row: true,
  br: 8,
  gap: '$2',
  testID: 'button',
})

export const ButtonIcon = (props: {
  icon: React.ComponentType<{ color?: any; size?: number }>
  scale?: number
}) => {
  const ctx = useContext(context)
  const loading = ctx && typeof ctx === 'object' && 'loading' in ctx && ctx.loading

  const iconSize = height * (props.scale ?? 0.5)
  return (
    <View
      height={height - borderWidth * 2}
      jc="center"
      opacity={loading ? 0 : 1}
      ai="center"
      width="auto"
      minWidth={iconSize}
    >
      <View o={loading ? 0 : 1}>
        <props.icon
          color={platform.select({
            web: 'var(--icon-color)',
            native: '$color11',
          })}
          size={iconSize}
        />
      </View>
    </View>
  )
}

const ButtonFrame = Frame.styleable<{ loading?: boolean }>((props) => {
  const { children, ...rest } = props

  return (
    <Frame
      {...rest}
      disabled={props.disabled || props.loading || false}
      loading={props.loading || false}
    >
      {children}
      {props.loading && (
        <View stretch center key="loading">
          <LoadingSpinner color="$color12" />
        </View>
      )}
    </Frame>
  )
})

export const ButtonText = styled(Text, {
  context,
  userSelect: 'none',

  fontFamily: '$mono',
  lineHeight: height - borderWidth * 2,
  bold: true,
  variants: {
    loading: {
      true: {
        opacity: 0,
      },
      false: {
        opacity: 1,
      },
    },
    inverse: {
      true: {
        color: '$color1',
      },
    },
  } as const,
})

export const Button = withStaticProperties(ButtonFrame, {
  Text: ButtonText,
  Icon: ButtonIcon,
})
