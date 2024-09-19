import { z } from 'zod'

export const env = z
  .object({
    CLERK_PUBLISHABLE_KEY: z.string(),
  })
  .parse({
    CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  })
