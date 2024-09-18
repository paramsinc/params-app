import * as trpcNext from '@trpc/server/adapters/next'

import { appRouter } from 'app/trpc'
import { createTrpcContext } from '../context'

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: createTrpcContext,
})
