import { google } from 'googleapis'
import { serverEnv } from 'app/env/env.server'
import { DateTime } from 'app/dates/date-time'

const serviceAccountKey = JSON.parse(serverEnv.GOOGLE_CAL_SERVICE_JSON)

const auth = new google.auth.JWT({
  email: serviceAccountKey.client_email,
  key: serviceAccountKey.private_key,
  scopes: ['https://www.googleapis.com/auth/calendar.events'],
  subject: serverEnv.GOOGLE_EMAIL_ACCOUNT_FOR_CALENDAR,
})

console.log('[google][email]', serverEnv.GOOGLE_EMAIL_ACCOUNT_FOR_CALENDAR)

export async function createGoogleCalendarEventForOffer({
  offerId,
  attendeeEmails,
  start,
  durationMinutes,
  summary,
  description,
  location,
}: {
  offerId: string
  attendeeEmails: string[]
  start: DateTime
  durationMinutes: number
  summary: string
  description: string
  location: string
}) {
  const calendar = google.calendar({ version: 'v3', auth })

  // Insert the event into the user's primary calendar
  const response = await calendar.events.insert({
    sendNotifications: true,
    sendUpdates: 'all',
    auth,
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      location,
      description,
      start: {
        dateTime: start.toISO(),
        timeZone: start.zoneName,
      },
      end: {
        dateTime: start.plus({ minutes: durationMinutes }).toISO(),
        timeZone: start.zoneName,
      },
      attendees: attendeeEmails.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: offerId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    },
  })

  console.log('[google][created-event]', response)

  return response
}

export async function cancelCalendarEvent({
  eventId,
  calendarId,
}: {
  eventId: string
  calendarId: string
}) {
  const calendarClient = google.calendar({
    version: 'v3',
    auth,
  })

  const res = await calendarClient.events.delete({
    eventId,
    sendUpdates: 'all',
    calendarId: 'primary',
  })

  return res.data
}
