import { useMemo } from 'react'
import { LinearGradient } from '@tamagui/linear-gradient'
import { useColors } from '../useColors'
import { gradientPropsFromCSS } from './from-css'
import { GradientProps } from './types'

export default function LinearNative(props: GradientProps) {
  const colors = useColors()
  const gradient =
    'gradient' in props &&
    (typeof props.gradient === 'function'
      ? props.gradient((key) => {
          const variable = colors[key]
          return variable?.val ?? key
        })
      : props.gradient)

  const gradProps = useMemo(() => {
    if (gradient) {
      return gradientPropsFromCSS(gradient)
    }
  }, [gradient])

  return <LinearGradient fullscreen={props.stretch} {...props} {...gradProps} />
}
