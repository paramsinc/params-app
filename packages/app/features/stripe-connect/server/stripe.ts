import { serverEnv } from 'app/env/env.server'
import S from 'stripe'

export const stripe = new S(serverEnv.STRIPE_SECRET_KEY)

export type Stripe = S
