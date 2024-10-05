import { google } from 'googleapis'
import { serverEnv } from 'app/env/env.server'
import { signInWithGoogleScopes } from 'app/vendor/google/scopes'
import { DateTime } from 'app/dates/date-time'

const json = serverEnv.GOOGLE_API_CREDENTIALS_JSON.web

const createOauth2Client = (redirectUrl?: string) => {
  return new google.auth.OAuth2(json.client_id, json.client_secret, redirectUrl)
}

function getGoogleOauthUrl(redirectUrl: string) {
  const oauth2Client = createOauth2Client(redirectUrl)

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: signInWithGoogleScopes,
  })
}

async function exchangeCodeForTokens(code: string, redirectUrl: string) {
  const oauth2Client = createOauth2Client(redirectUrl)

  const { tokens } = await oauth2Client.getToken(code)

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at_ms: tokens.expiry_date,
    id_token: tokens.id_token,
  }
}

async function refreshAccessToken({
  refreshToken,
  accessToken,
}: {
  refreshToken: string
  accessToken: string
}): Promise<{
  access_token: string
  refresh_token: string
  expires_at_ms: number
}> {
  const oauth2Client = createOauth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  console.log('[refreshAccessToken][will query]')
  const { res } = await oauth2Client.getAccessToken()
  const expiry_date = res?.data.expiry_date

  if (typeof expiry_date !== 'number') {
    throw new Error('No expiry date')
  }

  console.log('[refreshAccessToken][expiry_date]', expiry_date)

  const bufferMinutes = 1
  const bufferSeconds = bufferMinutes * 60
  const bufferMs = bufferSeconds * 1000

  if (Date.now() + bufferMs < expiry_date) {
    return {
      access_token: accessToken,
      expires_at_ms: expiry_date,
      refresh_token: refreshToken,
    }
  }

  const { credentials } = await oauth2Client.refreshAccessToken()
  if (!credentials.access_token) {
    throw new Error('No access token')
  }
  if (!credentials.refresh_token) {
    throw new Error('No refresh token')
  }
  if (!credentials.expiry_date) {
    throw new Error('No expiry date')
  }
  if (!credentials.id_token) {
    throw new Error('No id token')
  }
  return {
    access_token: credentials.access_token,
    expires_at_ms: credentials.expiry_date,
    refresh_token: credentials.refresh_token,
  }
}

async function getUserInfo({ accessToken }: { accessToken: string }) {
  const oauth2Client = createOauth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const userInfoClient = google.oauth2('v2')
  const res = await userInfoClient.userinfo.get({ auth: oauth2Client })

  return res.data
}

async function getCalendarsList({ refreshToken }: { refreshToken: string }) {
  const oauth2Client = createOauth2Client()
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  console.log('[getCalendarsList][will query]')
  const calendarClient = google.calendar('v3')
  const res = await calendarClient.calendarList.list({
    auth: oauth2Client,
  })
  console.log('[getCalendarsList][res]', res.data)

  return res.data
}

async function getCalendarEvents({
  refreshToken,
  minDateTime,
  maxDateTime,
  calendarId,
}: {
  refreshToken: string
  minDateTime: DateTime<true>
  maxDateTime: DateTime<true>
  calendarId: string
}) {
  const oauth2Client = createOauth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const calendarClient = google.calendar('v3')

  const res = await calendarClient.events.list({
    auth: oauth2Client,
    timeMin: minDateTime.toISO(),
    timeMax: maxDateTime.toISO(),
    calendarId,
  })

  return res.data
}

export const googleOauth = {
  getOauthUrl: getGoogleOauthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
  getCalendarsList,
  getCalendarEvents,
}
