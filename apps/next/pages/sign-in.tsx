import { Auth } from 'app/auth'
import { View } from 'app/ds/View'

export default function SignIn() {
  return (
    <View ai="center" p="$4">
      <Auth.AuthFlow />
    </View>
  )
}
