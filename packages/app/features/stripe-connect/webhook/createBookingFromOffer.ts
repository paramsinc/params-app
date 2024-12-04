import { DateTime } from 'app/dates/date-time'
import { d, db, schema } from 'app/db/db'
import { env } from 'app/env'
import { formatCurrencyInteger } from 'app/features/stripe-connect/checkout/success/formatUSD'
import { stripe } from 'app/features/stripe-connect/server/stripe'
import { sendEmailHTML } from 'app/notifications/email/send'
import { createGoogleCalendarEventForOffer } from 'app/vendor/google/google-calendar'

export async function createBookingFromOffer({
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
    throw new Error(`Offer not found for ID: ${offerId}`)
  }

  const { offer, organization, profile } = firstResult

  const profileMemberEmails = new Set(
    results.map((result) => result.profileMember?.email).filter(Boolean)
  )
  const organizationMemberEmails = new Set(
    results.map((result) => result.organizationMember?.email).filter(Boolean)
  )

  const allAttendeeEmails = [...profileMemberEmails, ...organizationMemberEmails]

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    throw new Error(
      `Cannot create booking from offer: payment intent status is ${paymentIntent.status}`
    )
  }

  const googleCalendarEvent = await createGoogleCalendarEventForOffer({
    offerId,
    attendeeEmails: allAttendeeEmails,
    start: DateTime.fromJSDate(offer.start_datetime, { zone: offer.timezone }),
    durationMinutes: offer.duration_minutes,
    summary: `${organization.name} <> ${profile.name} (${env.APP_NAME})`,
    description: `This meeting was scheduled by ${env.APP_NAME}.
    
${formatCurrencyInteger.usd.format(paymentIntent.amount / 100)}

To reschedule or cancel, please visit https://${env.APP_URL}/bookings
`,
    location: 'Virtual',
  })

  if (!googleCalendarEvent.data.id) {
    // TODO log somewhere
    throw new Error('Failed to create google calendar event')
  }

  const [booking] = await db
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
      amount: paymentIntent.amount,
      currency: paymentIntent.currency as 'usd',
    })
    .returning()
    .execute()

  if (!booking) {
    throw new Error('Failed to create booking')
  }

  const dt = DateTime.fromJSDate(booking.start_datetime, { zone: booking.timezone })

  const currencyFormatter = formatCurrencyInteger[booking.currency ?? 'usd']

  const hourEmoji = timeEmojiByHour[dt.hour] ?? '🕖'
  const moneyEmoji = currencyEmoji[booking.currency ?? 'usd'] ?? '💵'

  await sendEmailHTML({
    to: allAttendeeEmails.join(','),
    subject: `New Booking: ${organization.name} <> ${profile.name} (${env.APP_NAME})`,
    html: [
      `<p><strong>${organization.name}</strong> just booked a call with <strong>${profile.name}</strong> on <a href="https://${env.APP_URL}">${env.APP_URL}</a></p>`,
      `<p>🗓️ ${dt.toLocaleString({ dateStyle: 'full' })}</p>`,
      `<p>${hourEmoji} ${dt.toLocaleString({ timeStyle: 'short' })} (${dt.toFormat('ZZZZ')})</p>`,
      currencyFormatter &&
        `<p>${moneyEmoji} ${currencyFormatter.format((booking.amount || 0) / 100)}</p>`,
      `<p>To cancel, please visit <a href="https://${env.APP_URL}/dashboard/bookings">${env.APP_URL}/dashboard/bookings</a></p>`,
    ]
      .filter(Boolean)
      .join('\n'),
  })
}

const currencyEmoji = {
  usd: '💵',
  eur: '💶',
  gbp: '💷',
  cad: '🇨🇦',
  aud: '🇦🇺',
}

const timeEmojiByHour = [
  '🕛',
  '🕐',
  '🕑',
  '🕒',
  '🕓',
  '🕔',
  '🕕',
  '🕖',
  '🕗',
  '🕘',
  '🕙',
  '🕚',
  '🕛',
  '🕐',
  '🕑',
  '🕒',
  '🕓',
  '🕔',
  '🕕',
  '🕖',
  '🕗',
  '🕘',
  '🕙',
  '🕚',
]
