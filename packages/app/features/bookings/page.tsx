'use client'
import { DateTime } from 'luxon'
import { Page } from 'app/ds/Page'
import { View } from 'app/ds/View'
import { Text } from 'app/ds/Text'
import { Card } from 'app/ds/Form/layout'
import { api } from 'app/trpc/client'
import { styled } from 'app/ds/styled'
import { Image } from 'app/ds/Image'
import { UserGate } from 'app/features/user/gate'
import { Auth } from 'app/auth'
import { Button } from 'app/ds/Button'
import { DropdownMenu } from 'app/ds/DropdownMenu'
import { Lucide } from 'app/ds/Lucide'
import { memo } from 'app/react'
import useAreYouSure from 'app/ds/AreYouSure/use-are-you-sure'
function useBookings() {
  const me = Auth.useUser()
  const bookingsQuery = api.bookings.list.useQuery(undefined, {
    enabled: me.isSignedIn === true,
  })

  return bookingsQuery
}

export function BookingsPage() {
  const bookingsQuery = useBookings()

  return (
    <UserGate>
      <Page.Root>
        <Page.Scroll>
          <Page.Content gap="$3">
            <Card>
              <Card.Title>My Bookings</Card.Title>
            </Card>

            <View gap="$1">
              {bookingsQuery.data?.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </View>
          </Page.Content>
        </Page.Scroll>
      </Page.Root>
    </UserGate>
  )
}

type BookingRowProps = {
  booking: NonNullable<ReturnType<typeof useBookings>['data']>[number]
}

const BookingRow = memo(function BookingRow({ booking }: BookingRowProps) {
  const startTime = DateTime.fromISO(booking.start_datetime)
  const endTime = startTime.plus({ minutes: booking.duration_minutes })
  const cancelMutation = api.bookings.cancel.useMutation()
  const areYouSure = useAreYouSure()

  return (
    <Card $gtSm={{ row: true }} gap="$3" padding="$3">
      <View width={100} height={50} overflow="hidden" br="$2">
        {booking.profile.image_vendor_id && booking.profile.image_vendor && (
          <Image
            src={booking.profile.image_vendor_id}
            alt={booking.profile.name}
            loader={booking.profile.image_vendor}
            width={100}
            height={50}
            contentFit="cover"
          />
        )}
      </View>

      <View gap="$2" $gtSm={{ grow: true }}>
        {booking.canceled_at != null && (
          <Text color="$color11" theme="red">
            Canceled ({DateTime.fromISO(booking.canceled_at).toLocaleString()}
            {booking.canceled_by &&
              ` by ${booking.canceled_by.first_name} ${booking.canceled_by.last_name}`}
            )
          </Text>
        )}
        <Text bold>{booking.profile.name}</Text>
        <Text textDecorationLine={booking.canceled_at != null ? 'line-through' : 'none'}>
          {startTime.toLocaleString({
            dateStyle: 'medium',
          })}
        </Text>
        <Text textDecorationLine={booking.canceled_at != null ? 'line-through' : 'none'}>
          {startTime.toLocaleString({
            timeStyle: 'short',
          })}
          {' - '}
          {endTime.toLocaleString({
            timeStyle: 'short',
          })}{' '}
          ({startTime.toFormat('ZZZZ')})
        </Text>
        <Text color="$color10">Booked by {booking.organization.name}</Text>
      </View>

      <View ai="flex-start" jc="flex-start">
        <DropdownMenu>
          <DropdownMenu.Trigger>
            <Button
              $gtSm={{ square: true }}
              alignSelf="center"
              theme={cancelMutation.isPending ? 'red' : undefined}
              loading={cancelMutation.isPending}
            >
              <Button.Icon icon={Lucide.MoreVertical} />
              <Button.Text $gtSm={{ d: 'none' }}>Actions</Button.Text>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item
              key="cancel booking"
              destructive
              onSelect={() =>
                areYouSure(() => cancelMutation.mutate({ id: booking.id }), {
                  title: 'Are you sure you want to cancel this booking?',
                })
              }
            >
              <DropdownMenu.ItemIcon icon={Lucide.Trash} />
              <DropdownMenu.ItemTitle>Cancel</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
            {/* <DropdownMenu.Item key="reschedule booking">
              <DropdownMenu.ItemIcon icon={Lucide.CalendarClock} />
              <DropdownMenu.ItemTitle>Reschedule</DropdownMenu.ItemTitle>
            </DropdownMenu.Item> */}
          </DropdownMenu.Content>
        </DropdownMenu>
      </View>
    </Card>
  )
})
