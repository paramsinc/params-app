import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from 'app/trpc/api'
import { getTrpcUrl } from 'app/trpc/client/getTrpcUrl'

export const serverApi = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getTrpcUrl(),
    }),
  ],
})
