import { availabilityRangesShape } from 'app/db/types'

export const dayOfWeekToNumber = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
} satisfies Record<Zod.infer<typeof availabilityRangesShape>[number]['day_of_week'], number>
