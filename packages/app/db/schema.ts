import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  boolean,
  serial,
  pgEnum,
  jsonb,
  bigint,
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

export const profiles = pgTable('profiles', {
  id: text('id')
    .primaryKey()
    .$default(() => `profile_${ulid()}`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  bio: text('bio'),
  github_username: text('github_username'),
  image_vendor: text('image_vendor', { enum: ['cloudinary', 'raw'] }),
  image_vendor_id: text('image_vendor_id'),
  stripe_connect_account_id: text('stripe_connect_account_id').notNull(),

  // calcom_user_id: integer('calcom_user_id')
  //   .references(() => calcomUsers.id, {
  //     onDelete: 'restrict',
  //   })
  //   .notNull(),
  availability_ranges: jsonb('availability_ranges')
    .$type<Zod.infer<typeof availabilityRangesShape>>()
    .default([]),
  timezone: text('timezone').notNull().default('America/New_York'),

  ...timestampMixin(),
})

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
    ...timestampMixin(),
  },
  (table) => ({
    uniqueSlugForProfile: unique().on(table.profile_id, table.slug),
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
