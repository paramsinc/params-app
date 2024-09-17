import type { NextApiRequest, NextApiResponse } from 'next'

type AuthBase = {
  Provider: React.ComponentType<{ children: React.ReactNode }>
  useSignOut: () => () => Promise<void>
  useUser: () =>
    | { isSignedIn: boolean; hasLoaded: true; userId: string | null }
    | { hasLoaded: false }
  AuthFlow: React.ComponentType
  useGetToken: () => () => Promise<string | null>
  UserButton: React.ComponentType
}

export const makeAuth = <Auth extends AuthBase>(auth: Auth) => auth

type BackendAuthBase<Auth extends ReturnType<typeof makeAuth>> = {
  authenticateNextApiRequest: (
    req: NextApiRequest
  ) => Promise<{ userId: string | null }>
}

export const makeBackendAuth = <Auth extends ReturnType<typeof makeAuth>>(
  auth: BackendAuthBase<Auth>
) => auth
