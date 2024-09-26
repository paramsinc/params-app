'use dom'
import * as React from 'react'
import { EmbeddedCheckoutProvider, EmbeddedCheckout, Elements } from '@stripe/react-stripe-js'
import { env } from 'app/env'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(env.STRIPE_PUBLISHABLE_KEY)

export const StripeCheckout = ({ clientSecret }: { clientSecret: string | undefined }) => {
  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
