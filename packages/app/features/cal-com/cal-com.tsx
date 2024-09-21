import { Connect, AvailabilitySettings, Booker } from '@calcom/atoms'
import { styled } from 'app/ds/styled'
import { CalcomProvider } from 'app/features/cal-com/provider'

export const Calcom = {
  Connect: {
    Google: styled(Connect.GoogleCalendar),
    Apple: styled(Connect.AppleCalendar),
    Outlook: styled(Connect.OutlookCalendar),
  },

  AvailabilitySettings: AvailabilitySettings,
  Booker,

  Provider: CalcomProvider,
}
