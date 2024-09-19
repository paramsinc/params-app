import * as trpcNext from '@trpc/server/adapters/next'
import { BackendAuth } from 'app/auth/backend'

export const createTrpcContext = async (opts: trpcNext.CreateNextContextOptions) => {
  const auth = await BackendAuth.authenticateNextApiRequest(opts.req)
  console.log('[trpc][context]', opts.req)
  console.log('[trpc][context][auth]', auth)
  return { auth: await BackendAuth.authenticateNextApiRequest(opts.req) }
}

export type TrpcContext = Awaited<ReturnType<typeof createTrpcContext>>
