import { Auth } from 'app/auth'
import { api } from 'app/trpc/client'

export function useMe() {
  const auth = Auth.useUser()
  return api.me.useQuery(undefined, {
    enabled: auth.hasLoaded && auth.isSignedIn,
  })
}
