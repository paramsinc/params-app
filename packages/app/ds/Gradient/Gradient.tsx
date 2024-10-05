import { useColors } from '../useColors'
import { View } from '../View'
import { GradientProps } from './types'

export default View.styleable<
  GradientProps & {
    stretch?: boolean
  }
>(function LinearGradient({ ...props }) {
  const colors = useColors()

  const { gradient: grad, stretch = true, ...p } = props
  const gradient =
    typeof grad === 'function'
      ? grad((key) => {
          const variable = key in colors ? colors[key] : undefined
          return variable?.val ?? key
        })
      : grad

  console.log('gradient', gradient)

  return (
    <View stretch={stretch} {...p} backgroundImage={gradient} testID="gradient" debug="verbose" />
  )
})
