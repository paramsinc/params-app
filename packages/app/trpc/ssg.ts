import { createServerSideHelpers } from '@trpc/react-query/server'
import { appRouter } from 'app/trpc/api'

export const ssgApi = createServerSideHelpers({
  router: appRouter,
  ctx: {
    auth: {
      userId: null,
    },
  },
})
