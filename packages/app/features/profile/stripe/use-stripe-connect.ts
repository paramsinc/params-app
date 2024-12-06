import { loadConnectAndInitialize } from '@stripe/connect-js/pure'
import { env } from 'app/env'
import { useEffect, useMemo, useState } from 'app/react'
import { api } from 'app/trpc/client'

export const useStripeConnectForProfile = (props: { profileSlug: string }) => {
  const sessionQuery = api.profileConnectAccountSession.useQuery(
    {
      profile_slug: props.profileSlug,
    },
    {
      staleTime: 0,
      gcTime: 0,
    }
  )
  const clientSecret = sessionQuery.data?.client_secret

  const stripe = useMemo(() => {
    if (!clientSecret) return

    return loadConnectAndInitialize({
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      fetchClientSecret: async () => clientSecret,
      appearance: {
        overlays: 'dialog',
        variables: {
          colorPrimary: '#635BFF',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
        },
      },
    })
  }, [clientSecret])

  return { stripe, sessionQuery }
}
