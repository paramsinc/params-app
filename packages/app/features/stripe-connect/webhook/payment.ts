import { DateTime } from 'app/dates/date-time'
import { d, db, schema } from 'app/db/db'
import { env } from 'app/env'
import { serverEnv } from 'app/env/env.server'
import { stripe } from 'app/features/stripe-connect/server/stripe'
import { createGoogleCalendarEventForOffer } from 'app/vendor/calendar/google/google-calendar'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: Request) {
  const stripeSignature = req.headers.get('stripe-signature')

  console.log('[webhook][stripeSignature]', stripeSignature, serverEnv.STRIPE_WEBHOOK_SECRET)

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
      console.log('[webhook][event]', event)
      const { offer_id } = event.data.object.metadata

      if (!offer_id) {
        return new Response('Missing offer_id', { status: 400 })
      }

      await createBookingFromOffer({ offerId: offer_id, paymentIntentId: event.data.object.id })
    } else if (event.type === 'payment_intent.payment_failed') {
      const { offer_id } = event.data.object.metadata

      if (!offer_id) {
        return new Response('Missing offer_id', { status: 400 })
      }

      await db.update(schema.offers).set({ voided: true }).where(d.eq(schema.offers.id, offer_id))
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[webhook][error]', error.message)
    return new Response('Invalid stripe signature', { status: 400 })
  }
}

async function createBookingFromOffer({
  offerId,
  paymentIntentId,
}: {
  offerId: string
  paymentIntentId: string
}) {
  const results = await db
    .select({
      offer: schema.offers,
      profile: schema.profiles,
      organization: schema.organizations,
      organizationMember: schema.organizationMembers,
      profileMember: schema.profileMembers,
    })
    .from(schema.offers)
    .where(d.eq(schema.offers.id, offerId))
    .innerJoin(schema.profiles, d.eq(schema.offers.profile_id, schema.profiles.id))
    .innerJoin(schema.organizations, d.eq(schema.offers.organization_id, schema.organizations.id))
    .leftJoin(
      schema.organizationMembers,
      d.eq(schema.organizations.id, schema.organizationMembers.organization_id)
    )
    .leftJoin(schema.profileMembers, d.eq(schema.profiles.id, schema.profileMembers.profile_id))
    .execute()

  const [firstResult] = results

  if (!firstResult) {
    throw new Error('Offer not found')
  }

  const { offer, organization, profile } = firstResult

  const profileMemberEmails = new Set(
    results.map((result) => result.profileMember?.email).filter(Boolean)
  )
  const organizationMemberEmails = new Set(
    results.map((result) => result.organizationMember?.email).filter(Boolean)
  )

  const attendeeEmails = [...profileMemberEmails, ...organizationMemberEmails]

  const googleCalendarEvent = await createGoogleCalendarEventForOffer({
    offerId,
    attendeeEmails,
    start: DateTime.fromISO(offer.start_datetime, { zone: offer.timezone }),
    durationMinutes: offer.duration_minutes,
    summary: `${organization.name} <> ${profile.name} (${env.APP_NAME})`,
    description: '',
    location: 'Virtual',
  })

  if (!googleCalendarEvent.data.id) {
    throw new Error('Failed to create google calendar event')
  }

  await db
    .insert(schema.bookings)
    .values({
      offer_id: offer.id,
      organization_id: offer.organization_id,
      profile_id: offer.profile_id,
      stripe_payment_intent_id: paymentIntentId,
      google_calendar_event_id: googleCalendarEvent.data.id,
      start_datetime: offer.start_datetime,
      duration_minutes: offer.duration_minutes,
      timezone: offer.timezone,
    })
    .returning()
}
