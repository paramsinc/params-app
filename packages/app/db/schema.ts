import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  pgEnum,
} from 'drizzle-orm/pg-core'

const timestampMixin = () => {
  return {
    created_at: timestamp('created_at').defaultNow(),
    last_updated_at: timestamp('updated_at')
      .notNull()
      .$onUpdate(() => new Date()),
  }
}

const imageVendor = pgEnum('image_vendor', ['cloudinary', 'raw'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').unique().notNull(),
  ...timestampMixin(),
})

import { ulid } from 'ulid'

export const profiles = pgTable('profiles', {
  id: text('id')
    .primaryKey()
    .$default(() => `profile_${ulid()}`),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  bio: text('bio'),
  github_username: text('github_username'),
  image_vendor: imageVendor('image_vendor'),
  image_vendor_id: text('image_vendor_id'),
  stripe_connect_account_id: text('stripe_connect_account_id').notNull(),
  ...timestampMixin(),
})

export const repositories = pgTable(
  'repositories',
  {
    id: text('id')
      .primaryKey()
      .$default(() => `repository_${ulid()}`),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    github_url: text('github_url'),
    profile_id: text('profile_id')
      .notNull()
      .references(() => profiles.id),
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
      .references(() => profiles.id),
    user_id: text('user_id').references(() => users.id),
    ...timestampMixin(),
  },
  (table) => ({
    uniqueUserIdForProfile: unique().on(table.profile_id, table.user_id),
  })
)
