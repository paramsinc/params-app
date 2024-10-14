import { Logo } from 'app/ds/Logo'
import { View } from 'app/ds/View'
import { useHotKeys } from 'app/helpers/use-hotkeys'
import { useLatestCallback } from 'app/helpers/use-latest-callback'
import { useRouter } from 'app/navigation/use-router'

export function BlankHome() {
  const router = useRouter()
  const keys = useHotKeys(
    'f',
    useLatestCallback(() => {
      router.push('/@francois')
    })
  )
  return (
    <View grow center>
      <Logo height={100} />
    </View>
  )
}
