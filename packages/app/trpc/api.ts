import { select } from 'app/helpers/select'
import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'
import { Insert, inserts, selects } from 'app/db/inserts-and-selects'
import { d, db, schema } from 'app/db/db'
import { TRPCError } from '@trpc/server'
import { stripe } from 'app/features/stripe-connect/server/stripe'
import {
  createCalcomAccountAndSchedule,
  deleteCalcomAccount,
  getCalcomUser,
  getCalcomUsers,
} from 'app/trpc/routes/cal-com'
import { pick } from 'app/trpc/pick'
import { publicSchema } from 'app/trpc/publicSchema'
import { slugify } from 'app/trpc/slugify'

async function createUser(
  insert: Omit<Zod.infer<typeof inserts.users>, 'slug'> &
    Partial<Pick<Zod.infer<typeof inserts.users>, 'slug'>>
) {
  const { first_name, last_name, email, id } = insert
  let slugSearchCount = 0
  const baseSlug =
    insert.slug ||
    slugify([first_name, last_name].filter(Boolean).join(' ')) ||
    Math.round(Math.random() * 1000000).toString()
  let slug = baseSlug
  // should this throw and just say that the slug is taken?
  while (await db.query.users.findFirst({ where: (users, { eq }) => eq(users.slug, slug) })) {
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
  const user = await db.transaction(async (tx) => {
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
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Couldn't create user.` })
    }

    const addUserToProfilesWhereEmailMatches = await tx
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
      const user = await createUser({
        first_name: firstName,
        last_name: lastName,
        email,
        slug: input.slug,
        id: ctx.auth.userId,
      })

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
      inserts.profiles
        .pick({
          name: true,
          slug: true,
          bio: true,
          github_username: true,
          image_vendor: true,
          image_vendor_id: true,
        })
        .merge(
          z.object({
            timeFormat: z.enum(['12', '24']).optional(),
            weekStart: z
              .enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
              .optional(),
            timeZone: z.string().optional(),
            disableCreateMember: z.boolean().optional(),
          })
        )
    )
    .mutation(
      async ({
        input: { timeFormat, weekStart, timeZone, disableCreateMember, ...input },
        ctx,
      }) => {
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

        // TODO move this to the user...
        // const { calcomAccount } = await createCalcomAccountAndSchedule({
        //   email: memberInsert.email,
        //   name: [memberInsert.first_name, memberInsert.last_name].filter(Boolean).join(' '),
        //   timeFormat,
        //   weekStart,
        //   timeZone,
        // })

        // console.log('[createProfile][calcomProfile]', calcomAccount)

        const { profile, member } = await db.transaction(async (tx) => {
          const [profile] = await tx
            .insert(schema.profiles)
            .values({
              ...input,
              stripe_connect_account_id: await stripe.accounts
                .create()
                .then((account) => account.id),
              // ...(calcomAccount.status === 'success' && {
              //   cal_com_account_id: calcomAccount.data.user.id,
              //   cal_com_access_token: calcomAccount.data.accessToken,
              //   cal_com_refresh_token: calcomAccount.data.refreshToken,
              // }),
            })
            .returning(pick('profiles', publicSchema.profiles.ProfileInternal))
            .execute()

          if (!profile) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
          }

          // add this user as a member

          const [member] = disableCreateMember
            ? []
            : await tx
                .insert(schema.profileMembers)
                .values({
                  ...memberInsert,
                  profile_id: profile.id,
                })
                .returning(
                  pick('profileMembers', publicSchema.profileMembers.ProfileMemberInternal)
                )
                .execute()

          return { profile, member }
        })

        return { profile, member }
      }
    ),
  updateProfile: authedProcedure
    .input(
      z.object({
        id: z.string(),
        patch: inserts.profiles
          .partial()
          .pick({
            name: true,
            slug: true,
            bio: true,
            github_username: true,
            image_vendor: true,
            image_vendor_id: true,
          })
          .partial(),
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
          .returning(pick('profiles', publicSchema.profiles.ProfileInternal))
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
          where: (profileMembers, { eq, and }) =>
            and(eq(profileMembers.profile_id, id), eq(profileMembers.user_id, ctx.auth.userId)),
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

      if (profile.cal_com_account_id) {
        await deleteCalcomAccount(profile.cal_com_account_id)
      }

      return true
    }),
  profileBySlug_public: publicProcedure
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
  profileBySlug: authedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input: { slug } }) => {
      const profile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.slug, slug),
        columns: publicSchema.profiles.ProfileInternal,
      })

      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Profile not found.` })
      }

      const amIMember = await db.query.profileMembers
        .findFirst({
          where: (profileMembers, { eq, and }) =>
            and(
              eq(profileMembers.profile_id, profile.id),
              eq(profileMembers.user_id, ctx.auth.userId)
            ),
        })
        .execute()

      if (!amIMember) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      return profile
    }),
  myProfiles: authedProcedure.query(async ({ ctx }) => {
    const profiles = await db
      .select(pick('profiles', publicSchema.profiles.ProfileInternal))
      .from(schema.profiles)
      .innerJoin(schema.profileMembers, d.eq(schema.profileMembers.profile_id, schema.profiles.id))
      .where(d.eq(schema.profileMembers.user_id, ctx.auth.userId))
      .execute()

    return profiles
  }),

  calUserByProfileSlug: authedProcedure
    .input(z.object({ profileSlug: z.string() }))
    .query(async ({ ctx, input: { profileSlug } }) => {
      const profile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.slug, profileSlug),
      })

      if (!profile?.cal_com_account_id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found.`,
        })
      }

      const calUser = await getCalcomUser(profile.cal_com_account_id)

      if (calUser.status !== 'success') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Couldn't get cal user.`,
        })
      }

      return calUser.data
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

const calCom = {
  // TODO admin only procedure...
  cca: authedProcedure.query(async ({ ctx }) => {
    const calComUsers = await getCalcomUsers()
    return calComUsers
  }),
  dcca: authedProcedure.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
    const calComUser = await deleteCalcomAccount(input.userId)

    return calComUser
  }),
}

export const appRouter = router({
  hello: publicProcedure.query(({ ctx }) => {
    return 'hello there sir'
  }),

  ...user,
  ...profile,
  ...profileMember,
  ...calCom,
})

export type AppRouter = typeof appRouter
