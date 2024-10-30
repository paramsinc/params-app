import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient({
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
