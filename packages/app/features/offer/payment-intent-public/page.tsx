import { Select } from 'app/db/client'
import { PaymentIntentStatus } from 'app/db/enums'
import { ErrorCard } from 'app/ds/Error/card'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { ThemeName } from 'app/ds/ThemeName'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'

export type OfferPaymentIntentPublicPageParams = {
  payment_intent_id: string
  redirect_status: string
  client_secret: string
}
const { useParams } = createParam<OfferPaymentIntentPublicPageParams>()

export function OfferPaymentIntentPublicPage() {
  const { params } = useParams()
  const query = api.offerByPaymentIntentId.useQuery(
    {
      payment_intent_id: params.payment_intent_id,
      payment_intent_client_secret: params.client_secret,
    },
    {
      refetchInterval(query) {
        if (query.state.data?.paymentIntent.status === 'succeeded') {
          return false
        }
        return 4000
      },
    }
  )

  if (!query.data) {
    return <ErrorCard error={query.error} />
  }

  const { paymentIntent, offer } = query.data

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content>
          <ErrorCard error={query.error} />
          <Text>{JSON.stringify(query.data, null, 2)}</Text>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

const dipslayPaymentIntentStatus = {
  succeeded: {
    title: 'Succeeded',
    theme: 'green',
  },
  processing: {
    title: 'Processing',
    theme: 'blue',
  },
  requires_payment_method: {
    title: 'Requires Payment Method',
    theme: 'red',
  },
  requires_confirmation: {
    title: 'Requires Confirmation',
    theme: 'yellow',
  },
  requires_action: {
    title: 'Requires Action',
    theme: 'yellow',
  },
  canceled: {
    title: 'Canceled',
    theme: 'red',
  },
  requires_capture: {
    title: 'Requires Capture',
    theme: 'yellow',
  },
} satisfies Record<
  PaymentIntentStatus,
  {
    title: string
    theme: ThemeName
  }
>
