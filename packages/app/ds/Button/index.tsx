import { LoadingSpinner } from 'app/ds/LoadingSpinner'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { withStaticProperties } from 'app/ds/withStaticProperties'
import { createStyledContext } from 'tamagui'
import { useContext } from 'react'

const height = 30

const context = createStyledContext<{ loading?: boolean }>()

const Frame = styled(View, {
  px: '$2',
  height,
  bg: '$color4',
  // bw: 1,
  boc: '$color11',
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
  defaultVariants: {
    disabled: false,
    loading: false,
  },
  jc: 'center',
  row: true,
})

const ButtonFrame = Frame.styleable<{ loading?: boolean }>((props) => {
  const { children, ...rest } = props

  return (
    <Frame
      {...rest}
      disabled={props.loading ?? props.disabled ?? false}
      loading={props.loading ?? false}
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
  // textDecorationLine: 'underline',

  lineHeight: height,
  bold: true,
  context,
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
  defaultVariants: {
    loading: false,
  },
})

export const Button = withStaticProperties(ButtonFrame, {
  Text: ButtonText,
})
