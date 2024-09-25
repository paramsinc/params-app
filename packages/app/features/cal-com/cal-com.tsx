'use dom'
'use client'

import {
  Connect,
  AvailabilitySettings,
  Booker,
  CalendarSettings,
  useConnectedCalendars,
} from '@calcom/atoms'

import { View } from 'app/ds/View'
import { CalcomProvider } from 'app/features/cal-com/provider'

export const Calcom = {
  Connect: {
    Google: function GoogleConnect(props: React.ComponentProps<typeof Connect.GoogleCalendar>) {
      const connectedCalendars = useConnectedCalendars({}).data
      if (connectedCalendars?.connectedCalendars.length) {
        return null
      }
      return (
        <View p="$3" bg="white">
          <Connect.GoogleCalendar
            {...props}
            alreadyConnectedLabel="Google Sync'd!"
            label="Sync Google Calendar"
            className=""
            redir={window.location.href}
          />
        </View>
      )
    },
    Apple: Connect.AppleCalendar,
    Outlook: Connect.OutlookCalendar,
  },

  AvailabilitySettings: function AvailSettings(
    props: React.ComponentProps<typeof AvailabilitySettings>
  ) {
    return (
      <View bg="white">
        <AvailabilitySettings
          {...props}
          enableOverrides
          customClassNames={{}}
          onUpdateSuccess={({ status }) => {}}
        />
      </View>
    )
  },

  Booker,

  Provider: CalcomProvider,

  CalendarSettings: function CalSettings(props: React.ComponentProps<typeof CalendarSettings>) {
    return (
      <View bg="white">
        <CalendarSettings {...props} />
      </View>
    )
  },
}
