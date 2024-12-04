import { useLatestCallback } from 'app/helpers/use-latest-callback'
import { useActionSheet } from './use-sheet'

type Props = {
  title: string
  /**
   * Shown under the title
   */
  message?: string
  /**
   * Default: `Yes, I'm sure`.
   */
  dangerousText?: string
  /**
   * Default: `Cancel`
   */
  cancelText?: string
}

type Callback = () => void | Promise<void>

export default function useAreYouSure() {
  const showActionSheetWithOptions = useActionSheet()

  return useLatestCallback(
    async (
      callback: Callback,
      {
        title,
        message,
        cancelText = 'Cancel',
        dangerousText = `Yes, I'm sure.`,
        onCancel,
      }: Props & {
        onCancel?: () => void
      }
    ) => {
      const options = [cancelText, dangerousText]

      const cancelButtonIndex = 0
      const destructiveButtonIndex = 1
      return new Promise((resolve) => {
        showActionSheetWithOptions(
          {
            title,
            message,
            options,
            cancelButtonIndex,
            destructiveButtonIndex,
          },
          (index) => {
            if (index === cancelButtonIndex) {
              onCancel?.()
            } else if (index === destructiveButtonIndex) {
              callback()
            }
            resolve(index)
          }
        )
      })
    }
  )
}
