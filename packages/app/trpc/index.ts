import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'

export const appRouter = router({
  me: authedProcedure.query(({ ctx }) => {
    return ctx.auth.userId
  }),
  hello: publicProcedure.query(({ ctx }) => {
    console.log('[trpc][hello]', ctx.auth.userId)
    return 'hello there sir'
  }),
  repoById: publicProcedure.query(({ ctx }) => {}),
  profileBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(({ input }) => {}),
})

export type AppRouter = typeof appRouter
