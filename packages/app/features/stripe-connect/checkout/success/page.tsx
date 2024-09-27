import { Empty, EmptyCard, EmptyCardTitle } from 'app/ds/Empty'
import { ErrorCard } from 'app/ds/Error/card'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { formatUSD } from 'app/features/stripe-connect/checkout/success/formatUSD'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'

const { useParams } = createParam<{ session_id: string }>()

export function CheckoutSuccessPage() {
  const { params } = useParams()
  return <CheckoutSuccessContent session_id={params.session_id} />
}

function CheckoutSuccessContent({ session_id }: { session_id: string }) {
  const sessionQuery = api.stripeCheckoutSession.useQuery({ session_id })
  if (!sessionQuery.data) {
    return (
      <Empty>
        <EmptyCard>
          <EmptyCardTitle>Loading...</EmptyCardTitle>

          <ErrorCard error={sessionQuery.error} />
        </EmptyCard>
      </Empty>
    )
  }
  const { customer, session } = sessionQuery.data
  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content>
          <View gap="$3">
            <Text bold>Thanks for your order.</Text>
            {customer && 'name' in customer && <Text>{customer.name}</Text>}
            <Text>{formatUSD.format((session.amount_total ?? 0) / 100)}</Text>
          </View>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}
