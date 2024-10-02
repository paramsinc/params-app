import { select } from 'app/helpers/select'
import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'
import { inserts, selects } from 'app/db/inserts-and-selects'
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
import { cdn } from 'app/multi-media/cdn'
import { keys } from 'app/helpers/object'
import { availabilityRangesShape } from 'app/db/types'
import { DateTime } from 'app/dates/date-time'

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
          })
          .merge(
            z.object({
              image_vendor: imageVendor,
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
  updateProfileAvailability: authedProcedure
    .input(z.object({ availability_ranges: availabilityRangesShape, profile_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log('updateProfileAvailability', input.profile_id)
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

      const [first] = await db
        .update(schema.profiles)
        .set({ availability_ranges: input.availability_ranges })
        .where(d.eq(schema.profiles.id, input.profile_id))
        .returning({
          ...pick('profiles', publicSchema.profiles.ProfilePublic),
          availability_ranges: schema.profiles.availability_ranges,
        })
        .execute()

      if (!first) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update availability.`,
        })
      }

      return first
    }),
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

      const startDate = DateTime.fromObject(start_date, { zone: profile.timezone })
      const endDate = DateTime.fromObject(end_date, { zone: profile.timezone })
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
      const bookings = await db.query.bookings.findMany({
        where: (bookings, { eq, and, gte, lt }) =>
          and(
            eq(bookings.profile_id, profile_slug),
            gte(bookings.start_datetime, startDate.toJSDate()),
            lt(bookings.start_datetime, endDate.toJSDate())
          ),
      })
      const offers = await db.query.offers.findMany({
        where: (offers, { eq, and, gte, lt }) =>
          and(
            eq(offers.profile_id, profile_slug),
            gte(offers.start_datetime, startDate.toJSDate()),
            lt(offers.start_datetime, endDate.toJSDate()),
            eq(offers.voided, false)
          ),
      })

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

            const hasConflictingOffer = offers.some((offer): boolean => {
              const offerStart = DateTime.fromJSDate(offer.start_datetime, {
                zone: offer.timezone,
              })
              const offerEnd = offerStart.plus({ minutes: offer.duration_minutes })
              return offerStart < slotEnd && offerEnd > slotStart
            })

            const hasConflictingBooking = bookings.some((booking): boolean => {
              // this may feel slow because it's doing so many loops. however, it's probably fine?
              const bookingStart = DateTime.fromJSDate(booking.start_datetime, {
                zone: booking.timezone,
              })
              const bookingEnd = bookingStart.plus({ minutes: booking.duration_minutes })

              return bookingStart < slotEnd && bookingEnd > slotStart
            })
            if (!hasConflictingBooking && !hasConflictingOffer) {
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
            calcomUser: schema.calcomUsers,
            plan: schema.profileOnetimePlans,
          })
          .from(schema.profiles)
          .innerJoin(
            schema.calcomUsers,
            d.eq(schema.calcomUsers.id, schema.profiles.calcom_user_id)
          )
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
        if (!offer?.id) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Offer couldn't get created.`,
          })
        }

        console.log('[createOfferAndPaymentIntent][offer]', offer)

        console.log('[createOfferAndPaymentIntent][offer]', offer)

        return { offer, plan, profile }
      })

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
})

export type AppRouter = typeof appRouter
