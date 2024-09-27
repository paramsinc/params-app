import { select } from 'app/helpers/select'
import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'
import { Insert, inserts, selects } from 'app/db/inserts-and-selects'
import { d, db, schema } from 'app/db/db'
import { TRPCError } from '@trpc/server'
import { stripe } from 'app/features/stripe-connect/server/stripe'
import {
  createCalcomUser as createCalcomUser,
  deleteCalcomAccount,
  getCalcomUser,
  getCalcomUsers,
} from 'app/trpc/routes/cal-com'
import { pick } from 'app/trpc/pick'
import { publicSchema } from 'app/trpc/publicSchema'
import { isValidSlug, slugify } from 'app/trpc/slugify'
import { getOnlyOrg_OrCreateOrg_OrThrowIfUserHasMultipleOrgs } from 'app/trpc/routes/organization'

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
        .pick({ slug: true, first_name: true, last_name: true, email: true })
        .partial()
        .optional()
    )
    .output(selects.users.pick(publicSchema.users.UserPublic))
    .mutation(async ({ ctx, input = {} }) => {
      const firstName = input.first_name ?? ctx.auth.userFirstName
      const lastName = input.last_name ?? ctx.auth.userLastName
      const email = input.email ?? ctx.auth.userEmail
      console.log('[createMe]', firstName, lastName, email)
      if (!firstName || !lastName || !email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Please provide your first name, last name, and email.`,
        })
      }
      const baseSlug = input.slug ?? slugify([firstName, lastName].filter(Boolean).join(' '))
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

const calcomUserInsert = z
  .object({
    timeFormat: z.number().int(),
    weekStart: z
      .enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .optional(),
    timeZone: z.string(),
    disableCreateMember: z.boolean(),
  })
  .partial()

const profile = {
  isProfileSlugAvailable: authedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input: { slug } }) => {
      if (!slug || !isValidSlug(slug)) {
        return false
      }
      const existingProfileBySlug = await db.query.profiles
        .findFirst({
          where: (profiles, { eq }) => eq(profiles.slug, slug),
        })
        .execute()
      return !existingProfileBySlug
    }),
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
        .merge(calcomUserInsert)
    )
    .mutation(
      async ({
        input: { timeFormat, weekStart, timeZone, disableCreateMember, ...input },
        ctx,
      }) => {
        const { profile, member } = await db.transaction(async (tx) => {
          const existingProfileBySlug = await tx.query.profiles
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

          const me = await tx.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, ctx.auth.userId),
          })

          if (!me) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: `Please complete creating your account.`,
            })
          }

          const memberInsert: Omit<Zod.infer<typeof inserts.profileMembers>, 'profile_id'> = {
            first_name: me.first_name,
            last_name: me.last_name,
            email: me.email,
            user_id: me.id,
          }
          const calcomUser = await tx.query.calcomUsers.findFirst({
            where: (calcomUsers, { eq }) => eq(calcomUsers.email, memberInsert.email),
          })
          let calcom_user_id = calcomUser?.id
          if (!calcom_user_id) {
            const createdCalcomUser = await createCalcomUser({
              email: memberInsert.email,
              name: [memberInsert.first_name, memberInsert.last_name].filter(Boolean).join(' '),
              timeFormat: (timeFormat as 12 | 24) ?? 12,
              weekStart,
              timeZone,
            })
            if (createdCalcomUser.status !== 'success') {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Couldn't create your calendar account for ${memberInsert.email}. Please try again.`,
              })
            }
            await tx
              .insert(schema.calcomUsers)
              .values({
                id: createdCalcomUser.data.user.id,
                email: createdCalcomUser.data.user.email,
                access_token: createdCalcomUser.data.accessToken,
                refresh_token: createdCalcomUser.data.refreshToken,
              })
              .returning()
              .execute()
              .catch(async (e) => {
                // garbage collect the stale calcom user if db insertion fails
                await deleteCalcomAccount(createdCalcomUser.data.user.id)

                throw e
              })
            calcom_user_id = createdCalcomUser.data.user.id
          }

          const [profile] = await tx
            .insert(schema.profiles)
            .values({
              ...input,
              stripe_connect_account_id: await stripe.accounts
                .create({
                  settings: {
                    payouts: {
                      schedule: {
                        interval: 'manual',
                      },
                    },
                  },
                })
                .then((account) => account.id),
              calcom_user_id,
            })
            .returning(pick('profiles', publicSchema.profiles.ProfileInternal))
            .execute()

          if (!profile) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Couldn't create profile.`,
            })
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

      await deleteCalcomAccount(profile.calcom_user_id)

      return true
    }),
  profileBySlug_public: publicProcedure
    .input(
      z.object({
        profile_slug: z.string(),
      })
    )
    .query(async ({ input: { profile_slug: slug } }) => {
      const profileRepoPairs = await db
        .select({
          ...pick('profiles', publicSchema.profiles.ProfilePublic),
          repo: pick('repositories', publicSchema.repositories.RepositoryPublic),
        })
        .from(schema.profiles)
        .leftJoin(schema.repositories, d.eq(schema.repositories.profile_id, schema.profiles.id))
        .where(d.eq(schema.profiles.slug, slug))
        .limit(100)
        .execute()
      console.log('[q]', profileRepoPairs)
      const repos = profileRepoPairs.map((p) => p.repo).filter(Boolean)
      const [first] = profileRepoPairs
      if (!first) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Profile not found.` })
      }

      const { repo: _, ...publicProfile } = first

      return {
        ...publicProfile,
        repos,
      }
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
    console.log('[myProfiles]', ctx)
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

      if (!profile?.calcom_user_id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found.`,
        })
      }

      const calUser = await getCalcomUser(profile.calcom_user_id)

      if (calUser.status !== 'success') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Couldn't get cal user.`,
        })
      }

      return calUser.data
    }),
  calcomAccessTokenByProfileSlug: authedProcedure
    .input(z.object({ profileSlug: z.string() }))
    .query(async ({ ctx, input: { profileSlug } }) => {
      const [first] = await db
        .select({
          calcomUser: pick('calcomUsers', { access_token: true }),
          profile: pick('profiles', { slug: true, id: true }),
          myMembership: pick('profileMembers', { id: true }),
        })
        .from(schema.profiles)
        .where(d.eq(schema.profiles.slug, profileSlug))
        .innerJoin(
          schema.profileMembers,
          d.and(
            d.eq(schema.profileMembers.profile_id, schema.profiles.id),
            d.eq(schema.profileMembers.user_id, ctx.auth.userId)
          )
        )
        .innerJoin(schema.calcomUsers, d.eq(schema.calcomUsers.id, schema.profiles.calcom_user_id))
        .limit(1)
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `You don't have access to this profile's cal account.`,
        })
      }

      return first.calcomUser.access_token
    }),
  allProfiles_admin: authedProcedure.query(async ({ ctx }) => {
    // TODO admin
    const profiles = await db.query.profiles.findMany({
      columns: publicSchema.profiles.ProfileInternal,
    })
    return profiles
  }),

  profileConnectAccountSession: authedProcedure
    .input(z.object({ profile_slug: z.string() }))
    .query(async ({ ctx, input: { profile_slug } }) => {
      const [first] = await db
        .select({
          profile: pick('profiles', { stripe_connect_account_id: true }),
          myMembership: pick('profileMembers', { id: true }),
        })
        .from(schema.profiles)
        .innerJoin(
          schema.profileMembers,
          d.eq(schema.profileMembers.profile_id, schema.profiles.id)
        )
        .where(
          d.and(
            d.eq(schema.profileMembers.user_id, ctx.auth.userId),
            d.eq(schema.profiles.slug, profile_slug)
          )
        )
        .limit(1)
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found.`,
        })
      }

      const { myMembership, profile } = first

      if (!myMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      const accountSession = await stripe.accountSessions.create({
        account: profile.stripe_connect_account_id,
        components: {
          account_onboarding: { enabled: true },
          account_management: { enabled: true },
          payouts: { enabled: true },
          payouts_list: { enabled: true },
          balances: { enabled: true },
          tax_registrations: { enabled: true },
          payment_details: { enabled: true },
        },
      })

      return accountSession
    }),

  profileConnectAccount: authedProcedure
    .input(z.object({ profile_slug: z.string() }))
    .query(async ({ ctx, input: { profile_slug } }) => {
      const profile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.slug, profile_slug),
      })

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile not found.`,
        })
      }

      const myMembership = await db.query.profileMembers
        .findFirst({
          where: (profileMembers, { eq, and }) =>
            and(
              eq(profileMembers.profile_id, profile.id),
              eq(profileMembers.user_id, ctx.auth.userId)
            ),
        })
        .execute()

      if (!myMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id)

      return account
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile member couldn't get created.`,
        })
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile member couldn't get updated.`,
        })
      }

      return profileMember
    }),

  deleteProfileMember: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input: { id } }) => {
      const myMembership = await db.query.profileMembers
        .findFirst({
          where: (profileMembers, { eq, and }) =>
            and(eq(profileMembers.user_id, ctx.auth.userId), eq(profileMembers.id, id)),
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile member couldn't get deleted.`,
        })
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
  profileMembersBySlug: authedProcedure
    .input(z.object({ profile_slug: z.string() }))
    .query(async ({ ctx, input: { profile_slug } }) => {
      // TODO merge into one query?
      const profile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.slug, profile_slug),
      })

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Profile with slug "${profile_slug}" not found.`,
        })
      }

      const profileMembers = await db.query.profileMembers
        .findMany({
          where: (profileMembers, { eq, and }) => and(eq(profileMembers.profile_id, profile.id)),
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
  repoBySlug: publicProcedure
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

  createRepo: authedProcedure
    .input(
      inserts.repositories.pick({
        profile_id: true,
        slug: true,
        github_url: true,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.slug || !isValidSlug(input.slug)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid slug. Please use only lowercase letters, numbers, and dashes.`,
        })
      }

      const isMemberOfProfile = await db.query.profileMembers
        .findFirst({
          where: (profileMembers, { eq, and }) =>
            and(
              eq(profileMembers.profile_id, input.profile_id),
              eq(profileMembers.user_id, ctx.auth.userId)
            ),
        })
        .execute()

      if (!isMemberOfProfile) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

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
  reposByProfileSlug: publicProcedure
    .input(z.object({ profile_slug: z.string() }))
    .query(async ({ input: { profile_slug } }) => {
      const repos = db
        .select({
          ...pick('repositories', publicSchema.repositories.RepositoryPublic),
          profile: pick('profiles', publicSchema.profiles.ProfilePublic),
        })
        .from(schema.repositories)
        .innerJoin(schema.profiles, d.eq(schema.repositories.profile_id, schema.profiles.id))
        .where(d.eq(schema.profiles.slug, profile_slug))
        .execute()

      return repos
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
  ...repository,
  /**
   * @deprecated
   */
  stripeCheckoutSession: publicProcedure
    .input(z.object({ session_id: z.string() }))
    .query(async ({ input: { session_id } }) => {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      const customer =
        typeof session.customer === 'string'
          ? await stripe.customers.retrieve(session.customer)
          : null
      return { session, customer }
    }),
  createOfferAndPaymentIntent: authedProcedure
    .input(
      z.object({
        profile_id: z.string(),
        stripe_confirmation_token_id: z.string(),
        organization_id: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { paymentIntent } = await db.transaction(async (tx) => {
        if (!input.organization_id) {
          input.organization_id = await getOnlyOrg_OrCreateOrg_OrThrowIfUserHasMultipleOrgs({
            userId: ctx.auth.userId,
            transaction: tx,
          })
        } else {
          const orgId = input.organization_id
          const isInOrg = await tx.query.organizationMembers
            .findFirst({
              where: (organizationMembers, { eq, and }) =>
                and(
                  eq(organizationMembers.organization_id, orgId),
                  eq(organizationMembers.user_id, ctx.auth.userId)
                ),
            })
            .execute()

          if (!isInOrg) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: `You are not a member of this organization.`,
            })
          }
        }
        const { profile_id, stripe_confirmation_token_id } = input

        const [first] = await tx
          .select({
            profile: schema.profiles,
            calcomUser: schema.calcomUsers,
          })
          .from(schema.profiles)
          .innerJoin(
            schema.calcomUsers,
            d.eq(schema.calcomUsers.id, schema.profiles.calcom_user_id)
          )
          .where(d.eq(schema.profiles.id, profile_id))
          .limit(1)
          .execute()

        if (!first) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Profile not found.`,
          })
        }

        const { profile } = first

        const [offer] = await tx
          .insert(schema.offers)
          .values({
            profile_id: profile.id,
            created_by_user_id: ctx.auth.userId,
            organization_id: input.organization_id,
          })
          .returning()
          .execute()
        if (!offer) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Offer couldn't get created.`,
          })
        }

        const amount = 10_00 // TODO pull from a plan or something
        const currency = 'usd' // TODO make this dynamic
        const application_fee_amount = 123 // TODO calculate

        const paymentIntent = await stripe.paymentIntents.create(
          {
            amount,
            currency,
            confirm: true,
            confirmation_token: stripe_confirmation_token_id,
            application_fee_amount,
            transfer_data: {
              destination: profile.stripe_connect_account_id,
            },
            metadata: {
              offer_id: offer.id,
            },
            payment_method_types: ['card'],
          },
          {
            // is this correct?
            idempotencyKey: offer.id,
          }
        )

        await tx
          .update(schema.offers)
          .set({ stripe_payment_intent_id: paymentIntent.id })
          .where(d.eq(schema.offers.id, offer.id))
          .execute()

        return { paymentIntent }
      })

      return {
        paymentIntent: {
          client_secret: paymentIntent.client_secret,
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      }
    }),
  offerByPaymentIntentId: publicProcedure
    .input(z.object({ payment_intent_id: z.string(), payment_intent_client_secret: z.string() }))
    .query(async ({ input: { payment_intent_id, payment_intent_client_secret } }) => {
      const offer = await db.query.offers.findFirst({
        where: (offers, { eq }) => eq(offers.stripe_payment_intent_id, payment_intent_id),
        columns: {
          id: true,
          profile_id: true,
          created_at: true,
          last_updated_at: true,
          voided: true,
          stripe_payment_intent_id: true,
          organization_id: true,
        },
      })

      if (!offer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Offer not found. Are you sure this is a valid URL?`,
        })
      }
      const { stripe_payment_intent_id } = offer

      if (!stripe_payment_intent_id) {
        return null
      }

      const { amount, status, client_secret } = await stripe.paymentIntents.retrieve(
        stripe_payment_intent_id
      )

      if (client_secret !== payment_intent_client_secret) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Invalid payment intent client secret.`,
        })
      }

      return {
        paymentIntent: {
          amount,
          status,
        },
        offer,
      }
    }),
})

export type AppRouter = typeof appRouter
