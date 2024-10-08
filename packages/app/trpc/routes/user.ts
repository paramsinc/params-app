import { TRPCError } from '@trpc/server'
import { inserts } from 'app/db/inserts-and-selects'
import { d, db, schema } from 'app/db/db'
import { pick } from 'app/trpc/pick'
import { publicSchema } from 'app/trpc/publicSchema'
import { isValidSlug, slugify } from 'app/trpc/slugify'

export async function createUser(
  insert: Omit<Zod.infer<typeof inserts.users>, 'slug'> &
    Partial<Pick<Zod.infer<typeof inserts.users>, 'slug'>>
) {
  const { first_name, last_name, email, id } = insert
  let slugSearchCount = 0
  const baseSlug =
    insert.slug ||
    slugify([first_name, last_name].filter(Boolean).join(' ')) ||
    Math.round(Math.random() * 1000000).toString()
  if (!isValidSlug(baseSlug)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid slug. Please use only lowercase letters, numbers, and dashes.`,
    })
  }
  let slug = baseSlug
  // should this throw and just say that the slug is taken?
  const user = await db.transaction(async (tx) => {
    while (await tx.query.users.findFirst({ where: (users, { eq }) => eq(users.slug, slug) })) {
      const maxSlugsCheck = 10
      if (slugSearchCount >= maxSlugsCheck) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Couldn't create user, because the slug ${baseSlug} is already taken. Please try another one.`,
        })
      }
      slugSearchCount++
      slug = `${baseSlug}-${slugSearchCount}`
    }
    const [user] = await tx
      .insert(schema.users)
      .values({
        first_name,
        last_name,
        email,
        slug,
        id,
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: insert,
      })
      .returning(pick('users', publicSchema.users.UserPublic))
      .execute()

    if (!user) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Couldn't create user.`,
      })
    }

    await tx
      .update(schema.profileMembers)
      .set({
        user_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      })
      .where(d.eq(schema.profileMembers.email, email))
      .returning()
      .execute()

    return user
  })

  return user
}
