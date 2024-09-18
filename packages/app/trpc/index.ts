import { select } from 'app/helpers/select'
import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'
import { inserts, selects } from 'app/db/inserts-and-selects'
import { d, db, schema } from 'app/db/db'
import { TRPCError } from '@trpc/server'

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-')

export const appRouter = router({
  hello: publicProcedure.query(({ ctx }) => {
    return 'hello there sir'
  }),

  // me
  me: authedProcedure
    .output(selects.users.nullable())
    .query(async ({ ctx }) => {
      const user = await db.query.users
        .findFirst({
          where: (users, { eq }) => eq(users.id, ctx.auth.userId),
        })
        .execute()

      return user ?? null
    }),
  createMe: authedProcedure
    .input(
      inserts.users
        .pick({
          first_name: true,
          last_name: true,
          email: true,
        })
        .merge(inserts.users.pick({ slug: true }).partial())
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db
        .insert(schema.users)
        .values({
          ...input,
          slug:
            input.slug ||
            slugify([input.first_name, input.last_name].join(' ')),
          id: ctx.auth.userId,
        })
        .execute()

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return user
    }),
  updateMe: authedProcedure
    .input(
      inserts.users
        .partial()
        .pick({ first_name: true, last_name: true, email: true })
    )
    .mutation(async ({ ctx, input }) => {
      const [user] = await db
        .update(schema.users)
        .set({
          ...input,
        })
        .where(d.eq(schema.users.id, ctx.auth.userId))
        .returning()
        .execute()

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return user
    }),
  deleteMe: authedProcedure.mutation(async ({ ctx }) => {
    const [user] = await db
      .delete(schema.users)
      .where(d.eq(schema.users.id, ctx.auth.userId))
      .returning()
      .execute()

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return true
  }),

  // users
  users: authedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // TODO check that i'm an admin
      throw new TRPCError({ code: 'METHOD_NOT_SUPPORTED' })
      const users = await db.query.users
        .findMany({
          limit: input.limit,
          offset: input.offset,
        })
        .execute()

      return users
    }),

  repoById: publicProcedure.query(({ ctx }) => {}),
  profileBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(({ input }) => {
      return
    }),
})

export type AppRouter = typeof appRouter
