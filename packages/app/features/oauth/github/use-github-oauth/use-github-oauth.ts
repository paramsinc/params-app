import { maybeCompleteAuthSession } from 'expo-web-browser'
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session'
import { useCurrentPath } from 'app/navigation/use-pathname'
import { api } from 'app/trpc/client'
import { useEffect, useMemo } from 'app/react'
import { env } from 'app/env'
import useToast from 'app/ds/Toast'

maybeCompleteAuthSession({
  skipRedirectCheck: true,
})

const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: `https://github.com/settings/connections/applications/${env.GITHUB_OAUTH_CLIENT_ID}`,
}

export default () => {
  const path = useCurrentPath()

  const authRedirectUrl = makeRedirectUri({
    path,
  })

  const [, response, promptAsync] = useAuthRequest(
    {
      clientId: env.GITHUB_OAUTH_CLIENT_ID,
      scopes: ['repo'],
      redirectUri: env.GITHUB_OAUTH_REDIRECT_URL,
      state: JSON.stringify({ redirect: authRedirectUrl }),
      extraParams: {
        prompt: 'consent',
      },
    },
    discovery
  )

  const code = response?.type === 'success' ? response.params.code : undefined

  const exchangeCodeMutation = api.github.exchangeCode.useMutation()

  useEffect(
    function exchangeCodeForTokens() {
      if (code) {
        exchangeCodeMutation.mutate(
          {
            code,
          },
          {
            onSuccess() {
              useToast.toast({
                preset: 'done',
                title: 'Connected GitHub account',
              })
            },
          }
        )
      }
    },
    [code]
  )

  return {
    prompt: promptAsync,
    isLoading: exchangeCodeMutation.isPending,
    error: exchangeCodeMutation.error,
  }
}
