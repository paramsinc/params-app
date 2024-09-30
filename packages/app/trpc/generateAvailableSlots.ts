import { DateTime } from 'app/dates/date-time'
import { availabilityRangesShape } from 'app/db/types'
import { upcomingSlotsShape } from 'app/trpc/api'

export function generateAvailableSlots(params: {
  profile: {
    timezone: string
    availability_ranges: Zod.infer<typeof availabilityRangesShape>
  }
  plan: {
    duration_mins: number
  }
  start_date: {
    year: number
    month: number
    day: number
  }
  end_date: {
    year: number
    month: number
    day: number
  }
  bookings: Array<{
    start_datetime: string
    timezone: string
    duration_minutes: number
  }>
}): Zod.infer<typeof upcomingSlotsShape>['slots'] {
  const { profile, plan, start_date, end_date, bookings } = params
  const slots: Zod.infer<typeof upcomingSlotsShape>['slots'] = []
  const weekdayToEnum: Record<number, Zod.infer<typeof availabilityRangesShape>[0]['day_of_week']> =
    {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
      7: 'sunday',
    }

  let dateTime = DateTime.fromObject(start_date, { zone: profile.timezone })
  const endDateTime = DateTime.fromObject(end_date, { zone: profile.timezone }).startOf('day')

  while (dateTime.startOf('day') < endDateTime) {
    const queuedAvailRanges = [...profile.availability_ranges]

    while (queuedAvailRanges.length) {
      const range = queuedAvailRanges.shift()!
      if (range.day_of_week !== weekdayToEnum[dateTime.weekday]) {
        continue
      }
      const rangeStart = DateTime.fromObject(range.start_time, { zone: profile.timezone })
      const rangeEnd = DateTime.fromObject(range.end_time, { zone: profile.timezone })

      let start = rangeStart
      while (start.plus({ minutes: plan.duration_mins }) <= rangeEnd) {
        const slotEnd = start.plus({ minutes: plan.duration_mins })
        const hasConflictingBooking = bookings.some((booking): boolean => {
          const bookingStart = DateTime.fromISO(booking.start_datetime, {
            zone: booking.timezone,
          })
          const bookingEnd = bookingStart.plus({ minutes: booking.duration_minutes })

          return bookingStart < slotEnd && bookingEnd > start
        })

        if (!hasConflictingBooking) {
          slots.push({
            date: {
              year: dateTime.year,
              month: dateTime.month,
              day: dateTime.day,
            },
            duration_mins: plan.duration_mins,
            time: { hour: start.hour, minute: start.minute },
          })
        }

        start = start.plus({ minute: plan.duration_mins })
      }
    }

    dateTime = dateTime.plus({ day: 1 })
  }

  return slots
}
