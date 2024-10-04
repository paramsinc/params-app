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
  }
}

export const googleOauth = {
  getOauthUrl: getGoogleOauthUrl,
  exchangeCodeForTokens,
}
