import { z } from 'zod'

const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL
const DATABASE_URL = NEON_DATABASE_URL!

console.log('[server-env]', process.env.CLERK_SECRET_KEY)

export const serverEnv = z
  .object({
    CLERK_SECRET_KEY: z.string(),
    NEON_DATABASE_URL: z.string(),
    DATABASE_URL: z.string(),
    STRIPE_SECRET_KEY: z.string(),
  })
  .parse({
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEON_DATABASE_URL,
    DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  })
