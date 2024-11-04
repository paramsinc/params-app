import { initTRPC, TRPCError } from '@trpc/server'
import { TrpcContext } from './context'
import { db, schema, d } from 'app/db/db'
import { ZodError } from 'zod'
import { pick } from 'app/trpc/pick'
import { publicSchema } from 'app/trpc/publicSchema'

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<TrpcContext>().create({
  errorFormatter(opts) {
    const { shape, error } = opts
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause?.flatten()
            : null,
      },
    }
  },
})

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */

// check if the user is signed in, otherwise throw an UNAUTHORIZED code
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You should sign in.' })
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

export const userProcedure = t.procedure.use(isAuthed).use(async ({ next, ctx }) => {
  // TODO should we upsert a user based on their auth...? eh
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, ctx.auth.userId),
  })
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please complete your profile.' })
  }
  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})
