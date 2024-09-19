import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import { Auth } from 'app/auth'
import { AppRouter } from 'app/trpc/api'
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onSuccess(data, variables, context) {
        queryClient.invalidateQueries({
          refetchType: 'active',
        }) // refetch all active queries when mutation succeeds...
      },
    },
  },
})

function getBaseUrl() {
  if (typeof window !== 'undefined')
    // browser should use relative path
    return ''
  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`
  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}
export default createTRPCNext<AppRouter>({
  config(opts) {
    return {
      links: [
        httpBatchLink({
          /**
           * If you want to use SSR, you need to use the server's full URL
           * @link https://trpc.io/docs/v11/ssr
           **/
          url: `${getBaseUrl()}/api/trpc`,
          // You can pass any HTTP headers you wish here
          async headers() {
            const headers: Record<string, string> = {}

            const token = await Auth.getToken()
            console.log('[auth][trpc][token]', token)
            if (token) {
              headers.authorization = `Bearer ${token}`
            }

            return headers
          },
        }),
      ],
      queryClient,
    }
  },
  /**
   * @link https://trpc.io/docs/v11/ssr
   **/
  ssr: false,
})
