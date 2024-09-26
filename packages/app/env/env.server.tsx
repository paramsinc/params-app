import { z } from 'zod'

declare global {
  var Deno: any
}

if (typeof window !== 'undefined' && typeof (Deno as any) === 'undefined') {
  throw new Error('env.server.tsx should only be imported in the server')
}

const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL
const DATABASE_URL = NEON_DATABASE_URL!

console.log('[server-env]', process.env.CLERK_SECRET_KEY)

export const serverEnv = z
  .object({
    CLERK_SECRET_KEY: z.string(),
    NEON_DATABASE_URL: z.string(),
    DATABASE_URL: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    CAL_COM_CLIENT_SECRET: z.string(),
    CLERK_WEBHOOK_SECRET: z.string(),
  })
  .parse({
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEON_DATABASE_URL,
    DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    CAL_COM_CLIENT_SECRET: process.env.CAL_COM_CLIENT_SECRET,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  })
