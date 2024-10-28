import { LoadingSpinner } from 'app/ds/LoadingSpinner'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import { useContext } from 'app/react'
import { createStyledContext } from 'tamagui'

const height = 32

const context = createStyledContext<{ loading?: boolean }>({
  loading: false,
})

const borderWidth = 2

const Frame = styled(View, {
  px: '$2',
  height,
  bg: '$color3',
  bw: borderWidth,
  boc: '$color6',
  hoverStyle: {
    bg: '$color4',
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
  } as const,
  jc: 'center',
  tag: 'button',
  row: true,
  br: 6,
  gap: '$2',
})

export const ButtonIcon = (props: {
  icon: React.ComponentType<{ color?: any; size?: number }>
  scale?: number
}) => {
  const ctx = useContext(context)
  const loading = ctx && typeof ctx === 'object' && 'loading' in ctx && ctx.loading
  // const height = (typeof size === 'number' ? size : getTokens()?.size[size]?.val) ?? 0
  // const tokens = getTokens()

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
        <props.icon color={'$color11'} size={iconSize} />
      </View>
      {loading && (
        <View pos="absolute" top={0} left={0} right={0} bottom={0} ai="center" jc="center">
          <LoadingSpinner size="small" color={'$color11'} />
        </View>
      )}
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
  } as const,
})

export const Button = withStaticProperties(ButtonFrame, {
  Text: ButtonText,
  Icon: ButtonIcon,
})
