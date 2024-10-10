import { d, db, schema } from 'app/db/db'
import { serverEnv } from 'app/env/env.server'
import { stripe } from 'app/features/stripe-connect/server/stripe'
import { createBookingFromOffer } from 'app/features/stripe-connect/webhook/createBookingFromOffer'

export default async function POST(req: Request) {
  const stripeSignature = req.headers.get('stripe-signature')

  if (!stripeSignature) {
    return new Response('Missing stripe signature', { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      await req.text(),
      stripeSignature,
      serverEnv.STRIPE_WEBHOOK_SECRET
    )

    if (event.type === 'payment_intent.succeeded') {
      console.log('[webhook][event]', event.data.object)
      const { offer_id } = event.data.object.metadata
      console.log('[webhook][offer_id]', offer_id)

      if (!offer_id) {
        return new Response('Missing offer_id', { status: 400 })
      }

      await db
        .update(schema.offers)
        .set({ stripe_payment_intent_id: event.data.object.id })
        .where(d.eq(schema.offers.id, offer_id))

      await createBookingFromOffer({ offerId: offer_id, paymentIntentId: event.data.object.id })

      return new Response('OK', { status: 200 })
    } else if (event.type === 'payment_intent.payment_failed') {
      const { offer_id } = event.data.object.metadata

      if (!offer_id) {
        return new Response('Missing offer_id', { status: 400 })
      }

      await db
        .update(schema.offers)
        .set({ voided: true, stripe_payment_intent_id: event.data.object.id })
        .where(d.eq(schema.offers.id, offer_id))
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[webhook][error]', error)
    return new Response('Invalid stripe signature', { status: 400 })
  }
}
