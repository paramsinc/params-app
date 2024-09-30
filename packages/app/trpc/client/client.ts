import { httpBatchLink } from '@trpc/client/links/httpBatchLink'
import { httpLink } from '@trpc/client/links/httpLink'
import { createTRPCNext } from '@trpc/next'
import { Auth } from 'app/auth'
import { AppRouter } from 'app/trpc/api'
import { QueryClient } from '@tanstack/react-query'
import { splitLink } from '@trpc/client/links/splitLink'
import { getTrpcUrl } from 'app/trpc/client/getTrpcUrl'

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onSuccess(data, variables, context) {
        queryClient.invalidateQueries({
          refetchType: 'active',
        }) // refetch all active queries when mutation succeeds...
      },
    },
    queries: {
      refetchOnMount: true,
    },
  },
})

const url = `${getTrpcUrl()}/api/trpc`
async function getTrpcHeaders() {
  const headers: Record<string, string> = {}

  const token = await Auth.getToken()
  console.log('[auth][trpc][token]', token)
  if (token) {
    headers.authorization = `Bearer ${token}`
  }

  return headers
}
export default createTRPCNext<AppRouter>({
  config(opts) {
    return {
      links: [
        splitLink({
          condition(op) {
            // check for context property `skipBatch`
            return op.context.batch === false
          },
          // when condition is true, use normal request
          true: httpLink({
            url,
            headers: getTrpcHeaders,
          }),
          // when condition is false, use batching
          false: httpBatchLink({
            /**
             * If you want to use SSR, you need to use the server's full URL
             * @link https://trpc.io/docs/v11/ssr
             **/
            url,
            // You can pass any HTTP headers you wish here
            headers: getTrpcHeaders,
          }),
        }),
      ],
      queryClient,
      abortOnUnmount: true,
    }
  },
  /**
   * @link https://trpc.io/docs/v11/ssr
   **/
  ssr: false,
})
