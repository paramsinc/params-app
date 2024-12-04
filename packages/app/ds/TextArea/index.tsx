import { Input, inputStyle } from 'app/ds/Input'
import { platform } from 'app/ds/platform'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { ComponentProps, forwardRef } from 'react'
import { styled } from 'tamagui'

type Props = Pick<
  Omit<ComponentProps<typeof Input>, 'numberOfLines'>,
  | 'fontSize'
  | 'px'
  | 'py'
  | 'p'
  | 'br'
  | 'color'
  | 'width'
  | 'placeholder'
  | 'bg'
  | 'maxWidth'
  | 'autoFocus'
  | 'onBlur'
  | 'pl'
  | 'bw'
  | 'borderColor'
  | 'hoverStyle'
  | 'focusStyle'
  | 'placeholderTextColor'
  | 'aria-label'
  | 'onKeyPress'
  | 'disabled'
> & {
  value: string
  onChangeText: (text: string) => void
  styled?: boolean
}

const TextFrame = styled(Text, {
  opacity: 0,
  whiteSpace: 'pre',
  pointerEvents: 'none',
  fontFamily: '$body',
  variants: {
    unset: {
      false: inputStyle,
    },
  },
})

export const TextArea = forwardRef<Input, Props>(function TextArea(
  { styled = false, width, maxWidth, onBlur, ...props },
  ref
) {
  if (platform.OS === 'web') {
    let autoGrowText = props.value || ''
    if (autoGrowText.endsWith('\n')) {
      autoGrowText += '&nbsp;'
    }
    return (
      <View width={width} maxWidth={maxWidth}>
        <TextFrame fontSize={16} whiteSpace="pre-line" {...props} unset={!styled}>
          {autoGrowText || '&#8203;'}
        </TextFrame>
        <Input
          unset={!styled}
          whiteSpace="pre-line"
          position="absolute"
          top={0}
          left={0}
          right={0}
          onBlur={onBlur}
          bottom={0}
          {...props}
          ref={ref}
          multiline
        />
      </View>
    )
  }

  return (
    <Input
      unset={!styled}
      onBlur={onBlur}
      {...props}
      width={width}
      ref={ref}
      multiline
      maxWidth={maxWidth}
    />
  )
})

export type TextArea = Input
