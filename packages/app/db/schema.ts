import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  boolean,
  serial,
  jsonb,
  bigint,
  index,
} from 'drizzle-orm/pg-core'
import { ulid } from 'ulid'
import { availabilityRangesShape, googleCalendarsToBlockForAvailsShape } from 'app/db/types'

const timestampMixin = () => {
  return {
    created_at: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow(),
    last_updated_at: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }
}

// const imageVendor = pgEnum('image_vendor', ['cloudinary', 'raw'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').unique().notNull(),
  ...timestampMixin(),
})

export const profiles = pgTable(
  'profiles',
  {
    id: text('id')
      .primaryKey()
      .$default(() => `profile_${ulid()}`),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    bio: text('bio'),
    short_bio: text('short_bio'),
    github_username: text('github_username'),
    image_vendor: text('image_vendor', { enum: ['cloudinary', 'raw'] }),
    image_vendor_id: text('image_vendor_id'),
    stripe_connect_account_id: text('stripe_connect_account_id').notNull(),

    x_social_username: text('x_social_username'),
    linkedin_social_username: text('linkedin_social_username'),

    availability_ranges: jsonb('availability_ranges')
      .$type<Zod.infer<typeof availabilityRangesShape>>()
      .default([]),
    timezone: text('timezone').notNull().default('America/New_York'),

    personal_profile_user_id: text('personal_profile_user_id')
      .unique()
      .references(() => users.id, {
        onDelete: 'set null',
      }),

    has_stripe_payouts_enabled: boolean('has_stripe_payouts_enabled').default(false),

    ...timestampMixin(),
  },
  (table) => ({
    index_slug: index('index_profile_slug').on(table.slug),
  })
)

export const profileOnetimePlans = pgTable('profile_onetime_plans', {
  id: text('id')
    .primaryKey()
    .$default(() => `profile_onetime_plan_${ulid()}`),
  profile_id: text('profile_id')
    .notNull()
    .references(() => profiles.id, {
      onDelete: 'cascade',
    }),
  price: integer('price').notNull(),
  currency: text('currency', { enum: ['usd'] }).notNull(),
  duration_mins: integer('duration_mins').notNull(),
  ...timestampMixin(),
})

export const repositories = pgTable(
  'repositories',
  {
    id: text('id')
      .primaryKey()
      .$default(() => `repository_${ulid()}`),
    slug: text('slug').notNull(),
    github_url: text('github_url'),
    profile_id: text('profile_id')
      .notNull()
      .references(() => profiles.id, {
        onDelete: 'cascade',
      }),
    index: serial('index').notNull(),
    description: text('description'),
    allow_booking_for_main_profile: boolean('allow_booking_for_main_profile').default(true),
    allow_booking_for_member_personal_profiles: boolean(
      'allow_booking_for_member_personal_profiles'
    ).default(false),
    ...timestampMixin(),
  },
  (table) => ({
    uniqueSlugForProfile: unique().on(table.profile_id, table.slug),
    index_repository_slug: index('index_repository_slug').on(table.slug),
  })
)

export const profileMembers = pgTable(
  'profile_members',
  {
    id: text('id')
      .primaryKey()
      .$default(() => `profile_member_${ulid()}`),
    first_name: text('first_name').notNull(),
    last_name: text('last_name').notNull(),
    email: text('email').notNull(),
    profile_id: text('profile_id')
      .notNull()
      .references(() => profiles.id, {
        onDelete: 'cascade',
      }),
    user_id: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    ...timestampMixin(),
  },
  (table) => ({
    index_profile_id_and_user_id: index('index_profile_id_and_user_id').on(
      table.profile_id,
      table.user_id
    ),
    uniqueUserIdForProfile: unique().on(table.profile_id, table.user_id),
  })
)

