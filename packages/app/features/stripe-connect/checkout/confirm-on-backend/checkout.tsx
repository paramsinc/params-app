import React, { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { useMutation } from '@tanstack/react-query'
import { api } from 'app/trpc/client'
import { useRouter } from 'app/navigation/use-router'
import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { View } from 'app/ds/View'
import { OfferPaymentIntentPublicPageParams } from 'app/features/offer/payment-intent-public/page'
import { formatUSD } from 'app/features/stripe-connect/checkout/success/formatUSD'

export function StripeCheckoutForm_ConfirmOnBackend({
  profile_id,
  organization_id,
  amount,
}: {
  profile_id: string
  organization_id: string | null
  amount: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const createOfferAndPaymentIntentMutation = api.createOfferAndPaymentIntent.useMutation()
  const mutation = useMutation({
    mutationFn: async () => {
      if (!stripe || !elements) {
        throw new Error('Not ready yet, please try again in a moment.')
      }
      const submission = await elements.submit()
      if (submission.error) {
        throw new Error(submission.error.message)
      }

      const { error, confirmationToken } = await stripe.createConfirmationToken({
        elements,
      })

      if (error) {
        throw new Error(error.message)
      }

      const { paymentIntent } = await createOfferAndPaymentIntentMutation.mutateAsync({
        profile_id,
        stripe_confirmation_token_id: confirmationToken.id,
        organization_id,
      })

      const redirect = (paymentIntentId: string) => {
        const params: OfferPaymentIntentPublicPageParams = {
          payment_intent_id: paymentIntentId,
          redirect_status: paymentIntent.status,
          client_secret: paymentIntent.client_secret ?? '',
        }

        router.push(
          `/offer-payment-intent?redirect_status=${params.redirect_status}&payment_intent_id=${params.payment_intent_id}&client_secret=${params.client_secret}`
        )
      }

      if (paymentIntent.status === 'requires_action' && paymentIntent.client_secret) {
        // Use Stripe.js to handle the required next action
        const nextAction = await stripe.handleNextAction({
          clientSecret: paymentIntent.client_secret,
        })

        if (nextAction.error) {
          // Show error from Stripe.js in payment form
          throw new Error(nextAction.error.message)
        }

        return redirect(nextAction.paymentIntent?.id ?? paymentIntent.id)
      }
      return redirect(paymentIntent.id)
    },
  })
  const [ready, setReady] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
    >
      <View gap="$3">
        <PaymentElement
          onReady={(e) => {
            setReady(true)
          }}
        />
        <ErrorCard error={mutation.error} />
        {ready && (
          <Button loading={!stripe || mutation.isPending || !elements} themeInverse>
            <ButtonText>Pay {formatUSD.format(amount / 100)}</ButtonText>
          </Button>
        )}
      </View>
    </form>
  )
}