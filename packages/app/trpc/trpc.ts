import { initTRPC, TRPCError } from '@trpc/server'
import { TrpcContext } from './context'

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<TrpcContext>().create()

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */

// check if the user is signed in, otherwise throw an UNAUTHORIZED code
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      auth: {
        ...ctx.auth,
        userId: ctx.auth.userId,
      },
    },
  })
})

export const router = t.router

export const publicProcedure = t.procedure

// export this procedure to be used anywhere in your application
export const authedProcedure = t.procedure.use(isAuthed)
