import { track } from '@vercel/analytics/react'
import { posthog } from 'posthog-js'

export const analytics = {
  track: (event: string, data: Record<string, any>) => {
    track(event, data)
    posthog.capture(event, data)
  },
}
