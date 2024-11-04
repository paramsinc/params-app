import { QueryClient } from '@tanstack/react-query'
import { getErrorMessages } from 'app/ds/Error/error'
import useToast from 'app/ds/Toast'

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onSuccess(data, variables, context) {
        queryClient.invalidateQueries({
          refetchType: 'active',
        }) // refetch all active queries when mutation succeeds...
      },
      onError(error, variables, context) {
        useToast.toast({
          preset: 'error',
          title: getErrorMessages(error, '\n'),
        })
      },
    },
    queries: {
      refetchOnMount: true,
    },
  },
})
