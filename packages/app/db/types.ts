import { z } from 'zod'

const time = z.object({ hour: z.number(), minute: z.number() })
const dow = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])

export const availabilityRangesShape = z.array(
  z.object({
    start_time: time,
    end_time: time,
    day_of_week: dow,
  })
)

export const googleCalendarsToBlockForAvailsShape = z.array(z.string())
