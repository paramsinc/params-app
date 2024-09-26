import { loadStripe } from '@stripe/stripe-js'
import { env } from 'app/env'

export const stripePromise = loadStripe(env.STRIPE_PUBLISHABLE_KEY)
