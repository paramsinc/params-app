'use dom'
import * as React from 'react'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { stripePromise } from 'app/features/stripe-connect/checkout/promise'

export const StripeCheckout = ({ clientSecret }: { clientSecret: string | undefined }) => {
  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
