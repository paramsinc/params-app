import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { ulid } from 'ulid'

const timestampMixin = () => {
  return {
    created_at: timestamp('created_at').defaultNow(),
    last_updated_at: timestamp('updated_at')
      .notNull()
      .$onUpdate(() => new Date()),
  }
}

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').unique(),
  ...timestampMixin(),
})
