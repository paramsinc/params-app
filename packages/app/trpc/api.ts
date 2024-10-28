import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'
import { inserts, selects } from 'app/db/inserts-and-selects'
import { d, db, pg, schema } from 'app/db/db'
import { TRPCError } from '@trpc/server'
import { stripe } from 'app/features/stripe-connect/server/stripe'
import { deleteCalcomAccount, getCalcomUser, getCalcomUsers } from 'app/trpc/routes/cal-com'
import { pick } from 'app/trpc/pick'
import { publicSchema } from 'app/trpc/publicSchema'
import { isValidSlug, slugify } from 'app/trpc/slugify'
import { getOnlyOrg_OrCreateOrg_OrThrowIfUserHasMultipleOrgs } from 'app/trpc/routes/organization'
import { cdn } from 'app/multi-media/cdn'
import { keys } from 'app/helpers/object'
import { availabilityRangesShape } from 'app/db/types'
import { DateTime } from 'app/dates/date-time'
import { googleOauth } from 'app/vendor/google/google-oauth'
import { createUser } from 'app/trpc/routes/user'
import { serverEnv } from 'app/env/env.server'

const [firstCdn, ...restCdns] = keys(cdn)

const imageVendor = z.enum([firstCdn!, ...restCdns])

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
    .output(z.object({ slug: z.string(), isAvailable: z.boolean() }))
    .query(async ({ input: { slug } }) => {
      if (!slug || !isValidSlug(slug)) {
        return { slug, isAvailable: false }
      }
      const existingProfileBySlug = await db.query.profiles
        .findFirst({
          where: (profiles, { eq }) => eq(profiles.slug, slug),
        })
        .execute()
      return { slug, isAvailable: !existingProfileBySlug }
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

          const stripe_connect_account_id = await stripe.accounts
            .create({
              settings: {
                payouts: {
                  schedule: {
                    interval: 'manual',
                  },
                },
              },
            })
            .then((account) => account.id)

          const [profile] = await tx
            .insert(schema.profiles)
            .values({
              ...input,
              stripe_connect_account_id,
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
          .pick({
            name: true,
            slug: true,
            bio: true,
            github_username: true,
            image_vendor_id: true,
            image_vendor: true,
          })
          .merge(
            z.object({
              availability_ranges: availabilityRangesShape,
            })
          )
          .partial(),
      })
    )
    .mutation(
      async ({
        ctx,
        input: {
          id,
          patch: {
            bio,
            github_username,
            image_vendor,
            image_vendor_id,
            name,
            slug,
            availability_ranges,
          },
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
            availability_ranges,
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

      return true
    }),
  profileBySlug_public: publicProcedure
    .input(
      z.object({
        profile_slug: z.string(),
      })
    )
    .query(async ({ input: { profile_slug: slug }, ctx }) => {
      const profileRepoPairs = await db
        .select({
          publicProfile: pick('profiles', publicSchema.profiles.ProfilePublic),
          repo: pick('repositories', publicSchema.repositories.RepositoryPublic),
          myMembership: pick('profileMembers', { id: true, user_id: true }),
        })
        .from(schema.profiles)
        .leftJoin(schema.repositories, d.eq(schema.repositories.profile_id, schema.profiles.id))
        .leftJoin(
          schema.profileMembers,
          d.and(
            d.eq(schema.profileMembers.profile_id, schema.profiles.id),
            ...[
              d.eq(
                schema.profileMembers.user_id,
                ctx.auth.userId ?? '' // it's fine, this wouldn't happen
              ),
            ]
          )
        )
        .where(d.eq(schema.profiles.slug, slug))
        .limit(100)
        .execute()
      const repos = profileRepoPairs.map((p) => p.repo).filter(Boolean)
      const [first] = profileRepoPairs
      if (!first) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Profile not found.` })
      }
      const amIAMember = profileRepoPairs.some((p) => p.myMembership)

      const { publicProfile } = first

      return {
        ...publicProfile,
        repos,
        canIEdit: amIAMember,
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

  calUserByProfileSlug_public: publicProcedure
    .input(z.object({ profileSlug: z.string() }))
    .query(async ({ input: { profileSlug } }) => {
      const profile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.slug, profileSlug),
      })

      if (!profile) {
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

      return calUser.data.username
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
    .input(z.object({ repo_slug: z.string(), profile_slug: z.string() }))
    .query(async ({ input: { repo_slug, profile_slug } }) => {
      const [repository] = await db
        .select({
          ...pick('repositories', publicSchema.repositories.RepositoryPublic),
          profile: pick('profiles', publicSchema.profiles.ProfilePublic),
        })
        .from(schema.repositories)
        .where(d.eq(schema.repositories.slug, repo_slug))
        .innerJoin(schema.profiles, d.eq(schema.repositories.profile_id, schema.profiles.id))
        .limit(1)
        .execute()

      if (!repository) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Repository not found.`,
        })
      }

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
  updateRepo: authedProcedure
    .input(
      z.object({
        repo_id: z.string(),
        patch: inserts.repositories
          .pick({
            slug: true,
            github_url: true,
          })
          .partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [first] = await db
        .select({
          ...pick('repositories', {
            id: true,
          }),
          profile: pick('profiles', publicSchema.profiles.ProfilePublic),
          myProfileMembership: pick(
            'profileMembers',
            publicSchema.profileMembers.ProfileMemberPublic
          ),
        })
        .from(schema.repositories)
        .where(d.eq(schema.repositories.id, input.repo_id))
        .innerJoin(schema.profiles, d.eq(schema.profiles.id, schema.repositories.profile_id))
        .leftJoin(
          schema.profileMembers,
          d.and(
            d.eq(schema.profileMembers.profile_id, schema.profiles.id),
            d.eq(schema.profileMembers.user_id, ctx.auth.userId)
          )
        )
        .limit(1)
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Profile not found for that repository.`,
        })
      }

      if (!first.myProfileMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      const [result] = await db
        .update(schema.repositories)
        .set(input.patch)
        .where(d.eq(schema.repositories.id, input.repo_id))
        .returning(pick('repositories', publicSchema.repositories.RepositoryPublic))
        .execute()

      return result
    }),

  deleteRepo: authedProcedure
    .input(z.object({ repo_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [first] = await db
        .select({
          ...pick('repositories', {
            id: true,
          }),
          profile: pick('profiles', publicSchema.profiles.ProfilePublic),
          myProfileMembership: pick(
            'profileMembers',
            publicSchema.profileMembers.ProfileMemberPublic
          ),
        })
        .from(schema.repositories)
        .where(d.eq(schema.repositories.id, input.repo_id))
        .innerJoin(schema.profiles, d.eq(schema.profiles.id, schema.repositories.profile_id))
        .leftJoin(
          schema.profileMembers,
          d.and(
            d.eq(schema.profileMembers.profile_id, schema.profiles.id),
            d.eq(schema.profileMembers.user_id, ctx.auth.userId)
          )
        )
        .limit(1)
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Repository not found.`,
        })
      }

      if (!first.myProfileMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      await db
        .delete(schema.repositories)
        .where(d.eq(schema.repositories.id, input.repo_id))
        .execute()

      return true
    }),

  repoById: publicProcedure
    .input(z.object({ repo_id: z.string() }))
    .query(async ({ input: { repo_id } }) => {
      const repo = await db.query.repositories.findFirst({
        where: (repositories, { eq }) => eq(repositories.id, repo_id),
        columns: {
          id: true,
          slug: true,
          github_url: true,
        },
      })
      return repo
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

const profilePlan = {
  createOnetimePlan: authedProcedure
    .input(
      inserts.profileOnetimePlans.pick({
        profile_id: true,
        price: true,
        currency: true,
        duration_mins: true,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const myMembership = await db.query.profileMembers
        .findFirst({
          where: (profileMembers, { eq, and }) =>
            and(
              eq(profileMembers.profile_id, input.profile_id),
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

      const [result] = await db
        .insert(schema.profileOnetimePlans)
        .values(input)
        .returning()
        .execute()

      if (!result) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create plan.`,
        })
      }

      return result
    }),
  onetimePlansByProfileSlug_public: publicProcedure
    .input(z.object({ profile_slug: z.string() }))
    .query(async ({ input: { profile_slug } }) => {
      const results = await db
        .select({
          onetimePlan: pick('profileOnetimePlans', {
            currency: true,
            duration_mins: true,
            price: true,
            id: true,
          }),
        })
        .from(schema.profiles)
        .innerJoin(
          schema.profileOnetimePlans,
          d.eq(schema.profileOnetimePlans.profile_id, schema.profiles.id)
        )
        .where(d.eq(schema.profiles.slug, profile_slug))
        .orderBy(d.desc(schema.profileOnetimePlans.duration_mins))
        .execute()

      const plans = results.map((result) => result.onetimePlan)

      return plans
    }),
  deleteOnetimePlan: authedProcedure
    .input(z.object({ plan_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [first] = await db
        .select({
          ...pick('profileOnetimePlans', {
            id: true,
          }),
          myProfileMembership: pick(
            'profileMembers',
            publicSchema.profileMembers.ProfileMemberPublic
          ),
          profile: pick('profiles', publicSchema.profiles.ProfilePublic),
        })
        .from(schema.profileOnetimePlans)
        .where(d.eq(schema.profileOnetimePlans.id, input.plan_id))
        .innerJoin(schema.profiles, d.eq(schema.profiles.id, schema.profileOnetimePlans.profile_id))
        .leftJoin(
          schema.profileMembers,
          d.and(
            d.eq(schema.profileMembers.profile_id, schema.profiles.id),
            d.eq(schema.profileMembers.user_id, ctx.auth.userId)
          )
        )
        .limit(1)
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Profile plan not found.`,
        })
      }

      if (!first?.myProfileMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      if (!first?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Profile plan not found.`,
        })
      }

      await db
        .delete(schema.profileOnetimePlans)
        .where(d.eq(schema.profileOnetimePlans.id, input.plan_id))
        .execute()

      return true
    }),
  updateOnetimePlan: authedProcedure
    .input(
      z.object({
        plan_id: z.string(),
        patch: inserts.profileOnetimePlans
          .pick({
            price: true,
            currency: true,
            duration_mins: true,
          })
          .partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [first] = await db
        .select({
          ...pick('profileOnetimePlans', {
            id: true,
          }),
          profile: pick('profiles', publicSchema.profiles.ProfilePublic),
          myProfileMembership: pick(
            'profileMembers',
            publicSchema.profileMembers.ProfileMemberPublic
          ),
        })
        .from(schema.profileOnetimePlans)
        .where(d.eq(schema.profileOnetimePlans.id, input.plan_id))
        .innerJoin(schema.profiles, d.eq(schema.profiles.id, schema.profileOnetimePlans.profile_id))
        .leftJoin(
          schema.profileMembers,
          d.and(
            d.eq(schema.profileMembers.profile_id, schema.profiles.id),
            d.eq(schema.profileMembers.user_id, ctx.auth.userId)
          )
        )
        .limit(1)
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Profile not found for that plan.`,
        })
      }

      if (!first.myProfileMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      const [result] = await db
        .update(schema.profileOnetimePlans)
        .set(input.patch)
        .where(d.eq(schema.profileOnetimePlans.id, input.plan_id))
        .returning()
        .execute()

      return result
    }),

  onetimePlanById_public: publicProcedure
    .input(z.object({ plan_id: z.string() }))
    .query(async ({ input: { plan_id } }) => {
      const plan = await db.query.profileOnetimePlans.findFirst({
        where: (profileOnetimePlans, { eq }) => eq(profileOnetimePlans.id, plan_id),
        columns: {
          id: true,
          price: true,
          currency: true,
          duration_mins: true,
        },
      })
      return plan
    }),
}

export const upcomingSlotsShape = z.object({
  slots: z.array(
    z.object({
      date: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
      }),
      time: z.object({
        hour: z.number(),
        minute: z.number(),
      }),
      duration_mins: z.number(),
    })
  ),
  timezone: z.string(),
})

const availability = {
  upcomingProfileSlots_public: publicProcedure
    .input(
      z.object({
        profile_slug: z.string(),
        plan_id: z.string(),
        start_date: z
          .object({
            year: z.number(),
            month: z.number(),
            day: z.number(),
          })
          .describe('Inclusive'),
        end_date: z
          .object({
            year: z.number(),
            month: z.number(),
            day: z.number(),
          })
          .describe('Exclusive'),
      })
    )
    .output(upcomingSlotsShape)
    .query(async ({ input: { profile_slug, plan_id, start_date, end_date } }) => {
      const [first] = await db
        .select({
          profile: schema.profiles,
          plan: schema.profileOnetimePlans,
        })
        .from(schema.profiles)
        .where(d.eq(schema.profiles.slug, profile_slug))
        .limit(1)
        .innerJoin(
          schema.profileOnetimePlans,
          d.and(
            d.eq(schema.profileOnetimePlans.profile_id, schema.profiles.id),
            d.eq(schema.profileOnetimePlans.id, plan_id)
          )
        )
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `Profile not found for that plan.`,
        })
      }

      const { profile, plan } = first

      const startDate = DateTime.fromObject(start_date, { zone: profile.timezone }).startOf('day')
      const endDate = DateTime.fromObject(end_date, { zone: profile.timezone }).startOf('day')
      if (!startDate.isValid) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Invalid start date.`,
        })
      }
      if (!endDate.isValid) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Invalid end date.`,
        })
      }

      const conflicts = await pg.union(
        db
          .select(
            pick('bookings', {
              start_datetime: true,
              duration_minutes: true,
              timezone: true,
            })
          )
          .from(schema.bookings)
          .where(
            d.and(
              d.eq(schema.bookings.profile_id, profile.id),
              d.gte(schema.bookings.start_datetime, startDate.toJSDate()),
              d.lt(schema.bookings.start_datetime, endDate.toJSDate())
            )
          ),
        db
          .select(
            pick('offers', {
              start_datetime: true,
              duration_minutes: true,
              timezone: true,
            })
          )
          .from(schema.offers)
          .where(
            d.and(
              d.eq(schema.offers.profile_id, profile.id),
              d.gte(schema.offers.start_datetime, startDate.toJSDate()),
              d.lt(schema.offers.start_datetime, endDate.toJSDate()),
              d.eq(schema.offers.voided, false)
            )
          )
      )

      const slots: Zod.infer<typeof upcomingSlotsShape>['slots'] = []
      const weekdayToEnum: Record<
        number,
        Zod.infer<typeof availabilityRangesShape>[0]['day_of_week']
      > = {
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
        7: 'sunday',
      }

      let dateTime = DateTime.fromObject(start_date, { zone: profile.timezone })
      const endDateTime = DateTime.fromObject(end_date, { zone: profile.timezone })
      const now = DateTime.now()
      while (dateTime.startOf('day') < endDateTime.startOf('day')) {
        const queuedAvailRanges = profile.availability_ranges?.slice()

        while (queuedAvailRanges?.length) {
          const range = queuedAvailRanges.shift()!
          if (range.day_of_week !== weekdayToEnum[dateTime.weekday]) {
            continue
          }
          const rangeStart = dateTime.set(range.start_time)
          const rangeEnd = dateTime.set(range.end_time)

          let slotStart = rangeStart
          while (slotStart.plus({ minutes: plan.duration_mins }) <= rangeEnd) {
            const slotEnd = slotStart.plus({ minutes: plan.duration_mins })

            const isPast = slotStart < now
            if (!isPast) {
              const hasConflict = conflicts.some((offer): boolean => {
                const offerStart = DateTime.fromJSDate(offer.start_datetime, {
                  zone: offer.timezone,
                })
                const offerEnd = offerStart.plus({ minutes: offer.duration_minutes })
                return offerStart < slotEnd && offerEnd > slotStart
              })
              if (!hasConflict) {
                slots.push({
                  date: {
                    year: dateTime.year,
                    month: dateTime.month,
                    day: dateTime.day,
                  },
                  duration_mins: plan.duration_mins,
                  time: { hour: slotStart.hour, minute: slotStart.minute },
                })
              }
            }

            slotStart = slotStart.plus({ minute: plan.duration_mins })
          }
        }

        dateTime = dateTime.plus({ day: 1 })
      }

      return {
        slots,
        timezone: profile.timezone,
      }
    }),
}

