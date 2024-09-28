import { Page } from 'app/ds/Page'
import { useEventTypes } from '@calcom/atoms'
import { Calcom } from 'app/features/cal-com/cal-com'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'
import { ErrorCard } from 'app/ds/Error/card'
import { View } from 'app/ds/View'
import { Text } from 'app/ds/Text'
import { Fragment } from 'react'
import { Lucide } from 'app/ds/Lucide'
import { Modal, ModalBackdrop, ModalContent, ModalDialog, ModalTrigger } from 'app/ds/Modal'
import { Button, ButtonText } from 'app/ds/Button'
import { Scroll } from 'app/ds/Scroll'
import { StripeCheckoutForm_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/checkout'
import { StripeProvider_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/provider'
import { useState } from 'app/react'
import { DateTime } from 'app/dates/date-time'
import { Image } from 'app/ds/Image'

const { useParams } = createParam<{
  profileSlug: string
  eventTypeSlug: string | undefined
  slot?: string
}>()

export function ProfileDetailBookPage() {
  const {
    params: { profileSlug },
  } = useParams()

  const calUserNameQuery = api.calUserByProfileSlug_public.useQuery({
    profileSlug,
  })

  const calUserName = calUserNameQuery.data

  return (
    <Calcom.ProviderPublic>
      <Page.Root>
        <Page.Scroll>
          <Page.Content>
            {calUserName ? (
              <Booker profileSlug={profileSlug} calUsername={calUserName} />
            ) : (
              <>
                <ErrorCard error={calUserNameQuery.error} />
              </>
            )}
          </Page.Content>
        </Page.Scroll>
      </Page.Root>
    </Calcom.ProviderPublic>
  )
}

function Booker({ profileSlug, calUsername }: { profileSlug: string; calUsername: string }) {
  const profileQuery = api.profileBySlug_public.useQuery({ profile_slug: profileSlug })
  const eventTypes = useEventTypes(calUsername)
  const { params, setParams } = useParams()

  const amountCents = 425_00

  const [calBookingInput, setCalBookingInput] = useState<
    | Parameters<NonNullable<React.ComponentProps<typeof Calcom.Booker>['handleCreateBooking']>>[0]
    | null
  >(null)

  const error = profileQuery.error ?? eventTypes.error

  let eventTypeSlug = params.eventTypeSlug
  console.log('params.slot', params.slot)

  if (!eventTypeSlug && eventTypes.data?.length === 1) {
    eventTypeSlug = eventTypes.data[0]!.slug
  }

  const renderEventTypePicker = () => {
    const seenLengths = new Set<number>()
    // TODO custom db event types
    return (
      <View bg="$color3" br="$3" overflow="hidden">
        {eventTypes.data
          ?.slice()
          .sort((a, b) => {
            return b.lengthInMinutes - a.lengthInMinutes
          })
          .map(({ id, slug, lengthInMinutes, title, price }, i) => {
            if (seenLengths.has(lengthInMinutes)) {
              return null
            }
            seenLengths.add(lengthInMinutes)
            return (
              <Fragment key={id}>
                {i > 0 && <View h={1} bg="$color4" />}
                <View
                  p="$3"
                  group
                  row
                  ai="center"
                  hoverStyle={{ bg: '$color4' }}
                  animation="quick"
                  cursor="pointer"
                  onPressIn={() => {
                    setParams({ eventTypeSlug: slug })
                  }}
                >
                  <View grow>
                    <Text bold>{title}</Text>
                    <View p="$1" bg="$color1" als="flex-start">
                      <Text>{formatMinutes(lengthInMinutes)}</Text>
                    </View>
                  </View>

                  <Lucide.ChevronRight size={16} />
                </View>
              </Fragment>
            )
          })}
        <ErrorCard error={eventTypes.error} />
      </View>
    )
  }

  const profile = profileQuery.data

  return (
    <View gap="$3">
      <ErrorCard error={error} />

      {profile && (
        <View center gap="$3">
          {profile.image_vendor && profile.image_vendor_id ? (
            <View w={250}>
              <View aspectRatio={16 / 9} bg="$color2">
                <Image
                  sizes="500px"
                  loader={profile.image_vendor}
                  src={profile.image_vendor_id}
                  fill
                  alt={profile.name}
                  contentFit="cover"
                />
              </View>
            </View>
          ) : null}
          <Text center bold>
            {profile.name}
          </Text>
          <Text center color="$color11">
            Book a meeting
          </Text>
        </View>
      )}

      {!eventTypeSlug ? (
        renderEventTypePicker()
      ) : calBookingInput ? (
        <StripeProvider_ConfirmOnBackend amountCents={amountCents} currency="usd">
          <View
            p="$3"
            gap="$3"
            bg="$color3"
            maw={760}
            w="100%"
            als="center"
            x={0}
            o={1}
            enterStyle={{
              x: 10,
              o: 0,
            }}
            animation="quick"
          >
            <View p="$3" bg="$color1" gap="$3">
              <Button onPress={() => setCalBookingInput(null)} als="flex-start">
                <ButtonText>Back</ButtonText>
              </Button>
              <View>
                <Text>
                  {DateTime.fromISO(calBookingInput.start, {
                    zone: calBookingInput.timeZone,
                  }).toLocaleString({
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text bold>
                  {[
                    DateTime.fromISO(calBookingInput.start, {
                      zone: calBookingInput.timeZone,
                    }).toLocaleString({
                      hour: 'numeric',
                      minute: 'numeric',
                    }),
                    calBookingInput.end &&
                      DateTime.fromISO(calBookingInput.end, {
                        zone: calBookingInput.timeZone,
                      }).toLocaleString({
                        hour: 'numeric',
                        minute: 'numeric',
                      }),
                  ]
                    .filter(Boolean)
                    .join(' - ')}{' '}
                  (
                  {DateTime.fromISO(calBookingInput.start, {
                    zone: calBookingInput.timeZone,
                  }).toFormat('ZZZZ')}
                  )
                </Text>
              </View>
            </View>
            {profile ? (
              <StripeCheckoutForm_ConfirmOnBackend
                profile_id={profile.id}
                organization_id={null}
                amount={amountCents}
              />
            ) : null}
          </View>
        </StripeProvider_ConfirmOnBackend>
      ) : (
        <Calcom.Booker
          eventSlug={eventTypeSlug}
          username={calUsername}
          hideBranding
          handleCreateBooking={(e) => {
            setCalBookingInput(e)
          }}
          customClassNames={{
            // no border radius tailwind
            bookerContainer: 'radius-none',
          }}
        />
      )}

      {/* <Modal
        open={createCalBookingInput != null}
        onOpenChange={(next) => {
          if (!next) {
            setCalBookingInput(null)
          }
        }}
      >
        <ModalContent>
          <ModalBackdrop />
          <ModalDialog>
            <Modal.Dialog.HeaderSmart title="Book a Call" />
            <Scroll>
              
            </Scroll>
          </ModalDialog>
        </ModalContent>
      </Modal> */}
    </View>
  )
}

export const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return [hours && `${hours}h`, mins && `${mins}m`].filter(Boolean).join(', ') || '0m'
}
