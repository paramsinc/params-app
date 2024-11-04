'use client'
import { DateTime } from 'luxon'
import { Page } from 'app/ds/Page'
import { View } from 'app/ds/View'
import { Text } from 'app/ds/Text'
import { Card } from 'app/ds/Form/layout'
import { api } from 'app/trpc/client'
import { styled } from 'app/ds/styled'
import { Image } from 'app/ds/Image'

export function BookingsPage() {
  const bookingsQuery = api.bookings.list.useQuery()

  if (!bookingsQuery.data) {
    return null
  }

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content gap="$3">
          <Card>
            <Text bold fontSize={24}>
              Your Bookings
            </Text>
          </Card>

          <View gap="$3">
            {bookingsQuery.data.map((booking) => (
              <BookingRow key={booking.booking.id} booking={booking} />
            ))}
          </View>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

const ProfileImage = styled(Image, {
  width: 50,
  height: 50,
  borderRadius: '$rounded',
})

type BookingRowProps = {
  booking: NonNullable<ReturnType<typeof api.bookings.list.useQuery>['data']>[number]
}

function BookingRow({ booking }: BookingRowProps) {
  const startTime = DateTime.fromISO(booking.booking.start_datetime as unknown as string)
  const endTime = startTime.plus({ minutes: booking.booking.duration_minutes })

  return (
    <Card flexDirection="row" alignItems="center" gap="$3" padding="$3">
      {booking.profile.image_vendor_id && booking.profile.image_vendor && (
        <ProfileImage
          src={booking.profile.image_vendor_id}
          alt={booking.profile.name}
          contentFit="cover"
        />
      )}

      <View gap="$2" grow>
        <Text bold>{booking.profile.name}</Text>
        <Text color="$color11">
          {startTime.toLocaleString(DateTime.DATETIME_FULL)} -{' '}
          {endTime.toLocaleString(DateTime.TIME_SIMPLE)}
        </Text>
        <Text color="$color10">Booked by {booking.organization.name}</Text>
      </View>
    </Card>
  )
}
