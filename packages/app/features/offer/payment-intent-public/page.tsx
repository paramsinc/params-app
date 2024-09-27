import { ErrorCard } from 'app/ds/Error/card'
import { Text } from 'app/ds/Text'
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

  return (
    <>
      <ErrorCard error={query.error} />
      <Text>{JSON.stringify(query.data, null, 2)}</Text>
    </>
  )
}
