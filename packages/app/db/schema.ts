import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  pgEnum,
  serial,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { ulid } from 'ulid'

const timestampMixin = () => {
  return {
    created_at: timestamp('created_at').defaultNow(),
    last_updated_at: timestamp('updated_at')
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
  image_vendor: text('image_vendor'),
  image_vendor_id: text('image_vendor_id'),
  stripe_connect_account_id: text('stripe_connect_account_id').notNull(),

  cal_com_account_id: integer('cal_com_account_id'),
  cal_com_access_token: text('cal_com_access_token'),
  cal_com_refresh_token: text('cal_com_refresh_token'),

  ...timestampMixin(),
})

export const repositories = pgTable(
  'repositories',
  {
    id: text('id')
      .primaryKey()
      .$default(() => `repository_${ulid()}`),
    slug: text('slug')
      .unique()
      .notNull()
      .default(
        sql`'' ADD CONSTRAINT "check_slug" CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')`
      ),
    name: text('name').notNull(),
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
