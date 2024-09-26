import React from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { Appearance } from '@stripe/stripe-js'
import { stripePromise } from 'app/features/stripe-connect/checkout/promise'
import { useColors } from 'app/ds/useColors'

function useAppearance(): Appearance {
  const colors = useColors()
  return {
    variables: {
      // fontFamily: font.body.family,
      colorBackground: colors.background.val,
      colorText: colors.color12.val,
      colorTextPlaceholder: colors.color10.val,
      colorPrimary: colors.color12.val,
      borderRadius: '10px',
    },
  }
}

export function StripeProvider_ConfirmOnBackend({
  children,
  amountCents,
  currency,
}: {
  children: React.ReactNode
  amountCents: number
  currency: string
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: useAppearance(),
        loader: 'auto',
        mode: 'payment',
        amount: amountCents,
        currency,
        paymentMethodCreation: 'manual',
        paymentMethodTypes: ['card'],
      }}
    >
      {children}
    </Elements>
  )
}
