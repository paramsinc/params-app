import { maybeCompleteAuthSession } from 'expo-web-browser'
import { useAuthRequest, makeRedirectUri, AuthError } from 'expo-auth-session'
import { useCurrentPath } from 'app/navigation/use-pathname'
import { api } from 'app/trpc/client'
import qs from 'qs'
import { useEffect, useMemo } from 'app/react'
import { env } from 'app/env'

maybeCompleteAuthSession()

export default ({ profileSlug }: { profileSlug: string }) => {
  const path = useCurrentPath()

  const redirect = makeRedirectUri({
    path,
  })

  const authRedirectUrl = makeRedirectUri({
    path: 'api/auth/google/callback',
  })

  const stateParam = useMemo(
    () => ({
      redirect,
    }),
    [redirect]
  )

  const authUrlQuery = api.googleOauthUrl.useQuery({
    redirect_url: authRedirectUrl,
    state: stateParam,
  })

  const extraParams = useMemo(() => {
    const authUrl = authUrlQuery.data
    if (!authUrl) {
      return undefined
    }
    return {
      ...(qs.parse(authUrl.split('?')[1] ?? '') as Record<string, string>),
      state: JSON.stringify(stateParam),
    }
  }, [authUrlQuery.data, stateParam])

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: env.GOOGLE_CLIENT_ID_WEB,
      redirectUri: authRedirectUrl,
      extraParams,
      usePKCE: false,
    },
    useMemo(
      () => (authUrlQuery.data ? { authorizationEndpoint: authUrlQuery.data.split('?')[0] } : null),
      [authUrlQuery.data]
    )
  )

  const code = response?.type === 'success' ? response.params.code : undefined

  const exchangeCodeMutation = api.googleOauthExchangeCode.useMutation()

  useEffect(
    function exchangeCodeForTokens() {
      if (code) {
        exchangeCodeMutation.mutate({
          code,
          redirect_url: authRedirectUrl,
          profile_slug: profileSlug,
        })
      }
    },
    [code, profileSlug]
  )

  return {
    prompt: promptAsync,
    isLoading: exchangeCodeMutation.isPending,
    error: exchangeCodeMutation.error ?? authUrlQuery.error,
  }
}
