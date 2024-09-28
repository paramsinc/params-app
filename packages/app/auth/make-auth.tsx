import type { NextApiRequest, NextApiResponse } from 'next'

type AuthBase = {
  Provider: React.ComponentType<{ children: React.ReactNode }>
  useSignOut: () => () => Promise<void>
  useUser: () =>
    | {
        isSignedIn: true
        hasLoaded: true
        userId: string
        userFirstName: string | undefined
        userLastName: string | undefined
        userEmail: string | undefined
      }
    | {
        isSignedIn: false
        hasLoaded: true
        userId: null
        userFirstName: null
        userLastName: null
        userEmail: null
      }
    | { hasLoaded: false }
  useGetToken: () => () => Promise<string | null>
  UserButton: React.ComponentType<{ children?: React.ReactElement }>
  AuthFlowTrigger: React.ComponentType<{ children: React.ReactElement }>
  getToken: () => Promise<string | null>
}

export const makeAuth = <Auth extends AuthBase>(auth: Auth) => auth

type BackendAuthBase<Auth extends ReturnType<typeof makeAuth>> = {
  authenticateNextApiRequest: (req: NextApiRequest) => Promise<{
    userId: string | null
    userFirstName?: string
    userEmail?: string
    userLastName?: string
  }>
}

export const makeBackendAuth = <Auth extends ReturnType<typeof makeAuth>>(
  auth: BackendAuthBase<Auth>
) => auth
