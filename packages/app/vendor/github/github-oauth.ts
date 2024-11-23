import { env } from 'app/env'
import { serverEnv } from 'app/env/env.server'
import { Octokit } from '@octokit/rest'
import { createOAuthAppAuth } from '@octokit/auth-oauth-app'

async function exchangeCodeForTokens(code: string) {
  const auth = createOAuthAppAuth({
    clientId: env.GITHUB_OAUTH_CLIENT_ID,
    clientSecret: serverEnv.GITHUB_OAUTH_CLIENT_SECRET,
  })
  const { token } = await auth({
    type: 'oauth-user',
    code,
  })

  return {
    access_token: token,
  }
}

export const githubOauth = {
  exchangeCodeForTokens,
  fromUser: ({ accessToken }: { accessToken: string }) => {
    return new Octokit({
      auth: accessToken,
    })
  },
}
