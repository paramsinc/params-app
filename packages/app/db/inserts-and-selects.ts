import { schema } from 'app/db/db'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { entries } from 'app/helpers/object'

export const selects = Object.fromEntries(
  entries(schema).map(([key, table]) => [
    key,
    createSelectSchema(table).describe(`Fields for ${key}.`),
  ])
) as {
  [key in keyof typeof schema]: ReturnType<typeof createSelectSchema<(typeof schema)[key]>>
}

export const inserts = Object.fromEntries(
  entries(schema).map(([key, table]) => [
    key,
    createInsertSchema(table).describe(`Insert for ${key}.`).strict(),
  ])
) as any as {
  [key in keyof typeof schema]: ReturnType<typeof createInsertSchema<(typeof schema)[key]>>
}
