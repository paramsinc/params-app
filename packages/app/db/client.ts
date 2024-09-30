import type { schema } from 'app/db/db'
import type { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export type Select = {
  [key in keyof typeof schema]: Zod.infer<
    ReturnType<typeof createSelectSchema<(typeof schema)[key]>>
  >
}
