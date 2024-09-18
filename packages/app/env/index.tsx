import { z } from 'zod'

export const env = z
  .object({
    CLERK_PUBLISHABLE_KEY: z.string().optional(),
    SERVER_CLERK_JWT_KEY: z.string().optional(),
    SERVER_CLERK_SECRET_KEY: z.string().optional(),
    SERVER_NEON_DATABASE_URL: z.string().optional(),
  })
  .parse({
    CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    SERVER_CLERK_JWT_KEY: process.env.CLERK_JWT_KEY,
    SERVER_CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    SERVER_NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
  })
