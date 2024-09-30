import { describe, expect, it } from 'bun:test'
import { DateTime } from 'app/dates/date-time'
import { generateAvailableSlots } from './generateAvailableSlots' // Adjust the import path as needed

describe('generateAvailableSlots', () => {
  const baseProfile = {
    timezone: 'America/New_York',
    availability_ranges: [
      {
        day_of_week: 'monday',
        start_time: { hour: 9, minute: 0 },
        end_time: { hour: 17, minute: 0 },
      },
      {
        day_of_week: 'tuesday',
        start_time: { hour: 9, minute: 0 },
        end_time: { hour: 17, minute: 0 },
      },
    ],
  } satisfies Parameters<typeof generateAvailableSlots>[number]['profile']

  const basePlan = { duration_mins: 60 }

  const baseStartDate = { year: 2023, month: 5, day: 1 } // A Monday
  const baseEndDate = { year: 2023, month: 5, day: 3 } // A Wednesday

  it('should generate correct slots for given availability', () => {
    const slots = generateAvailableSlots({
      profile: baseProfile,
      plan: basePlan,
      start_date: baseStartDate,
      end_date: baseEndDate,
      bookings: [],
    })

    expect(slots.length).toBe(16) // 8 slots per day for 2 days
    expect(slots[0]).toEqual({
      date: { year: 2023, month: 5, day: 1 },
      duration_mins: 60,
      time: { hour: 9, minute: 0 },
    })
    expect(slots[slots.length - 1]).toEqual({
      date: { year: 2023, month: 5, day: 2 },
      duration_mins: 60,
      time: { hour: 16, minute: 0 },
    })
  })

  it('should not generate slots for days without availability', () => {
    const slots = generateAvailableSlots({
      profile: { ...baseProfile, availability_ranges: [baseProfile.availability_ranges[0]] },
      plan: basePlan,
      start_date: baseStartDate,
      end_date: baseEndDate,
      bookings: [],
    })

    expect(slots.length).toBe(8) // 8 slots for Monday only
    slots.forEach((slot) => {
      expect(slot.date.day).toBe(1) // All slots should be on Monday
    })
  })

  it('should handle bookings and not generate conflicting slots', () => {
    const bookings = [
      {
        start_datetime: '2025-05-01T10:00:00-04:00',
        timezone: 'America/New_York',
        duration_minutes: 60,
      },
    ]

    const slots = generateAvailableSlots({
      profile: baseProfile,
      plan: basePlan,
      start_date: baseStartDate,
      end_date: baseEndDate,
      bookings,
    })

    expect(slots.length).toBe(15) // 7 slots for Monday (1 taken) + 8 for Tuesday
    expect(slots.some((slot) => slot.date.day === 1 && slot.time.hour === 10)).toBeFalsy()
  })

  it('should handle different timezones correctly', () => {
    const profile = {
      ...baseProfile,
      timezone: 'Europe/London',
    }

    const slots = generateAvailableSlots({
      profile,
      plan: basePlan,
      start_date: baseStartDate,
      end_date: baseEndDate,
      bookings: [],
    })

    expect(slots.length).toBe(16)
    expect(slots[0]?.time.hour).toBe(9) // Should still start at 9 AM London time
  })

  it('should handle plans with different durations', () => {
    const plan = { duration_mins: 30 }

    const slots = generateAvailableSlots({
      profile: baseProfile,
      plan,
      start_date: baseStartDate,
      end_date: baseEndDate,
      bookings: [],
    })

    expect(slots.length).toBe(32) // 16 slots per day for 2 days
    expect(slots[1]?.time).toEqual({ hour: 9, minute: 30 })
  })

  it('should not generate slots that extend beyond the availability range', () => {
    const profile = {
      ...baseProfile,
      availability_ranges: [
        {
          day_of_week: 'monday',
          start_time: { hour: 9, minute: 0 },
          end_time: { hour: 10, minute: 30 },
        },
      ],
    }

    const slots = generateAvailableSlots({
      profile,
      plan: basePlan,
      start_date: baseStartDate,
      end_date: baseEndDate,
      bookings: [],
    })

    expect(slots.length).toBe(1) // Only one slot should fit
    expect(slots[0].time).toEqual({ hour: 9, minute: 0 })
  })
})
