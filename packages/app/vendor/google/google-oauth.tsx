import { google } from 'googleapis'
import { serverEnv } from 'app/env/env.server'
import { signInWithGoogleScopes } from 'app/vendor/google/scopes'

const json = serverEnv.GOOGLE_API_CREDENTIALS_JSON.web

function getGoogleOauthUrl(redirectUrl: string) {
  const oauth2Client = new google.auth.OAuth2(json.client_id, json.client_secret, redirectUrl)

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: signInWithGoogleScopes,
  })
}

async function exchangeCodeForTokens(code: string, redirectUrl: string) {
  const oauth2Client = new google.auth.OAuth2(json.client_id, json.client_secret, redirectUrl)

  const { tokens } = await oauth2Client.getToken(code)

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at_ms: tokens.expiry_date,
    id_token: tokens.id_token,
  }
}

async function refreshAccessToken({ refreshToken }: { refreshToken: string }) {
  const oauth2Client = new google.auth.OAuth2(json.client_id, json.client_secret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return {
    access_token: credentials.access_token,
    expires_at_ms: credentials.expiry_date,
    id_token: credentials.id_token,
  }
}

async function getUserInfo({ accessToken }: { accessToken: string }) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })

  const userInfoClient = google.oauth2('v2')
  const res = await userInfoClient.userinfo.get({ auth: oauth2Client })

  return res.data
}

export const googleOauth = {
  getOauthUrl: getGoogleOauthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
}
