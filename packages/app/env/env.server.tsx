import { z } from 'zod'

declare global {
  var Deno: any
}

if (typeof window !== 'undefined' && typeof (Deno as any) === 'undefined') {
  throw new Error('env.server.tsx should only be imported in the server')
}

const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL
const DATABASE_URL = NEON_DATABASE_URL!

console.log(
  '[env.server.tsx] GITHUB_ACCESS_TOKEN_FOR_PUBLIC_REPOS',
  process.env.GITHUB_ACCESS_TOKEN_FOR_PUBLIC_REPOS
)

export const serverEnv = z
  .object({
    CLERK_SECRET_KEY: z.string(),
    NEON_DATABASE_URL: z.string(),
    DATABASE_URL: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    CLERK_WEBHOOK_SECRET: z.string(),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_SECRET: z.string(),
    GOOGLE_CAL_SERVICE_JSON: z.string(),
    GOOGLE_EMAIL_ACCOUNT_FOR_CALENDAR: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    GOOGLE_API_CREDENTIALS_JSON: z.object({
      web: z.object({
        client_id: z.string(),
        project_id: z.string(),
        auth_uri: z.string(),
        token_uri: z.string(),
        auth_provider_x509_cert_url: z.string(),
        client_secret: z.string(),
        redirect_uris: z.array(z.string()),
        javascript_origins: z.array(z.string()),
      }),
    }),
    RECAPTCHA_SECRET_KEY: z.string(),
    GITHUB_OAUTH_CLIENT_SECRET: z.string(),
    RESEND_KEY: z.string(),
    GITHUB_ACCESS_TOKEN_FOR_PUBLIC_REPOS: z.string(),
  })
  .parse({
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEON_DATABASE_URL,
    DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET,
    GOOGLE_CAL_SERVICE_JSON: process.env.GOOGLE_CAL_SERVICE_JSON,
    GOOGLE_EMAIL_ACCOUNT_FOR_CALENDAR: process.env.GOOGLE_EMAIL_ACCOUNT_FOR_CALENDAR,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    GOOGLE_API_CREDENTIALS_JSON: JSON.parse(process.env.GOOGLE_API_CREDENTIALS_JSON!),
    RECAPTCHA_SECRET_KEY: process.env.CAPTCHA_SECRET_KEY,
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    RESEND_KEY: process.env.RESEND_KEY,
    GITHUB_ACCESS_TOKEN_FOR_PUBLIC_REPOS: process.env.GITHUB_ACCESS_TOKEN_FOR_PUBLIC_REPOS,
  })
