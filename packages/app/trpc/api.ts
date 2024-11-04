import { authedProcedure, publicProcedure, router } from './trpc'
import { z } from 'zod'
import { inserts, selects } from 'app/db/inserts-and-selects'
import { d, db, pg, schema } from 'app/db/db'
import { TRPCError } from '@trpc/server'
import { stripe } from 'app/features/stripe-connect/server/stripe'
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
import { exampleRepoFiles } from 'app/trpc/routes/repo-files'
import { paramsJsonShape } from 'app/features/spec/params-json-shape'
import * as googleCalendar from 'app/vendor/google/google-calendar'

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
      inserts.users.pick({ slug: true, first_name: true, last_name: true, email: true }).partial()
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
        .merge(z.object({ disableCreateMember: z.boolean().optional() }))
    )
    .mutation(async ({ input: { disableCreateMember, ...input }, ctx }) => {
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

export async function repoBySlug({
  repo_slug,
  profile_slug,
}: {
  repo_slug: string
  profile_slug: string
}) {
  const [repository] = await db
    .select({
      ...pick('repositories', publicSchema.repositories.RepositoryPublic),
      profile: pick('profiles', publicSchema.profiles.ProfilePublic),
    })
    .from(schema.repositories)
    .where(d.eq(schema.repositories.slug, repo_slug))
    .innerJoin(
      schema.profiles,
      d.and(
        d.eq(schema.repositories.profile_id, schema.profiles.id),
        d.eq(schema.profiles.slug, profile_slug)
      )
    )
    .limit(1)
    .execute()

  if (!repository) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Repository not found.`,
    })
  }

  return repository
}

const repository = {
  repoBySlug: publicProcedure
    .input(z.object({ repo_slug: z.string(), profile_slug: z.string() }))
    .query(async ({ input: { repo_slug, profile_slug } }) => {
      return repoBySlug({ repo_slug, profile_slug })
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
    .input(
      z.object({
        redirect_url: z.string(),
        state: z.object({ redirect: z.string() }),
      })
    )
    .output(z.string())
    .query(async ({ ctx, input }) => {
      return googleOauth.getOauthUrl(input.redirect_url, JSON.stringify(input.state))
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
        return exampleRepoFiles
      }),
    paramsJson: publicProcedure
      .input(z.object({ profileSlug: z.string(), repoSlug: z.string() }))
      .output(paramsJsonShape.nullable())
      .query(async ({ input }) => {
        const getFiles = async () => {
          return exampleRepoFiles
        }
        const files = await getFiles()
        const paramsJson = files['params.json']
        if (!paramsJson) {
          return null
        }
        const parsed = paramsJsonShape.safeParse(JSON.parse(paramsJson))
        if (parsed.success) {
          return parsed.data
        }
        return null
      }),
    readme: publicProcedure
      .input(z.object({ profileSlug: z.string(), repoSlug: z.string() }))
      .output(z.string().nullable())
      .query(async ({ input }) => {
        const getFiles = async () => {
          return exampleRepoFiles as Record<string, string>
        }
        const files = await getFiles()
        const paramsJson = files['params.json']

        if (!paramsJson) {
          return null
        }

        const parsed = paramsJsonShape.safeParse(JSON.parse(paramsJson))
        if (parsed.success) {
          return files[parsed.data.docs.main] || null
        }
        return null
      }),
  }),
  ping: publicProcedure.query(async () => {
    return {
      pong: '🏓',
    }
  }),
  bookings: router({
    list: authedProcedure.query(async ({ ctx }) => {
      const bookings = await db
        .select({
          ...pick('bookings', {
            id: true,
            start_datetime: true,
            duration_minutes: true,
            timezone: true,
            created_at: true,
            stripe_payment_intent_id: true,
            canceled_at: true,
            canceled_by_user_id: true,
          }),
          profile: pick('profiles', publicSchema.profiles.ProfilePublic),
          organization: pick('organizations', {
            id: true,
            name: true,
          }),
          canceled_by: pick('users', {
            id: true,
            first_name: true,
            last_name: true,
          }),
        })
        .from(schema.bookings)
        .innerJoin(schema.profiles, d.eq(schema.profiles.id, schema.bookings.profile_id))
        .innerJoin(
          schema.organizations,
          d.eq(schema.organizations.id, schema.bookings.organization_id)
        )
        .leftJoin(schema.users, d.eq(schema.users.id, schema.bookings.canceled_by_user_id))
        .where(
          d.or(
            d.exists(
              db
                .select()
                .from(schema.profileMembers)
                .where(
                  d.and(
                    d.eq(schema.profileMembers.user_id, ctx.auth.userId),
                    d.eq(schema.profileMembers.profile_id, schema.profiles.id)
                  )
                )
            ),
            d.exists(
              db
                .select()
                .from(schema.organizationMembers)
                .where(
                  d.and(
                    d.eq(schema.organizationMembers.user_id, ctx.auth.userId),
                    d.eq(schema.organizationMembers.organization_id, schema.organizations.id)
                  )
                )
            )
          )
        )
        .orderBy(d.desc(schema.bookings.created_at))

      return bookings
    }),
    cancel: authedProcedure
      .input(z.object({ id: z.string() }))
      .output(z.boolean())
      .mutation(async ({ ctx, input }) => {
        const profileMembershipSubquery = db
          .select({
            profile_id: schema.profileMembers.profile_id,
            user_id: schema.profileMembers.user_id,
          })
          .from(schema.profileMembers)
          .where(d.eq(schema.profileMembers.user_id, ctx.auth.userId))
          .as('my_profile_membership')
        const organizationMembershipSubquery = db
          .select({
            organization_id: schema.organizationMembers.organization_id,
            user_id: schema.organizationMembers.user_id,
          })
          .from(schema.organizationMembers)
          .where(d.eq(schema.organizationMembers.user_id, ctx.auth.userId))
          .as('my_organization_membership')

        const [booking] = await db
          .select({
            ...pick('bookings', {
              id: true,
              canceled_at: true,
              google_calendar_event_id: true,
            }),
            profile_id: profileMembershipSubquery.profile_id,
            organization_id: organizationMembershipSubquery.organization_id,
          })
          .from(schema.bookings)
          .where(d.and(d.eq(schema.bookings.id, input.id)))
          .leftJoin(
            profileMembershipSubquery,
            d.eq(schema.bookings.profile_id, profileMembershipSubquery.profile_id)
          )
          .leftJoin(
            organizationMembershipSubquery,
            d.eq(schema.bookings.organization_id, organizationMembershipSubquery.organization_id)
          )
          .limit(1)
        if (!booking?.profile_id && !booking?.organization_id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' })
        }
        if (booking.canceled_at) {
          return true
        }

        const [updatedBooking] = await db
          .update(schema.bookings)
          .set({ canceled_at: new Date(), canceled_by_user_id: ctx.auth.userId })
          .where(d.eq(schema.bookings.id, input.id))
          .returning()

        if (booking.google_calendar_event_id) {
          await googleCalendar.cancelCalendarEvent({
            eventId: booking.google_calendar_event_id,
          })
        }

        return updatedBooking?.canceled_at != null
      }),
  }),
})

export type AppRouter = typeof appRouter
