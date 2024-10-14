import { LoadingSpinner } from 'app/ds/LoadingSpinner'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'
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
})

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
        <View stretch center>
          <LoadingSpinner color="$color12" />
        </View>
      )}
    </Frame>
  )
})

export const ButtonText = styled(Text, {
  context,
  userSelect: 'none',

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
})
