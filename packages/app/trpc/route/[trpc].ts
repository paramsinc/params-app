import * as trpcNext from '@trpc/server/adapters/next'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { appRouter } from 'app/trpc/api'
import { createTrpcContext } from '../context'

export const maxDuration = 30

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: createTrpcContext,
  allowBatching: true,
})
