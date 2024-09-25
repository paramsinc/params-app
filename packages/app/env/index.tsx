import { isWeb } from 'app/helpers/is-web'
import { z } from 'zod'

export const env = z
  .object({
    CLERK_PUBLISHABLE_KEY: z.string(),
    CAL_COM_API_URL: z.string(),
    CAL_COM_CLIENT_ID: z.string(),
    CAL_COM_REFRESH_URL: z.string(),
    APP_URL: z.string(),
    STRIPE_PUBLISHABLE_KEY: z.string(),
    APP_NAME: z.string(),
  })
  .parse({
    CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CAL_COM_API_URL: 'https://api.cal.com/v2',
    CAL_COM_CLIENT_ID: process.env.NEXT_PUBLIC_CAL_COM_CLIENT_ID,
    CAL_COM_REFRESH_URL: isWeb ? '/api/cal/refresh' : 'http://params.com/api/cal/refresh',
    APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'params.com',
    STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'Params',
  })
