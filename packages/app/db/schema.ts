import { integer, pgTable, text, timestamp, unique, boolean, serial } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { ulid } from 'ulid'

const timestampMixin = () => {
  return {
    created_at: timestamp('created_at', { mode: 'string' }).defaultNow(),
    last_updated_at: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date().toISOString()),
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
  image_vendor: text('image_vendor'),
  image_vendor_id: text('image_vendor_id'),
  stripe_connect_account_id: text('stripe_connect_account_id').notNull(),

  calcom_user_id: integer('calcom_user_id')
    .references(() => calcomUsers.id, {
      onDelete: 'restrict',
    })
    .notNull(),

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
      onDelete: 'cascade',
    }),
  stripe_payment_intent_id: text('stripe_payment_intent_id'),
  voided: boolean('voided').default(false),
  created_by_user_id: text('created_by_user_id').references(() => users.id, {
    onDelete: 'restrict',
  }),

  ...timestampMixin(),
})

export const bookings = pgTable('bookings', {
  id: text('id')
    .primaryKey()
    .$default(() => `booking_${ulid()}`),
  offer_id: text('offer_id')
    .notNull()
    .references(() => offers.id, {
      onDelete: 'restrict',
    }),
  profile_id: text('profile_id')
    .notNull()
    .references(() => profiles.id, {
      onDelete: 'cascade',
    }),
  calcom_booking_id: integer('calcom_booking_id').notNull(),
  stripe_payment_intent_id: text('stripe_payment_intent_id').notNull(),
  stripe_payout_id: text('stripe_payout_id'),
  created_by_user_id: text('created_by_user_id').references(() => users.id, {
    onDelete: 'restrict',
  }),
  ...timestampMixin(),
})
