import {
  Spinner,
  ThemeName,
  getConfig,
  variableToString,
  useThemeName,
  ColorProp,
  SpinnerProps,
} from 'tamagui'

export const LoadingSpinner = (props: {
  theme?: ThemeName
  color?: ColorProp
  hide?: boolean
  size?: SpinnerProps['size']
}) => {
  const themeName = useThemeName()
  const {
    theme = themeName,
    color = !theme || theme.includes('dark') ? '$color12' : '$color12',
    hide = false,
    size,
  } = props
  const tokens = getConfig().tokens
  const tokenValue = tokens.color[color.toString().replace('$', '')]
  return (
    <Spinner
      theme={theme}
      opacity={hide ? 0 : 1}
      size={size}
      color={tokenValue ? variableToString(tokenValue) : color.toString()}
    />
  )
}
