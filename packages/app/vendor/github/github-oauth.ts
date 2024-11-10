import { env } from 'app/env'
import { serverEnv } from 'app/env/env.server'
import { Octokit } from '@octokit/rest'
import { createOAuthAppAuth } from '@octokit/auth-oauth-app'

const auth = createOAuthAppAuth({
  clientId: env.GITHUB_OAUTH_CLIENT_ID,
  clientSecret: serverEnv.GITHUB_OAUTH_CLIENT_SECRET,
})

async function exchangeCodeForTokens(code: string) {
  const { token } = await auth({
    type: 'oauth-user',
    code,
  })

  return {
    access_token: token,
  }
}

async function getUserInfo({ accessToken }: { accessToken: string }) {
  const octokit = new Octokit({
    auth: accessToken,
  })

  const { data } = await octokit.users.getAuthenticated()
  return data
}

export const githubOauth = {
  exchangeCodeForTokens,
  getUserInfo,
}
