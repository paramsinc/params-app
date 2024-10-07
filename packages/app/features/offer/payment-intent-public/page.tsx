import { DateTime } from 'app/dates/date-time'
import { Select } from 'app/db/client'
import { PaymentIntentStatus } from 'app/db/enums'
import { ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Lucide } from 'app/ds/Lucide'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { ThemeName } from 'app/ds/ThemeName'
import { View } from 'app/ds/View'
import { formatCurrencyInteger } from 'app/features/stripe-connect/checkout/success/formatUSD'
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

  const { paymentIntent, offer, profileMemberEmails } = query.data

  const { title, theme } = dipslayPaymentIntentStatus[paymentIntent.status]

  const { start_datetime, timezone } = offer

  const hackDateTime = DateTime.fromISO(start_datetime, {
    zone: timezone,
  })

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content>
          <ErrorCard error={query.error} />
          <View gap="$3">
            <Card theme={theme}>
              <Card.Label>Order #{offer.id.slice(-5)}</Card.Label>
              <Card.Title>
                {formatCurrencyInteger.usd.format(paymentIntent.amount / 100)}
              </Card.Title>
              <Card.Description>{title}</Card.Description>
            </Card>

            <Card>
              <Card.Title>Call Details</Card.Title>

              <Card.Description>
                {offer.organization.name} booked {offer.profile.name}.
              </Card.Description>
              {hackDateTime.isValid && (
                <>
                  <Card.IconRow>
                    <Card.IconRow.Icon icon={Lucide.Calendar} />
                    <Card.IconRow.Content>
                      <Card.Description>
                        {hackDateTime.toLocaleString({
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Card.Description>
                    </Card.IconRow.Content>
                  </Card.IconRow>
                  <Card.IconRow>
                    <Card.IconRow.Icon icon={Lucide.Clock} />
                    <Card.IconRow.Content>
                      <Card.Description>
                        {hackDateTime.toLocaleString({
                          hour: 'numeric',
                          minute: 'numeric',
                        })}{' '}
                        -{' '}
                        {hackDateTime.plus({ minutes: offer.duration_minutes }).toLocaleString({
                          hour: 'numeric',
                          minute: 'numeric',
                          timeZoneName: 'short',
                        })}
                      </Card.Description>
                    </Card.IconRow.Content>
                  </Card.IconRow>
                </>
              )}
              <Card.IconRow>
                <Card.IconRow.Icon icon={Lucide.AlarmCheck} />
                <Card.IconRow.Content>
                  <Card.Description>{offer.duration_minutes} minutes</Card.Description>
                </Card.IconRow.Content>
              </Card.IconRow>
            </Card>
            <Card>
              <Card.Title>Next Steps</Card.Title>
              <Card.Description>
                A calendar invite will be sent to {profileMemberEmails.join(', ')}.
              </Card.Description>
            </Card>

            <LinkButton href={`/@${offer.profile.slug}`} als="flex-start">
              <ButtonText>Back to Profile</ButtonText>
            </LinkButton>
          </View>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

const dipslayPaymentIntentStatus = {
  succeeded: {
    title: 'Payment Successful',
    theme: 'green',
  },
  processing: {
    title: 'Processing Payment',
    theme: 'blue',
  },
  requires_payment_method: {
    title: 'Requires Payment Method',
    theme: 'red',
  },
  requires_confirmation: {
    title: 'Payment Requires Confirmation',
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
