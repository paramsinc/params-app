'use client'
'use dom'

import { Connect, AvailabilitySettings, Booker, CalendarSettings } from '@calcom/atoms'
import { CalcomProvider } from 'app/features/cal-com/provider'

export const Calcom = {
  Connect: {
    Google: Connect.GoogleCalendar,
    Apple: Connect.AppleCalendar,
    Outlook: Connect.OutlookCalendar,
  },

  AvailabilitySettings: AvailabilitySettings,
  Booker,

  Provider: CalcomProvider,
  CalendarSettings: CalendarSettings,
}
