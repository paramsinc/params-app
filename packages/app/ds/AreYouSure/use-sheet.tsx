import { useActionSheet as useExpoSheet } from '@expo/react-native-action-sheet'
import { fontVars } from 'app/ds/tamagui/font/font-vars'
import { useColors } from 'app/ds/useColors'
import { useThemeName } from 'app/ds/useThemeName'
import { useCallback } from 'react'
import { Platform } from 'react-native'
import { getConfig } from 'tamagui'

export function useActionSheet() {
  const { showActionSheetWithOptions } = useExpoSheet()
  type Props = Parameters<typeof showActionSheetWithOptions>

  const c = useColors()
  const red = useColors('red')
  const fig = getConfig()
  const theme = useThemeName()

  const show = useCallback(
    (props: Props[0], callback: Props[1]) => {
      const { options, cancelButtonIndex, title, message, destructiveButtonIndex } = props
      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title,
          message,
          titleTextStyle: {
            color: c.color12.val,
            fontFamily: `var(${fontVars.body})`,
            fontWeight: 'bold',
          },
          containerStyle: {
            backgroundColor: c.color3.val,
            alignSelf: 'center',
            justifyContent: 'center',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            width: '100%',
            maxWidth: 800,
          },
          textStyle: {
            color: c.color12.val,
            fontFamily: `var(${fontVars.body})`,
          },
          messageTextStyle: {
            color: c.color11.val,
            fontFamily: `var(${fontVars.body})`,
          },
          separatorStyle: {
            backgroundColor: c.color5.val,
          },
          showSeparators: true,
          tintColor: c.color12.val,
          destructiveColor: red.color11.val,
          useModal: Platform.OS === 'web',
          userInterfaceStyle: theme.includes('dark') ? 'dark' : 'light',
        },
        callback
      )
    },
    [c, fig, showActionSheetWithOptions, theme]
  )

  return show
}
