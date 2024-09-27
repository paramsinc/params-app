import * as trpcNext from '@trpc/server/adapters/next'
import { BackendAuth } from 'app/auth/backend'

export const createTrpcContext = async (opts: trpcNext.CreateNextContextOptions) => {
  console.log('[will-check-auth]', opts.req.headers.authorization)
  const auth = await BackendAuth.authenticateNextApiRequest(opts.req)
  console.log('auth', auth)
  return { auth }
}

export type TrpcContext = Awaited<ReturnType<typeof createTrpcContext>>
