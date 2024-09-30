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
import { OfferCheckoutForm_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/checkout'
import { StripeProvider_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/provider'
import { useState } from 'app/react'
import { DateTime } from 'app/dates/date-time'
import { Image } from 'app/ds/Image'
import { formatCurrencyInteger } from 'app/features/stripe-connect/checkout/success/formatUSD'

const { useParams } = createParam<{
  profileSlug: string
  planId: string | undefined
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
  const plansQuery = api.onetimePlansByProfileSlug_public.useQuery({ profile_slug: profileSlug })
  const { params, setParams } = useParams()

  const [calBookingInput, setCalBookingInput] = useState<
    | Parameters<NonNullable<React.ComponentProps<typeof Calcom.Booker>['handleCreateBooking']>>[0]
    | null
  >(null)

  const error = profileQuery.error ?? eventTypes.error

  let planId = params.planId

  const plan = plansQuery.data?.find((p) => p.id === planId)

  const renderPlanPicker = () => {
    // TODO custom db event types
    return (
      <View bg="$color3" br="$3" overflow="hidden" gap="$3">
        {!plansQuery.data ? (
          <Text>Loading...</Text>
        ) : plansQuery.data?.length === 0 ? (
          <Text>This profile has disabled bookings for now.</Text>
        ) : (
          <View>
            {plansQuery.data?.map(({ id, duration_mins, price, currency }, i) => {
              return (
                <Fragment key={id}>
                  <View
                    p="$3"
                    group
                    row
                    ai="center"
                    hoverStyle={{ bg: '$color4' }}
                    animation="quick"
                    cursor="pointer"
                    btw={i && 1}
                    boc="$borderColor"
                    onPressIn={() => {
                      setParams({ planId: id })
                    }}
                  >
                    <View grow>
                      <Text bold>{duration_mins} Minute Call</Text>
                      <Text color="$color11">
                        {formatCurrencyInteger[currency]?.format(price / 100)}
                      </Text>
                    </View>

                    <Lucide.ChevronRight size={16} />
                  </View>
                </Fragment>
              )
            })}
          </View>
        )}
        <ErrorCard error={plansQuery.error} />
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

      {!plan ? (
        renderPlanPicker()
      ) : calBookingInput ? (
        <StripeProvider_ConfirmOnBackend amountCents={plan.price} currency="usd">
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
              <OfferCheckoutForm_ConfirmOnBackend
                profile_id={profile.id}
                organization_id={null}
                amount={plan.price}
                plan_id={plan.id}
                insert={{
                  start_datetime: DateTime.fromISO(calBookingInput.start, {
                    zone: calBookingInput.timeZone,
                  })!,
                  timezone: calBookingInput.timeZone,
                }}
              />
            ) : null}
          </View>
        </StripeProvider_ConfirmOnBackend>
      ) : (
        <Calcom.Booker
          eventSlug={'sixty-minutes-video'}
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
    </View>
  )
}

export const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return [hours && `${hours}h`, mins && `${mins}m`].filter(Boolean).join(', ') || '0m'
}
