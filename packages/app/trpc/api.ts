import { select } from 'app/helpers/select'
import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'
import { Insert, inserts, selects } from 'app/db/inserts-and-selects'
import { d, db, schema } from 'app/db/db'
import { TRPCError } from '@trpc/server'
import { keys } from 'app/helpers/object'
import { stripe } from 'app/features/stripe-connect/server/stripe'

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
  profiles: {
    ProfilePublic: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      github_username: true,
      image_vendor: true,
      image_vendor_id: true,
    },
  },
  profileMembers: {
    ProfileMemberInternal: {
      id: true,
      profile_id: true,
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
    ProfileMemberPublic: {
      id: true,
      profile_id: true,
      user_id: true,
      first_name: true,
      last_name: true,
    },
  },
  repositories: {
    RepositoryPublic: {
      id: true,
      profile_id: true,
      slug: true,
      name: true,
      created_at: true,
      last_updated_at: true,
      github_url: true,
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
      inserts.users.pick({ slug: true, first_name: true, last_name: true, email: true }).partial()
    )
    .output(selects.users.pick(publicSchema.users.UserPublic))
    .mutation(async ({ ctx, input }) => {
      const firstName = input.first_name ?? ctx.auth.userFirstName
      const lastName = input.last_name ?? ctx.auth.userLastName
      const email = input.email ?? ctx.auth.userEmail
      if (!firstName || !lastName || !email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Please provide your first name, last name, and email.`,
        })
      }
      const [user] = await db
        .insert(schema.users)
        .values({
          first_name: firstName,
          last_name: lastName,
          email,
          slug: input.slug || slugify([firstName, lastName].join(' ')),
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
    .input(inserts.users.partial().pick({ first_name: true, last_name: true, email: true }))
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

const profile = {
  createProfile: authedProcedure
    .input(
      inserts.profiles.pick({
        name: true,
        slug: true,
        bio: true,
        github_username: true,
        image_vendor: true,
        image_vendor_id: true,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingProfileBySlug = await db.query.profiles
        .findFirst({
          where: (profiles, { eq }) => eq(profiles.slug, input.slug),
        })
        .execute()

      if (existingProfileBySlug) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `A profile with slug "${input.slug}" already exists. Please try editing the slug and resubmitting.`,
        })
      }

      let memberInsert:
        | Pick<
            z.infer<typeof inserts.profileMembers>,
            'email' | 'first_name' | 'last_name' | 'user_id'
          >
        | undefined

      if (ctx.auth.userEmail && ctx.auth.userFirstName && ctx.auth.userLastName) {
        memberInsert = {
          email: ctx.auth.userEmail,
          first_name: ctx.auth.userFirstName,
          last_name: ctx.auth.userLastName,
          user_id: ctx.auth.userId,
        }
      } else {
        const me = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, ctx.auth.userId),
        })

        if (!me) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: `Please complete creating your account.`,
          })
        }

        memberInsert = {
          email: me.email,
          first_name: me.first_name,
          last_name: me.last_name,
          user_id: me.id,
        }
      }

      const { profile, member } = await db.transaction(async (tx) => {
        const [profile] = await tx
          .insert(schema.profiles)
          .values({
            ...input,
            stripe_connect_account_id: await stripe.accounts.create().then((account) => account.id),
          })
          .returning(pick('profiles', publicSchema.profiles.ProfilePublic))
          .execute()

        if (!profile) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
        }

        // add this user as a member

        const [member] = await tx
          .insert(schema.profileMembers)
          .values({
            ...memberInsert,
            profile_id: profile.id,
          })
          .returning(pick('profileMembers', publicSchema.profileMembers.ProfileMemberInternal))
          .execute()

        return { profile, member }
      })

      return { profile, member }
    }),
  updateProfile: authedProcedure
    .input(
      z.object({
        id: z.string(),
        patch: inserts.profiles.partial().pick({
          name: true,
          slug: true,
          bio: true,
          github_username: true,
          image_vendor: true,
          image_vendor_id: true,
        }),
      })
    )
    .mutation(
      async ({
        ctx,
        input: {
          id,
          patch: { bio, github_username, image_vendor, image_vendor_id, name, slug },
        },
      }) => {
        let profileMembers = await db.query.profileMembers
          .findMany({
            where: (profileMembers, { eq }) => eq(profileMembers.profile_id, id),
          })
          .execute()

        if (!profileMembers.find((member) => member.user_id === ctx.auth.userId)) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: `You are not a member of this profile.`,
          })
        }

        const [profile] = await db
          .update(schema.profiles)
          .set({
            bio,
            github_username,
            image_vendor,
            image_vendor_id,
            name,
            slug,
          })
          .where(d.eq(schema.profiles.id, id))
          .returning(pick('profiles', publicSchema.profiles.ProfilePublic))
          .execute()

        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }

        return profile
      }
    ),
  deleteProfile: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input: { id } }) => {
      const profileMembers = await db.query.profileMembers
        .findMany({
          where: (profileMembers, { eq }) => eq(profileMembers.profile_id, id),
        })
        .execute()

      if (!profileMembers.find((member) => member.user_id === ctx.auth.userId)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      const [profile] = await db
        .delete(schema.profiles)
        .where(d.eq(schema.profiles.id, id))
        .returning()
        .execute()

      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Profile not found.` })
      }

      return true
    }),
  profileBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ input: { slug } }) => {
      const publicProfile = await db.query.profiles
        .findFirst({
          where: (profiles, { eq }) => eq(profiles.slug, slug),
          columns: publicSchema.profiles.ProfilePublic,
        })
        .execute()

      if (!publicProfile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Profile not found.` })
      }

      return publicProfile
    }),
}

const profileMember = {
  createProfileMember: authedProcedure
    .input(
      inserts.profileMembers.pick({
        profile_id: true,
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existentUser = await db.query.users.findFirst({
        where: (users, { eq }) => {
          if (input.user_id) {
            return eq(users.id, input.user_id)
          }

          return eq(users.email, input.email)
        },
      })
      input.user_id = existentUser?.id

      const [profileMember] = await db
        .insert(schema.profileMembers)
        .values(input)
        .returning(pick('profileMembers', publicSchema.profileMembers.ProfileMemberInternal))
        .execute()

      if (!profileMember) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Profile member couldn't get created.` })
      }

      // TODO send an email to the new member

      return profileMember
    }),

  updateProfileMember: authedProcedure
    .input(
      z.object({
        id: z.string(),
        patch: inserts.profileMembers.partial().pick({
          first_name: true,
          last_name: true,
          email: true,
        }),
      })
    )
    .mutation(async ({ ctx, input: { id, patch } }) => {
      const myMembership = await db.query.profileMembers
        .findFirst({
          where: (profileMembers, { eq, and }) =>
            and(eq(profileMembers.id, ctx.auth.userId), eq(profileMembers.profile_id, id)),
        })
        .execute()

      if (!myMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Only profile members can update other members.`,
        })
      }

      const [profileMember] = await db
        .update(schema.profileMembers)
        .set(patch)
        .where(d.eq(schema.profileMembers.id, id))
        .returning(pick('profileMembers', publicSchema.profileMembers.ProfileMemberInternal))
        .execute()

      if (!profileMember) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Profile member couldn't get updated.` })
      }

      return profileMember
    }),

  deleteProfileMember: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input: { id } }) => {
      const myMembership = await db.query.profileMembers
        .findFirst({
          where: (profileMembers, { eq, and }) =>
            and(eq(profileMembers.id, ctx.auth.userId), eq(profileMembers.profile_id, id)),
          columns: publicSchema.profileMembers.ProfileMemberInternal,
        })
        .execute()

      if (!myMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Only profile members can update other members.`,
        })
      }

      const [profileMember] = await db
        .delete(schema.profileMembers)
        .where(d.eq(schema.profileMembers.id, id))
        .returning()
        .execute()

      if (!profileMember) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Profile member couldn't get deleted.` })
      }

      return true
    }),

  profileMembers: authedProcedure
    .input(z.object({ profile_id: z.string() }))
    .query(async ({ ctx, input: { profile_id } }) => {
      const profileMembers = await db.query.profileMembers
        .findMany({
          where: (profileMembers, { eq, and }) => and(eq(profileMembers.profile_id, profile_id)),
          columns: publicSchema.profileMembers.ProfileMemberInternal,
        })
        .execute()

      const amIMember = profileMembers.find((member) => member.user_id === ctx.auth.userId)

      if (!amIMember) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      return profileMembers
    }),

  profileMembers_public: publicProcedure
    .input(z.object({ profile_id: z.string() }))
    .query(async ({ input: { profile_id } }) => {
      const profileMembers = await db.query.profileMembers
        .findMany({
          where: (profileMembers, { eq, and }) => and(eq(profileMembers.profile_id, profile_id)),
          columns: publicSchema.profileMembers.ProfileMemberPublic,
        })
        .execute()

      return profileMembers
    }),
}

const repository = {
  repositoryBySlug: publicProcedure
    .input(z.object({ slug: z.string(), profile_slug: z.string() }))
    .query(async ({ input: { slug, profile_slug } }) => {
      const repository = await db.query.repositories
        .findFirst({
          where: (repositories, { eq, and }) =>
            and(eq(repositories.slug, slug), eq(schema.profiles.slug, profile_slug)),
        })
        .execute()

      return repository
    }),

  createRepository: authedProcedure
    .input(
      inserts.repositories.pick({
        profile_id: true,
        slug: true,
        name: true,
        github_url: true,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [repository] = await db
        .insert(schema.repositories)
        .values(input)
        .returning(pick('repositories', publicSchema.repositories.RepositoryPublic))
        .execute()

      if (!repository) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Repository couldn't get created.`,
        })
      }

      return repository
    }),
}

export const appRouter = router({
  hello: publicProcedure.query(({ ctx }) => {
    return 'hello there sir'
  }),

  ...user,
  ...profile,
  ...profileMember,
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
