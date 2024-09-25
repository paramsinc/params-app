'use dom'
import { useStripeConnectForProfile } from 'app/features/profile/stripe/use-stripe-connect'
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from '@stripe/react-connect-js'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { Scroll } from 'app/ds/Scroll'

export function ConnectAccountContent(props: {
  profileSlug: string
  onComplete: () => void
}) {
  const { stripe } = useStripeConnectForProfile(props)
  const { toast } = useToast()

  if (!stripe) return null // TODO: show loading state
  const s = (
    <ConnectComponentsProvider connectInstance={stripe}>
      <ConnectAccountOnboarding
        onExit={props.onComplete}
        collectionOptions={{
          fields: 'eventually_due',
          futureRequirements: 'include',
        }}
        onLoadError={() => {
          toast({
            title: 'Stripe Error',
            preset: 'error',
            message: `Please try again.`,
          })
        }}
      />
    </ConnectComponentsProvider>
  )

  return (
    <View grow overflow="auto">
      {/* <Scroll> */}
      {s}
      {/* </Scroll> */}
    </View>
  )
}
