'use dom'
import { useStripeConnectForProfile } from 'app/features/profile/stripe/use-stripe-connect'
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
  ConnectPayoutsList,
  ConnectAccountManagement,
} from '@stripe/react-connect-js'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'

export function ConnectAccountContent(props: {
  profileSlug: string
  onComplete: () => void
  element?: 'onboarding' | 'payouts'
}) {
  const { stripe, sessionQuery } = useStripeConnectForProfile(props)
  const { toast } = useToast()

  if (!stripe) return null // TODO: show loading state
  const paymentsEnabled = sessionQuery.data?.payments_enabled
  const s = (
    <ConnectComponentsProvider connectInstance={stripe}>
      {paymentsEnabled ? (
        <ConnectAccountManagement />
      ) : (
        <ConnectAccountOnboarding
          onExit={() => props.onComplete()}
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
      )}
    </ConnectComponentsProvider>
  )

  return (
    <View grow style={{ overflowY: 'auto', backgroundColor: 'white', padding: 16 }}>
      {s}
    </View>
  )
}
