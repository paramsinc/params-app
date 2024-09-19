import { schema } from 'app/db/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { entries } from 'app/helpers/object'

export const inserts = Object.fromEntries(
  entries(schema).map(([key, table]) => [key, createInsertSchema(table)])
) as {
  [key in keyof typeof schema]: ReturnType<
    typeof createInsertSchema<(typeof schema)[key]>
  >
}

export const selects = Object.fromEntries(
  entries(schema).map(([key, table]) => [key, createSelectSchema(table)])
) as {
  [key in keyof typeof schema]: ReturnType<
    typeof createSelectSchema<(typeof schema)[key]>
  >
}