async function hydrateTokensForGoogleIntegration(current: {
  profile_id: string
  google_user_id: string
  access_token: string
  refresh_token: string
}) {
  const next = await googleOauth.refreshAccessToken({
    refreshToken: current.refresh_token,
    accessToken: current.access_token,
  })
  if (next.access_token !== current.access_token) {
    await db
      .update(schema.googleCalendarIntegrations)
      .set({
        access_token: next.access_token,
        refresh_token: next.refresh_token,
        expires_at_ms: next.expires_at_ms,
      })
      .where(
        d.and(
          d.eq(schema.googleCalendarIntegrations.google_user_id, current.google_user_id),
          d.eq(schema.googleCalendarIntegrations.profile_id, current.profile_id)
        )
      )
      .execute()
  }
  return {
    access_token: next.access_token,
    refresh_token: next.refresh_token,
    expires_at_ms: next.expires_at_ms,
  }
}

const googleOauthRoutes = {
  googleOauthUrl: authedProcedure
    .input(z.object({ redirect_url: z.string() }))
    .output(z.string())
    .query(async ({ ctx, input }) => {
      return googleOauth.getOauthUrl(input.redirect_url)
    }),
  googleOauthExchangeCode: authedProcedure
    .input(z.object({ code: z.string(), redirect_url: z.string(), profile_slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [myMembership] = await db
        .select({
          membership: schema.profileMembers,
          profile: schema.profiles,
        })
        .from(schema.profiles)
        .where(d.eq(schema.profiles.slug, input.profile_slug))
        .innerJoin(
          schema.profileMembers,
          d.eq(schema.profileMembers.profile_id, schema.profiles.id)
        )
        .limit(1)
        .execute()

      if (!myMembership) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: `You are not a member of this profile.`,
        })
      }

      const tokens = await googleOauth.exchangeCodeForTokens(input.code, input.redirect_url)

      console.log('[googleOauthExchangeCode] tokens', tokens)

      if (!tokens.access_token) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to exchange code for access token.`,
        })
      }

      if (!tokens.id_token) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to exchange code for ID token.`,
        })
      }

      if (!tokens.refresh_token) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to exchange code for refresh token.`,
        })
      }

      if (tokens.expires_at_ms == null) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to exchange code with expiration time.`,
        })
      }

      const googleUser = await googleOauth.getUserInfo({ accessToken: tokens.access_token })

      console.log('[googleOauthExchangeCode] googleUser', googleUser)

      if (!googleUser.id) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get Google user info.`,
        })
      }

      if (!googleUser.email) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get Google user email.`,
        })
      }

      const calendars = await googleOauth.getCalendarsList({
        refreshToken: tokens.refresh_token,
      })

      const calendarIdsForAvailBlocking: string[] = []
      for (const calendar of calendars.items ?? []) {
        if (calendar.id && calendar.primary) {
          calendarIdsForAvailBlocking.push(calendar.id)
        }
      }

      const oauthResult = await db
        .insert(schema.googleCalendarIntegrations)
        .values({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at_ms: Number(tokens.expires_at_ms),
          id_token: tokens.id_token,
          profile_id: myMembership.profile.id,
          calendars_for_avail_blocking: calendarIdsForAvailBlocking,
          google_user_id: googleUser.id,
          email: googleUser.email,
          picture_url: googleUser.picture,
        })
        .onConflictDoUpdate({
          target: schema.googleCalendarIntegrations.google_user_id,
          set: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at_ms: Number(tokens.expires_at_ms),
            id_token: tokens.id_token,
            picture_url: googleUser.picture,
          },
        })
        .returning()
        .execute()

      console.log('[googleOauthExchangeCode] oauthResult', oauthResult)

      return true
    }),
  googleIntegrationsByProfileSlug: authedProcedure
    .input(z.object({ profile_slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const calendarIntegrationFields = pick('googleCalendarIntegrations', {
        email: true,
        picture_url: true,
        google_user_id: true,
        refresh_token: true,
        expires_at_ms: true,
        calendars_for_avail_blocking: true,
        access_token: true,
      })

      const integrations = await db
        .select({
          googleCalendarIntegration: calendarIntegrationFields,
          profile: pick('profiles', {
            id: true,
            slug: true,
          }),
        })
        .from(schema.googleCalendarIntegrations)
        .innerJoin(schema.profiles, d.eq(schema.profiles.slug, input.profile_slug))
        // ensure membership
        .where(
          d.exists(
            db
              .select({ profile_id: schema.profileMembers.profile_id })
              .from(schema.profileMembers)
              .where(
                d.and(
                  d.eq(schema.profileMembers.user_id, ctx.auth.userId),
                  d.eq(schema.profileMembers.profile_id, schema.profiles.id)
                )
              )
          )
        )
        .execute()

      const all = await Promise.all(
        integrations.map(async (integration) => {
          const { profile } = integration
          let { googleCalendarIntegration } = integration
          // if (Date.now() >= googleCalendarIntegration.expires_at_ms) {
          //   const refreshedTokens = await googleOauth.refreshAccessToken({
          //     refreshToken: googleCalendarIntegration.refresh_token,
          //     accessToken: googleCalendarIntegration.access_token,
          //   })

          //   const [result] = await db
          //     .update(schema.googleCalendarIntegrations)
          //     .set({
          //       access_token: refreshedTokens.access_token,
          //       refresh_token: refreshedTokens.refresh_token,
          //       expires_at_ms: Number(refreshedTokens.expires_at_ms),
          //       id_token: refreshedTokens.id_token,
          //     })
          //     .where(
          //       d.and(
          //         d.eq(
          //           schema.googleCalendarIntegrations.google_user_id,
          //           googleCalendarIntegration.google_user_id
          //         ),
          //         d.eq(schema.googleCalendarIntegrations.profile_id, profile.id)
          //       )
          //     )
          //     .returning(calendarIntegrationFields)
          //     .execute()

          //   if (!result) {
          //     throw new TRPCError({
          //       code: 'INTERNAL_SERVER_ERROR',
          //       message: `Failed to refresh Google calendar integration.`,
          //     })
          //   }

          //   googleCalendarIntegration = result
          // }
          const { refresh_token } = await hydrateTokensForGoogleIntegration({
            profile_id: profile.id,
            google_user_id: googleCalendarIntegration.google_user_id,
            access_token: googleCalendarIntegration.access_token,
            refresh_token: googleCalendarIntegration.refresh_token,
          })
          const calendars = await googleOauth.getCalendarsList({
            refreshToken: refresh_token,
          })

          return {
            email: googleCalendarIntegration.email,
            picture_url: googleCalendarIntegration.picture_url,
            google_user_id: googleCalendarIntegration.google_user_id,
            calendars_for_avail_blocking: googleCalendarIntegration.calendars_for_avail_blocking,
            calendars: calendars.items,
          }
        })
      )

      return all
    }),
  deleteProfileGoogleIntegration: authedProcedure
    .input(z.object({ google_user_id: z.string(), profile_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [first] = await db
        .delete(schema.googleCalendarIntegrations)
        .where(
          d.and(
            d.eq(schema.googleCalendarIntegrations.google_user_id, input.google_user_id),
            d.eq(schema.googleCalendarIntegrations.profile_id, input.profile_id)
          )
        )
        .returning()
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Google integration not found.`,
        })
      }

      return true
    }),
  googleCalendarEventsByProfileSlug: authedProcedure
    .input(
      z.object({
        profile_slug: z.string(),
        start_date: z.object({
          year: z.number(),
          month: z.number(),
          day: z.number(),
        }),
        end_date: z.object({
          year: z.number(),
          month: z.number(),
          day: z.number(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await db
        .select({
          ...pick('googleCalendarIntegrations', {
            refresh_token: true,
            google_user_id: true,
            email: true,
            profile_id: true,
            access_token: true,
            expires_at_ms: true,
            calendars_for_avail_blocking: true,
          }),
          timezone: schema.profiles.timezone,
        })
        .from(schema.profiles)
        .where(d.eq(schema.profiles.slug, input.profile_slug))
        .innerJoin(
          schema.googleCalendarIntegrations,
          d.eq(schema.googleCalendarIntegrations.profile_id, schema.profiles.id)
        )
        .innerJoin(
          schema.profileMembers,
          d.and(
            d.eq(schema.profileMembers.user_id, ctx.auth.userId),
            d.eq(schema.profileMembers.profile_id, schema.profiles.id)
          )
        )
        .execute()
      console.log('[googleCalendarEventsByProfileSlug] results', results)
      return await Promise.all(
        results.map(async (result) => {
          const { refresh_token, timezone, google_user_id, access_token } = result
          const minDateTime = DateTime.fromObject(
            {
              year: input.start_date.year,
              month: input.start_date.month,
              day: input.start_date.day,
            },
            {
              zone: timezone,
            }
          ).startOf('day')
          const maxDateTime = DateTime.fromObject(
            {
              year: input.end_date.year,
              month: input.end_date.month,
              day: input.end_date.day,
            },
            {
              zone: timezone,
            }
          ).endOf('day')
          if (!minDateTime.isValid) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Invalid start date.`,
            })
          }
          if (!maxDateTime.isValid) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Invalid end date.`,
            })
          }
          const hydratedTokens = await hydrateTokensForGoogleIntegration({
            profile_id: result.profile_id,
            google_user_id: result.google_user_id,
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          })
          const events = (
            await Promise.all(
              result.calendars_for_avail_blocking.map(
                async (calendarId) =>
                  await googleOauth.getCalendarEvents({
                    refreshToken: hydratedTokens.refresh_token,
                    minDateTime,
                    maxDateTime,
                    calendarId,
                  })
              )
            )
          ).flat()
          return {
            events,
          }
        })
      )
    }),
}

export const appRouter = router({
  hello: publicProcedure.query(({ ctx }) => {
    return 'hello there sir'
  }),

  uploadImage: authedProcedure
    .input(z.object({ image: z.string(), vendor: imageVendor }))
    .mutation(async ({ ctx, input }) => {
      const { id, vendor } = await cdn[input.vendor].uploadImage(input.image, {
        folder: 'trpc-uploads',
      })
      return { id, vendor }
    }),

  ...user,
  ...profile,
  ...profileMember,
  ...calCom,
  ...repository,
  ...profilePlan,
  ...availability,
  ...googleOauthRoutes,
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
      inserts.offers
        .pick({
          profile_id: true,
          timezone: true,
        })
        .merge(
          z.object({
            stripe_confirmation_token_id: z.string(),
            organization_id: z.string().nullable(),
            plan_id: z.string(),
            start_datetime: z.object({
              year: z.number(),
              month: z.number(),
              day: z.number(),
              hour: z.number(),
              minute: z.number(),
            }),
          })
        )
    )
    .mutation(async ({ ctx, input }) => {
      const { offer, plan, profile } = await db.transaction(async (tx) => {
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
            plan: schema.profileOnetimePlans,
          })
          .from(schema.profiles)
          .innerJoin(schema.profileOnetimePlans, d.eq(schema.profileOnetimePlans.id, input.plan_id))
          .where(d.eq(schema.profiles.id, profile_id))
          .limit(1)
          .execute()

        if (!first) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Profile not found.`,
          })
        }

        const { profile, plan } = first

        const start_datetime = DateTime.fromObject(input.start_datetime, {
          zone: input.timezone,
        })

        if (!start_datetime.isValid) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Invalid start datetime.`,
          })
        }

        const jsDate = start_datetime.toJSDate()

        console.log('[createOfferAndPaymentIntent][start_datetime]', jsDate)

        const [offer] = await tx
          .insert(schema.offers)
          .values({
            profile_id: profile.id,
            created_by_user_id: ctx.auth.userId,
            organization_id: input.organization_id,
            start_datetime: jsDate,
            duration_minutes: plan.duration_mins,
            timezone: input.timezone,
          })
          .returning()
          .execute()
        return { offer, plan, profile }
      })

      if (!offer?.id) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Offer couldn't get created.`,
        })
      }

      console.log('[createOfferAndPaymentIntent][offer]', offer)

      const amount = plan.price
      const currency = plan.currency
      const application_fee_amount = plan.price * 0.1 // TODO calculate

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency,
          confirm: true,
          confirmation_token: input.stripe_confirmation_token_id,
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

      await db
        .update(schema.offers)
        .set({
          stripe_payment_intent_id: paymentIntent.id,
        })
        .where(d.eq(schema.offers.id, offer.id))
        .execute()

      console.log('[createOfferAndPaymentIntent][paymentIntent]', paymentIntent.id)

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
      const results = await db
        .select({
          ...pick('offers', {
            id: true,
            profile_id: true,
            created_at: true,
            last_updated_at: true,
            voided: true,
            stripe_payment_intent_id: true,
            organization_id: true,
            duration_minutes: true,
            timezone: true,
            start_datetime: true,
          }),
          profile: pick('profiles', publicSchema.profiles.ProfilePublic),
          organization: pick('organizations', { id: true, name: true }),
          profileMember: pick('profileMembers', {
            id: true,
            profile_id: true,
            email: true,
          }),
        })
        .from(schema.offers)
        .where(d.eq(schema.offers.stripe_payment_intent_id, payment_intent_id))
        .innerJoin(schema.profiles, d.eq(schema.profiles.id, schema.offers.profile_id))
        .innerJoin(
          schema.organizations,
          d.eq(schema.organizations.id, schema.offers.organization_id)
        )
        .leftJoin(schema.profileMembers, d.eq(schema.profileMembers.profile_id, schema.profiles.id))
        .execute()

      const [first] = results

      if (!first) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Offer not found. Are you sure this is a valid URL?`,
        })
      }

      const { profileMember: profileMembers, ...offer } = first

      const { stripe_payment_intent_id } = offer

      if (!stripe_payment_intent_id) {
        return null
      }

      const { amount, status, currency, next_action } = await stripe.paymentIntents.retrieve(
        stripe_payment_intent_id
      )

      return {
        paymentIntent: {
          amount,
          status,
          currency,
          next_action,
        },
        offer,
        profileMemberEmails: results.map((result) => result.profileMember?.email).filter(Boolean),
      }
    }),

  joinWaitlist: publicProcedure
    .input(
      z.object({ email: z.string().email('Please enter a valid email.'), captcha: z.string() })
    )
    .mutation(async ({ input }) => {
      const data = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${serverEnv.RECAPTCHA_SECRET_KEY}&response=${input.captcha}`
      ).then((r) => r.json())

      if (!data.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid captcha.`,
        })
      }

      const [first] = await db
        .insert(schema.waitlistSignups)
        .values({ email: input.email })
        .onConflictDoUpdate({
          target: schema.waitlistSignups.email,
          set: {
            last_updated_at: new Date(),
          },
        })
        .returning()
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Failed to join waitlist.`,
        })
      }

      return { email: first.email }
    }),
  repo: router({
    files: publicProcedure
      .input(z.object({ profileSlug: z.string(), repoSlug: z.string() }))
      .output(z.record(z.string(), z.string()))
      .query(async ({ input }) => {
        return {
          'config.py':
            'import keras\nfrom keras.utils import FeatureSpace as fs\n\nconfig = keras.utils.Config()\n\n# Path to parquet file of scores/rating data\nconfig.score_data_parquet_fpath = "data/affinity_11092024_export.parquet"\nconfig.prod_model_path = "models/prod_model.keras"\nconfig.checkpoint_dir = "models/tmp"\n\n# Minimum number of scores/ratings per user to keep the user in the data\nconfig.min_scores_per_user = 2\n\n# Minimum number of scores/ratings per items to keep the item in the data\nconfig.min_scores_per_item = 50\n\n# Fraction of data to use for training (remainder is for eval)\nconfig.train_fraction = 0.8\n# Fraction of scores per user to use as targets\nconfig.target_score_fraction = 0.3\n\n# Training config\nconfig.batch_size = 64\nconfig.learning_rate = 1e-3\nconfig.max_epochs = 100\nconfig.early_stopping_patience = 4\n\n# Whether to use sparse or dense matrices for handling score data\nconfig.use_sparse_score_matrices = True\nconfig.score_scaling_factor = 5.05\n\nconfig.user_features_config = {\n    "gender": fs.string_categorical(\n        name="gender", num_oov_indices=0, output_mode="one_hot"\n    ),\n    "age": fs.float_normalized(name="age"),\n}\n\n# EDA config\nconfig.eda_figures_dpi = 200\nconfig.eda_figures_dir_before_filtering = "figures/before_filtering"\nconfig.eda_figures_dir_after_filtering = "figures/after_filtering"\n',
          'requirements.txt': 'keras>=3.6.0\npandas\nmatplotlib\nscipy\nnumpy\npyarrow\n',
          'baseline.py':
            'import numpy as np\nfrom config import config\n\n\ndef compute_baseline_metrics(inputs_matrix, targets_matrix):\n    inputs_matrix = inputs_matrix.toarray()\n    targets_matrix = targets_matrix.toarray()\n    mean_scores_per_item = np.mean(inputs_matrix, axis=0, where=inputs_matrix != 0).flatten()\n    total_loss = np.subtract(targets_matrix, mean_scores_per_item)\n    total_mse = total_loss ** 2\n    total_mse = np.mean(total_loss ** 2, where=targets_matrix != 0)\n    total_mae = np.mean(np.abs(total_loss), where=targets_matrix != 0)\n    if config.score_scaling_factor is not None:\n        total_mae *= config.score_scaling_factor\n    return total_mse, total_mae\n',
          'serve.py': '',
          'readme.md': '# Recommendation System\n',
          'eda.py':
            'import matplotlib.pyplot as plt\nimport numpy as np\nimport os\n\nimport data\nfrom config import config\n\n\ndef get_score_range_and_counts(score_data):\n    """Prints the range of score values, count of items, and count of users.\n\n    Args:\n        score_data: Dict `{user_id: [(item_id, score), ...], ...}`\n    """\n    all_scores = [score for scores in score_data.values() for _, score in scores]\n    min_score, max_score = min(all_scores), max(all_scores)\n    num_items = len(\n        set(item_id for scores in score_data.values() for item_id, _ in scores)\n    )\n    num_users = len(score_data)\n    print(f"Score Range: [{min_score}, {max_score}]")\n    print(f"Number of Items: {num_items}")\n    print(f"Number of Users: {num_users}")\n\n\ndef display_score_histogram(score_data, suffix, save_fpath=None):\n    """Displays a histogram of score values.\n\n    Args:\n        score_data: Dict `{user_id: [(item_id, score), ...], ...}`\n    """\n    all_scores = [score for scores in score_data.values() for _, score in scores]\n    plt.hist(all_scores, bins="auto")\n    plt.title("Histogram of Score Values" + suffix)\n    plt.xlabel("Score")\n    plt.ylabel("Frequency")\n    display_fig(save_fpath)\n\n\ndef display_score_count_per_item_histogram(score_data, suffix, save_fpath=None):\n    """Displays a histogram of score counts per item.\n\n    Args:\n        score_data: Dict `{user_id: [(item_id, score), ...], ...}`\n    """\n    item_counts = {}\n    for scores in score_data.values():\n        for item_id, _ in scores:\n            item_counts[item_id] = item_counts.get(item_id, 0) + 1\n    plt.hist(item_counts.values(), bins="auto")\n    plt.title("Histogram of Score Counts per Item" + suffix)\n    plt.xlabel("Score Count")\n    plt.ylabel("Number of Items")\n    display_fig(save_fpath)\n\n\ndef display_score_count_per_user_histogram(score_data, suffix, save_fpath=None):\n    """Displays a histogram of score counts per user.\n\n    Args:\n        score_data: Dict `{user_id: [(item_id, score), ...], ...}`\n    """\n    user_counts = [len(scores) for scores in score_data.values()]\n    plt.hist(user_counts, bins="auto")\n    plt.title("Histogram of Score Counts per User" + suffix)\n    plt.xlabel("Score Count")\n    plt.ylabel("Number of Users")\n    display_fig(save_fpath)\n\n\ndef display_average_score_per_item_histogram(score_data, suffix, save_fpath=None):\n    """Displays a histogram of average score per item.\n\n    Args:\n        score_data: Dict `{user_id: [(item_id, score), ...], ...}`\n    """\n    item_scores = {}\n    for scores in score_data.values():\n        for item_id, score in scores:\n            item_scores.setdefault(item_id, []).append(score)\n    avg_scores = {item_id: np.mean(scores) for item_id, scores in item_scores.items()}\n    plt.hist(avg_scores.values(), bins="auto")\n    plt.title("Histogram of Average Score per Item" + suffix)\n    plt.xlabel("Average Score")\n    plt.ylabel("Number of Items")\n    display_fig(save_fpath)\n\n\ndef display_average_score_per_user_histogram(score_data, suffix, save_fpath=None):\n    """Displays a histogram of average score per user.\n\n    Args:\n        score_data: Dict `{user_id: [(item_id, score), ...], ...}`\n    """\n    avg_scores = [\n        np.mean([score for _, score in scores]) for scores in score_data.values()\n    ]\n    plt.hist(avg_scores, bins="auto")\n    plt.title("Histogram of Average Score per User" + suffix)\n    plt.xlabel("Average Score")\n    plt.ylabel("Number of Users")\n    display_fig(save_fpath)\n\n\ndef display_fig(save_fpath):\n    if save_fpath:\n        parent = os.path.dirname(save_fpath)\n        os.makedirs(parent, exist_ok=True)\n        plt.savefig(save_fpath, dpi=config.eda_figures_dpi)\n    else:\n        plt.show()\n\n\ndef display_all(score_data, user_data, suffix, fpath_base):\n    get_score_range_and_counts(score_data)\n    display_score_histogram(score_data, suffix, save_fpath=f"{fpath_base}/scores.png")\n    display_score_count_per_item_histogram(\n        score_data, suffix, save_fpath=f"{fpath_base}/score_counts_per_item.png"\n    )\n    display_average_score_per_item_histogram(\n        score_data, suffix, save_fpath=f"{fpath_base}/average_score_per_item.png"\n    )\n    display_average_score_per_user_histogram(\n        score_data, suffix, save_fpath=f"{fpath_base}/average_score_per_user.png"\n    )\n\n\nif __name__ == "__main__":\n    # Load raw data\n    score_data = data.get_score_data()\n    user_data = data.get_user_data()\n\n    print("Before data filtering:")\n    suffix = " - before filtering"\n    fpath_base = f"{config.eda_figures_dir_before_filtering}"\n    display_all(score_data, user_data, suffix, fpath_base)\n\n    # TODO: EDA for user data\n\n    print("After data filtering:")\n    suffix = " - after filtering"\n    fpath_base = f"{config.eda_figures_dir_after_filering}"\n    display_all(score_data, user_data, suffix, fpath_base)\n',
          'train.py':
            'import os\nimport keras\nfrom keras import ops\n\nfrom config import config\n\n\n@keras.saving.register_keras_serializable(package="recsys")\ndef masked_binary_crossentropy(y_true, y_pred, mask_value=0):\n    """Computes the mean crossentropy over known scores only.\n\n    Args:\n        y_true: The true score tensor.\n        y_pred: The predicted score tensor.\n\n    Returns:\n        Scalar tensor, the computed masked error.\n    """\n    mask = ops.cast(ops.not_equal(y_true, mask_value), dtype=y_pred.dtype)\n    raw_error = ops.binary_crossentropy(y_true, y_pred) * mask\n    masked_error = ops.sum(raw_error, axis=-1) / (ops.sum(mask, axis=-1) + keras.config.epsilon())\n    return masked_error\n\n\n@keras.saving.register_keras_serializable(package="recsys")\ndef masked_mse(y_true, y_pred, mask_value=0):\n    """Computes the mean MSE over known scores only.\n\n    Args:\n        y_true: The true score tensor.\n        y_pred: The predicted score tensor.\n\n    Returns:\n        Scalar tensor, the computed masked error.\n    """\n    mask = ops.cast(ops.not_equal(y_true, mask_value), dtype=y_pred.dtype)\n    squared_diff = ops.square(y_true - y_pred) * mask\n    return ops.sum(squared_diff, axis=-1) / (ops.sum(mask, axis=-1) + keras.config.epsilon())\n\n\n@keras.saving.register_keras_serializable(package="recsys")\ndef masked_mae(y_true, y_pred, mask_value=0):\n    """Computes the mean absolute error over known scores only, and unscale it.\n    \n    Args:\n        y_true: The true score tensor.\n        y_pred: The predicted score tensor.\n\n    Returns:\n        Scalar tensor, the computed masked error.\n    """\n    mask = ops.cast(ops.not_equal(y_true, mask_value), dtype=y_pred.dtype)\n    raw_error = ops.abs(y_true - y_pred) * mask\n    masked_error = ops.sum(raw_error, axis=-1) / (ops.sum(mask, axis=-1) + keras.config.epsilon())\n    if config.score_scaling_factor is not None:\n        return masked_error * config.score_scaling_factor\n    return masked_error\n\n\ndef train_model(model, train_ds, val_ds=None, num_epochs=None):\n    """Train and evaluate a model.\n    \n    Args:\n        model: Keras model instance.\n        train_ds: Training dataset.\n        val_ds: Validation dataset.\n        num_epoch: Optional number of epochs to train for.\n            If unspecified, we use Early Stopping.\n            The best stopping epoch gets returned as the\n            "best_epoch" entry in the return dict.\n\n    Returns:\n        Dict with keys best_val_error and best_epoch.\n    """\n    if val_ds is None:\n        monitor = "loss"\n    else:\n        monitor = "val_loss"\n    os.makedirs(config.checkpoint_dir, exist_ok=True)\n    checkpoint_path = f"{config.checkpoint_dir}/best_model.keras"\n    callbacks = [\n        keras.callbacks.ModelCheckpoint(\n            filepath=checkpoint_path,\n            save_best_only=True,\n            monitor=monitor,\n        )\n    ]\n    metrics = [\n        masked_mae,\n    ]\n    optimizer = keras.optimizers.Adam(learning_rate=config.learning_rate)\n    loss = masked_binary_crossentropy\n    if num_epochs is None:\n        callbacks.append(\n            keras.callbacks.EarlyStopping(patience=config.early_stopping_patience, monitor=monitor, verbose=1, restore_best_weights=True)\n        )\n        num_epochs = config.max_epochs\n\n    # Train the model\n    model.compile(loss=loss, optimizer=optimizer, metrics=metrics)\n    model.fit(train_ds, epochs=num_epochs, callbacks=callbacks, validation_data=val_ds)\n\n    if val_ds:\n        # Evaluate best model\n        results = model.evaluate(val_ds, return_dict=True)\n    else:\n        results = model.evaluate(train_ds, return_dict=True)\n\n    if isinstance(callbacks[-1], keras.callbacks.EarlyStopping):\n        num_epochs = callbacks[-1].stopped_epoch\n\n    return {\n        "best_val_error": results["masked_mae"],\n        "best_epoch": num_epochs,\n    }\n\n\ndef get_model(hp_config, train_ds, val_ds=None):\n    """Creates, trains and evaluates a model based on a hp config."""\n    for x, y in train_ds.take(1):\n        num_features = x.shape[-1]\n        num_targets = y.shape[-1]\n\n    inputs = keras.Input(shape=(num_features,), name="inputs")\n\n    x = keras.layers.Dense(hp_config.layer_size, activation="relu")(inputs)\n    for _ in range(hp_config.num_blocks):\n        residual = x\n        x = keras.layers.Dense(hp_config.layer_size, activation="relu")(x)\n        x = keras.layers.Dense(hp_config.layer_size, activation="relu")(x)\n        x = keras.layers.Dropout(hp_config.dropout_rate)(x)\n        x = x + residual\n\n    outputs = keras.layers.Dense(num_targets, activation="sigmoid", name="outputs")(x)\n    model = keras.Model(inputs, outputs, name="score_prediction_model")\n    model.summary()\n\n    results = train_model(\n        model, train_ds, val_ds=val_ds, num_epochs=hp_config.get("best_epoch", None)\n    )\n    return model, results\n\n\ndef get_best_hp_config(train_ds, val_ds):\n    """Implements elementary hyperparameter search.\n\n    For anything more sophisticated, you should use KerasTuner.\n    """\n    all_results = []\n    for num_blocks in (1, 2):\n        for layer_size in (512, 1024, 2048):\n            hp_config = keras.utils.Config(\n                num_blocks=num_blocks,\n                layer_size=layer_size,\n                dropout_rate=0.3,\n            )\n            print("Trying config: ", hp_config)\n            _, results = get_model(hp_config, train_ds, val_ds=val_ds)\n            results["hp_config"] = hp_config\n            all_results.append(results)\n    all_results.sort(key=lambda x: x["best_val_error"])\n    best_hp_config = all_results[0]["hp_config"]\n    best_hp_config["best_epoch"] = all_results[0]["best_epoch"]\n    return best_hp_config\n',
          'main.py':
            'import data\nfrom config import config\nimport train\nimport baseline\n\n\nif __name__ == "__main__":\n    # Load raw data\n    print("Loading data...")\n    score_data = data.get_score_data()\n    user_data = data.get_user_data()\n\n    # Filter users and items with insufficient data\n    print("Filtering data...")\n    score_data, user_data, user_to_id, item_to_id = data.filter_and_index_data(\n        score_data, user_data\n    )\n\n    # Use a validation split to find the best hps\n    print("Making datasets...")\n    train_ds, val_ds = data.get_train_and_val_datasets(\n        score_data, user_data, user_to_id, item_to_id\n    )\n\n    print("Running hyperparameter search...")\n    hp_config = train.get_best_hp_config(train_ds, val_ds)\n    print("Best hp config:", hp_config)\n\n    # Train a model on the full dataset with the best hps\n    print("Training production model...")\n    full_ds = data.get_full_dataset(score_data, user_data, user_to_id, item_to_id)\n    model, _ = train.get_model(hp_config, full_ds)\n\n    # Save the model\n    model.save(config.prod_model_path)\n',
          'data.py':
            'import random\nimport keras\n\n# TF is only used for tf.data - the code works with all backends\nimport tensorflow as tf\n\nimport numpy as np\nimport pandas as pd\nfrom scipy.sparse import lil_matrix\n\nfrom config import config\n\n\ndef get_score_data():\n    """Return dict structured as {user_id: [(item_id, score), ...], ...}"""\n    df = pd.read_parquet(config.score_data_parquet_fpath)\n    score_data = {}\n    for row in df.itertuples():\n        if row.ref_player not in score_data:\n            score_data[row.ref_player] = []\n        score_data[row.ref_player].append((row.ref_game, row.rating))\n    return score_data\n\n\ndef get_user_data():\n    """Return dict structured as {user_id: {feature_name: value, ...}, ...]}"""\n    score_data = get_score_data()\n    user_data = {}\n    age_choices = list(range(21, 90))\n    gender_choices = ["male", "female", "unknown"]\n    for key in score_data.keys():\n        user_data[key] = {\n            "age": random.choice(age_choices),\n            "gender": random.choice(gender_choices),\n        }\n    return user_data\n\n\ndef filter_score_data(score_data, min_scores_per_user, min_scores_per_item):\n    """Filter out items that have too few scores.\n\n    Also proceededs to filter out users that subsequently have too few\n    items scored.\n\n    Args:\n        score_data: Dict `{user_id: [(item_id, score), ...], ...}`\n        min_scores_per_user: Threshold below which to drop a user.\n        min_scores_per_item: Threshold below which to drop an item.\n\n    Returns:\n        New `score_data` dict.\n    """\n    score_data = {u: s for u, s in score_data.items() if len(s) >= min_scores_per_user}\n\n    score_count_per_item = {}\n    for user, scores in score_data.items():\n        for item, _ in scores:\n            if item not in score_count_per_item:\n                score_count_per_item[item] = 1\n            else:\n                score_count_per_item[item] += 1\n    items_to_exclude = set(\n        i for i, c in score_count_per_item.items() if c < min_scores_per_item\n    )\n\n    new_score_data = {}\n    for user, scores in score_data.items():\n        new_scores = []\n        for item, score in scores:\n            if item not in items_to_exclude:\n                new_scores.append((item, score))\n        if len(new_scores) >= min_scores_per_user:\n            new_score_data[user] = new_scores\n    return new_score_data\n\n\ndef split_score_data_into_inputs_and_targets(score_data):\n    """Split the score_data dict into input scores and target scores.\n\n    Each user is associated with a number of scores.\n    We split those scores into two subgroups: input scores\n    and target scores. The idea is to show the model\n    the input scores, predict scores for all items,\n    and only train/eval based on the target scores.\n    """\n    input_score_data = {}\n    target_score_data = {}\n    for user, scores in score_data.items():\n        num_to_drop = max(1, round(len(scores) * config.target_score_fraction))\n        random.shuffle(scores)\n        inputs_scores = scores[:-num_to_drop]\n        targets_scores = scores[-num_to_drop:]\n        input_score_data[user] = inputs_scores\n        target_score_data[user] = targets_scores\n    return input_score_data, target_score_data\n\n\ndef index_users_and_items(score_data):\n    """Associates users and items with a unique integer ID."""\n    user_to_id = {}\n    item_to_id = {}\n    user_index = 0\n    item_index = 0\n    for user, scores in score_data.items():\n        if user not in user_to_id:\n            user_to_id[user] = user_index\n            user_index += 1\n        for item, _ in scores:\n            if item not in item_to_id:\n                item_to_id[item] = item_index\n                item_index += 1\n    return user_to_id, item_to_id\n\n\ndef vectorize_score_data(\n    score_data, user_to_id, item_to_id, sparse=True, dtype="float32"\n):\n    """Split score data into inputs and targets and turn them into sparse (or dense) matrices."""\n    input_score_data, target_score_data = split_score_data_into_inputs_and_targets(\n        score_data\n    )\n    input_matrix = make_score_matrix(\n        input_score_data, user_to_id, item_to_id, sparse=sparse, dtype=dtype\n    )\n    target_matrix = make_score_matrix(\n        target_score_data, user_to_id, item_to_id, sparse=sparse, dtype=dtype\n    )\n    return input_matrix, target_matrix\n\n\ndef make_score_matrix(score_data, user_to_id, item_to_id, sparse=True, dtype="float32"):\n    """Turns score data into a sparse (or dense) matrix."""\n    shape = (len(score_data), len(item_to_id))\n\n    if sparse:\n        matrix = lil_matrix(shape, dtype=dtype)\n    else:\n        matrix = np.zeros(shape, dtype=dtype)\n    for user, scores in score_data.items():\n        user_id = user_to_id[user]\n        for item, score in scores:\n            item_id = item_to_id.get(item, None)\n            if item_id is not None:\n                matrix[user_id, item_id] = score\n    return matrix\n\n\ndef sparse_matrix_to_dataset(sparse_matrix):\n    """Turn a sparse matrix into a tf.data.Dataset."""\n    coo_matrix = sparse_matrix.tocoo()\n    indices = np.vstack((coo_matrix.row, coo_matrix.col)).transpose()\n    sparse_tensor = tf.SparseTensor(\n        indices=indices, values=coo_matrix.data, dense_shape=sparse_matrix.shape\n    )\n    ds = tf.data.Dataset.from_tensor_slices((sparse_tensor,))\n    return ds.map(lambda x: tf.sparse.to_dense(x))\n\n\ndef scale_score_matrix(score_matrix):\n    if config.score_scaling_factor is not None:\n        return score_matrix / config.score_scaling_factor\n    return score_matrix\n\n\ndef make_dataset(\n    input_scores, target_scores, user_features, user_features_preprocessor, batch_size\n):\n    """Turn score and user data a into tf.data.Dataset."""\n    if isinstance(input_scores, lil_matrix):\n        input_scores_ds = sparse_matrix_to_dataset(input_scores)\n    else:\n        input_scores_ds = tf.data.Dataset.from_tensor_slices((input_scores,))\n    if isinstance(target_scores, lil_matrix):\n        target_scores_ds = sparse_matrix_to_dataset(target_scores)\n    else:\n        target_scores_ds = tf.data.Dataset.from_tensor_slices((target_scores,))\n\n    features_ds = tf.data.Dataset.from_tensor_slices((user_features,))\n    features_ds = features_ds.map(user_features_preprocessor, num_parallel_calls=8)\n    # dataset = tf.data.Dataset.zip(input_scores_ds, target_scores_ds, features_ds)\n    dataset = tf.data.Dataset.zip(input_scores_ds, target_scores_ds)\n    # dataset = dataset.map(\n    #     lambda x, y, z: (tf.concat((x, z), axis=-1), y), num_parallel_calls=8\n    # )\n    return dataset.batch(batch_size).prefetch(8)\n\n\ndef prepare_user_features(user_data, user_to_id):\n    """Turns user data into the format\n    {feature_name: [value_for_user_0, value_for_user_1, ...], ...}"""\n    one_user = next(iter(user_data))\n    ids = range(len(user_to_id))\n    id_to_user = {v: k for k, v in user_to_id.items()}\n    user_features = {\n        k: [user_data[id_to_user[i]][k] for i in ids]\n        for k in user_data[one_user].keys()\n    }\n    return user_features\n\n\ndef make_user_features_preprocessor(user_features, feature_config):\n    """Creates an adapt a Keras FeatureSpace to vectorize user features."""\n    preprocessor = keras.utils.FeatureSpace(\n        feature_config,\n    )\n    preprocessor.adapt(tf.data.Dataset.from_tensor_slices(user_features))\n    return preprocessor\n\n\ndef filter_and_index_data(score_data, user_data):\n    """Filters out users and items with insufficient score data,\n    and computes integer IDs for users and items."""\n    # Filter data\n    print("before filtering", len(score_data))\n    score_data = filter_score_data(\n        score_data,\n        min_scores_per_user=config.min_scores_per_user,\n        min_scores_per_item=config.min_scores_per_item,\n    )\n    user_data = {k: user_data[k] for k in score_data.keys()}\n    print("after filtering", len(score_data))\n\n    # Index data\n    user_to_id, item_to_id = index_users_and_items(score_data)\n    return score_data, user_data, user_to_id, item_to_id\n\n\ndef get_train_and_val_datasets(score_data, user_data, user_to_id, item_to_id):\n    # Vectorize\n    input_scores, target_scores = vectorize_score_data(\n        score_data,\n        user_to_id,\n        item_to_id,\n        sparse=config.use_sparse_score_matrices,\n        dtype="float32",\n    )\n    input_scores = scale_score_matrix(input_scores)\n    target_scores = scale_score_matrix(target_scores)\n\n    # Split users between train and test\n    users = sorted(score_data.keys())\n    num_train_samples = round(config.train_fraction * len(users))\n\n    train_input_scores = input_scores[:num_train_samples]\n    train_target_scores = target_scores[:num_train_samples]\n\n    val_input_scores = input_scores[num_train_samples:]\n    val_target_scores = target_scores[num_train_samples:]\n\n    from baseline import compute_baseline_metrics\n    print(compute_baseline_metrics(train_input_scores, val_target_scores))\n\n    user_features = prepare_user_features(user_data, user_to_id)\n    train_user_features = {k: v[num_train_samples:] for k, v in user_features.items()}\n    val_user_features = {k: v[:num_train_samples] for k, v in user_features.items()}\n\n    # Preprocess user features\n    user_features_preprocessor = make_user_features_preprocessor(\n        train_user_features, feature_config=config.user_features_config\n    )\n\n    # Make streaming datasets\n    train_ds = make_dataset(\n        train_input_scores,\n        train_target_scores,\n        train_user_features,\n        user_features_preprocessor,\n        batch_size=config.batch_size,\n    )\n    val_ds = make_dataset(\n        val_input_scores,\n        val_target_scores,\n        val_user_features,\n        user_features_preprocessor,\n        batch_size=config.batch_size,\n    )\n    return train_ds, val_ds\n\n\ndef get_full_dataset(score_data, user_data, user_to_id, item_to_id):\n    input_scores, target_scores = vectorize_score_data(\n        score_data,\n        user_to_id,\n        item_to_id,\n        sparse=config.use_sparse_score_matrices,\n        dtype="float32",\n    )\n    input_scores = scale_score_matrix(input_scores)\n    target_scores = scale_score_matrix(target_scores)\n\n    user_features = prepare_user_features(user_data, user_to_id)\n    user_features_preprocessor = make_user_features_preprocessor(\n        user_features, feature_config=config.user_features_config\n    )\n    return make_dataset(\n        input_scores,\n        target_scores,\n        user_features,\n        user_features_preprocessor,\n        batch_size=config.batch_size,\n    )\n',
        }
      }),
  }),
})

export type AppRouter = typeof appRouter
