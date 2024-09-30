import type { schema } from 'app/db/db'
import type { stripe } from 'app/features/stripe-connect/server/stripe'

export type Currency = (typeof schema.profileOnetimePlans.currency)['enumValues'][number]

export type PaymentIntentStatus = Awaited<
  ReturnType<typeof stripe.paymentIntents.retrieve>
>['status']