export const calcomUsers = pgTable('calcom_users', {
  id: integer('id').primaryKey(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  email: text('email').unique().notNull(),
  ...timestampMixin(),
})

export const offers = pgTable('offers', {
  id: text('id')
    .primaryKey()
    .$default(() => `offer_${ulid()}`),
  profile_id: text('profile_id')
    .notNull()
    .references(() => profiles.id, {
      onDelete: 'restrict',
    }),
  organization_id: text('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'restrict',
    }),
  stripe_payment_intent_id: text('stripe_payment_intent_id'),
  voided: boolean('voided').default(false),
  created_by_user_id: text('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  start_datetime: timestamp('start_datetime', { mode: 'date', withTimezone: true }).notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  timezone: text('timezone').notNull(),
  ...timestampMixin(),
})

export const bookings = pgTable('bookings', {
  id: text('id')
    .primaryKey()
    .$default(() => `booking_${ulid()}`),
  offer_id: text('offer_id')
    .notNull()
    .unique()
    .references(() => offers.id, {
      onDelete: 'restrict',
    }),
  profile_id: text('profile_id')
    .notNull()
    .references(() => profiles.id, {
      onDelete: 'restrict',
    }),
  organization_id: text('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'restrict',
    }),
  google_calendar_event_id: text('google_calendar_event_id').notNull(),
  stripe_payment_intent_id: text('stripe_payment_intent_id').notNull(),
  stripe_payout_id: text('stripe_payout_id'),
  created_by_user_id: text('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  canceled_at: timestamp('canceled_at'),
  canceled_by_user_id: text('canceled_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),

  start_datetime: timestamp('start_datetime', { mode: 'date', withTimezone: true }).notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  timezone: text('timezone').notNull(),

  ...timestampMixin(),
})

export const organizations = pgTable('organizations', {
  id: text('id')
    .primaryKey()
    .$default(() => `organization_${ulid()}`),
  name: text('name').notNull(),
  stripe_customer_id: text('stripe_customer_id').notNull(),
  created_by_user_id: text('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  ...timestampMixin(),
})

export const organizationMembers = pgTable('organization_members', {
  id: text('id')
    .primaryKey()
    .$default(() => `organization_member_${ulid()}`),
  organization_id: text('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
  user_id: text('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  email: text('email').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  ...timestampMixin(),
})

export const googleCalendarIntegrations = pgTable(
  'google_calendar_integrations',
  {
    access_token: text('access_token').notNull(),
    refresh_token: text('refresh_token').notNull(),
    expires_at_ms: bigint('expires_at_ms', {
      mode: 'number',
    }).notNull(),
    id_token: text('id_token').notNull(),
    profile_id: text('profile_id')
      .notNull()
      .references(() => profiles.id, {
        onDelete: 'cascade',
      }),
    calendars_for_avail_blocking: jsonb('calendars_for_avail_blocking')
      .$type<Zod.infer<typeof googleCalendarsToBlockForAvailsShape>>()
      .notNull(),
    google_user_id: text('google_user_id').unique().notNull(),
    picture_url: text('picture_url'),
    email: text('email').unique().notNull(),
    ...timestampMixin(),
  },
  (table) => ({
    uniqueProfileId: unique().on(table.profile_id, table.google_user_id),
  })
)

export const waitlistSignups = pgTable('waitlist_signups', {
  id: text('id')
    .primaryKey()
    .$default(() => `waitlist_signup_${ulid()}`),
  email: text('email').notNull().unique(),
  ...timestampMixin(),
})

export const githubIntegrations = pgTable('github_integrations', {
  user_id: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  github_user_id: bigint('github_user_id', { mode: 'number' }).notNull(),
  github_username: text('github_username').notNull(),
  /**
   * TODO encrypt & have decryption env var?
   */
  access_token: text('access_token').notNull(),
  avatar_url: text('avatar_url'),
  ...timestampMixin(),
})

export const githubRepoIntegrations = pgTable('github_repo_integrations', {
  repo_id: text('repo_id')
    .notNull()
    .references(() => repositories.id, { onDelete: 'cascade' })
    .primaryKey(),
  github_integration_user_id: text('github_integration_user_id')
    .notNull()
    .references(() => githubIntegrations.user_id, { onDelete: 'cascade' }),
  github_repo_id: bigint('github_repo_id', { mode: 'number' }).notNull(),
  github_repo_name: text('github_repo_name').notNull(),
  github_repo_owner: text('github_repo_owner').notNull(),
  path_to_code: text('path_to_code').notNull().default(''),
  default_branch: text('default_branch').notNull(),
  ...timestampMixin(),
})
