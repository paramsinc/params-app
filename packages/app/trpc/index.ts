import { select } from 'app/helpers/select'
import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'
import { inserts, selects } from 'app/db/inserts-and-selects'
import { d, db, schema } from 'app/db/db'
import { TRPCError } from '@trpc/server'
import { keys } from 'app/helpers/object'

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-')

const publicSchema = {
  users: {
    UserPublic: {
      id: true,
      slug: true,
      first_name: true,
      last_name: true,
      created_at: true,
      last_updated_at: true,
    },
  },
} satisfies PublicColumns

const user = {
  // me
  me: authedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users
      .findFirst({
        where: (users, { eq }) => eq(users.id, ctx.auth.userId),
        columns: publicSchema.users.UserPublic,
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
    .output(selects.users.pick(publicSchema.users.UserPublic))
    .mutation(async ({ ctx, input }) => {
      const [user] = await db
        .insert(schema.users)
        .values({
          ...input,
          slug:
            input.slug ||
            slugify([input.first_name, input.last_name].join(' ')),
          id: ctx.auth.userId,
        })
        .onConflictDoUpdate({
          target: schema.users.id,
          set: input,
        })
        .returning(pick('users', publicSchema.users.UserPublic))
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
        .set(input)
        .where(d.eq(schema.users.id, ctx.auth.userId))
        .returning(pick('users', publicSchema.users.UserPublic))
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
}

export const appRouter = router({
  hello: publicProcedure.query(({ ctx }) => {
    return 'hello there sir'
  }),

  ...user,

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

type PublicColumns = Partial<{
  [key in keyof typeof selects]: {
    [type: string]: Partial<Record<keyof z.infer<(typeof selects)[key]>, true>>
  }
}>

const pick = <
  Table extends keyof typeof schema,
  Columns extends Partial<Record<keyof (typeof schema)[Table], true>>
>(
  table: Table,
  customSchema: Columns
): {
  [Column in Extract<
    // loop over each column in the schema[Table]
    keyof (typeof schema)[Table],
    // but only include the ones in the sharedSchemaByTable[Table][Columns]
    // if we just looped over this one, it didn't work for some reason
    // so we use extract instead
    keyof Columns
  >]: (typeof schema)[Table][Column]
} => {
  return Object.fromEntries(
    keys(customSchema).map((column) => [
      column,
      // @ts-ignore
      schema[table][column],
    ])
  ) as any
}
