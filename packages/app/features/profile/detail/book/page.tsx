import { Page } from 'app/ds/Page'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'
import { ErrorCard } from 'app/ds/Error/card'
import { View } from 'app/ds/View'
import { Text } from 'app/ds/Text'
import { Fragment } from 'react'
import { Lucide } from 'app/ds/Lucide'
import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { OfferCheckoutForm_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/checkout'
import { StripeProvider_ConfirmOnBackend } from 'app/features/stripe-connect/checkout/confirm-on-backend/provider'
import { useState } from 'app/react'
import { DateTime } from 'app/dates/date-time'
import { Image } from 'app/ds/Image'
import { formatCurrencyInteger } from 'app/features/stripe-connect/checkout/success/formatUSD'
import { group } from 'app/helpers/dash'
import { entries } from 'app/helpers/object'
import { Card } from 'app/ds/Form/layout'
import { LinkButton } from 'app/ds/Button/link'
import { Link } from 'app/ds/Link'
import { AnimatePresence, MotiView } from 'moti'
import { UserGate } from 'app/features/user/gate'
import { usePrevious } from 'app/helpers/use-previous'

const { useParams } = createParam<{
  profileSlug: string
  planId: string | undefined
  eventTypeSlug: string | undefined
  slotId: string | undefined
  repoSlug: string | undefined
}>()

export function ProfileDetailBookPage() {
  const {
    params: { profileSlug, repoSlug },
  } = useParams()

  return (
    <UserGate>
      <Page.Root>
        <Page.Scroll>
          <Page.Content>
            <Booker profileSlug={profileSlug} repoSlug={repoSlug} />
          </Page.Content>
        </Page.Scroll>
      </Page.Root>
    </UserGate>
  )
}

const now = DateTime.now()
const end = DateTime.now().plus({ days: 20 })

function Booker({ profileSlug, repoSlug }: { profileSlug: string; repoSlug: string | undefined }) {
  const profileQuery = api.profileBySlug_public.useQuery({ profile_slug: profileSlug })
  const plansQuery = api.onetimePlansByProfileSlug_public.useQuery({ profile_slug: profileSlug })

  const { params, setParams } = useParams()

  const error = profileQuery.error

  let planId = params.planId

  const [slot, setSlot] = useState<
    NonNullable<ReturnType<typeof useSlots>['data']>['slots'][0] | null
  >(null)

  const plan = plansQuery.data?.find((p) => p.id === planId)

  const renderPlanPicker = () => {
    return (
      <View bg="$color3" br="$3" overflow="hidden" gap="$3">
        {!plansQuery.data ? (
          <Text p="$3">Loading...</Text>
        ) : plansQuery.data?.length === 0 ? (
          <Text p="$3">This profile has disabled bookings for now.</Text>
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
                      <Text bold>{duration_mins}-Minute Call</Text>
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
      </View>
    )
  }

  const profile = profileQuery.data

  const step = !plan ? 0 : !slot ? 1 : 2
  const previousStep = usePrevious(step)
  const isBack = step < (previousStep ?? 0) ? true : false

  if (!profile) {
    return <ErrorCard error={profileQuery.error} />
  }

  const backHref = `/@${[profile.slug, repoSlug].filter(Boolean).join('/')}`

  return (
    <View gap="$3">
      <ErrorCard error={error} />

      <View center gap="$3">
        <Link href={backHref}>
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
        </Link>
        <Text center bold>
          {profile.name}
        </Text>
        <Text center color="$color11">
          Book a meeting
        </Text>
      </View>
      <AnimatePresence exitBeforeEnter custom={isBack}>
        <MotiView
          key={[plan?.id, slot?.duration_mins].join(',')}
          from={{ opacity: 0, translateX: 10 * (isBack ? -1 : 1) }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={(isBack: boolean) => {
            'worklet'
            return { opacity: 0, translateX: -10 * (isBack ? -1 : 1) }
          }}
          transition={{ type: 'timing', duration: 200 } as any}
        >
          {!plan ? (
            <View maw={760} w="100%" als="center" gap="$3">
              <View row ai="center" gap="$3">
                <LinkButton href={backHref} replace>
                  <ButtonIcon icon={Lucide.ChevronLeft} />
                  <ButtonText>Back to {repoSlug ? 'repo' : 'profile'}</ButtonText>
                </LinkButton>
              </View>
              {renderPlanPicker()}
            </View>
          ) : slot ? (
            (() => {
              const dateTime = DateTime.fromObject(
                {
                  hour: slot.time.hour,
                  minute: slot.time.minute,
                  day: slot.date.day,
                  month: slot.date.month,
                  year: slot.date.year,
                },
                {
                  zone: profile.timezone,
                }
              )
              const dateTimeLocal = dateTime.setZone('local')
              return (
                <StripeProvider_ConfirmOnBackend amountCents={plan.price} currency="usd">
                  <Card
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
                      <Button onPress={() => setSlot(null)} als="flex-start">
                        <ButtonIcon icon={Lucide.ChevronLeft} />
                        <ButtonText>Back</ButtonText>
                      </Button>
                      <View>
                        <Text>
                          {dateTime.toLocaleString({
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text bold>
                          {[
                            dateTime.toLocaleString({
                              hour: 'numeric',
                              minute: 'numeric',
                            }),

                            dateTime.plus({ minutes: plan.duration_mins }).toLocaleString({
                              hour: 'numeric',
                              minute: 'numeric',
                            }),
                          ].join(' - ')}{' '}
                          ({dateTime.toFormat('ZZZZ')})
                        </Text>
                        {dateTimeLocal.zoneName !== dateTime.zoneName && (
                          <Text mt="$2">
                            (
                            {dateTimeLocal.day !== dateTime.day &&
                              dateTimeLocal.toLocaleString({
                                month: 'long',
                                day: 'numeric',
                              }) + ' '}
                            {dateTimeLocal.toLocaleString({
                              timeStyle: 'short',
                            })}{' '}
                            {dateTimeLocal.toFormat('ZZZZ')})
                          </Text>
                        )}
                      </View>
                    </View>
                    <OfferCheckoutForm_ConfirmOnBackend
                      profile_id={profile.id}
                      organization_id={null}
                      amount={plan.price}
                      plan_id={plan.id}
                      insert={{
                        start_datetime: {
                          year: dateTime.year,
                          month: dateTime.month,
                          day: dateTime.day,
                          hour: dateTime.hour,
                          minute: dateTime.minute,
                        },
                        timezone: profile.timezone,
                      }}
                    />
                  </Card>
                </StripeProvider_ConfirmOnBackend>
              )
            })()
          ) : (
            <View w="100%" maw={760} als="center" gap="$3">
              <View row ai="center" gap="$3">
                <Button onPress={() => setParams({ planId: undefined })}>
                  <ButtonIcon icon={Lucide.ChevronLeft} />
                  <ButtonText>Back</ButtonText>
                </Button>
              </View>
              <View row ai="center" gap="$3">
                <View grow>
                  <Text>{formatMinutes(plan.duration_mins)} Call</Text>
                </View>
              </View>
              <SlotPicker planId={planId} profileSlug={profileSlug} onSelectSlot={setSlot} />
            </View>
          )}
        </MotiView>
      </AnimatePresence>
    </View>
  )
}

function useSlots({ planId, profileSlug }: { planId: string | undefined; profileSlug: string }) {
  return api.upcomingProfileSlots_public.useQuery(
    {
      profile_slug: profileSlug,
      start_date: {
        year: now.year,
        month: now.month,
        day: now.day,
      },
      end_date: {
        year: end.year,
        month: end.month,
        day: end.day,
      },
      plan_id: planId!,
    },
    {
      enabled: !!planId,
      trpc: { context: { batch: false } },
    }
  )
}

export const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return [hours && `${hours}h`, mins && `${mins}m`].filter(Boolean).join(', ') || '0m'
}

type Q = (typeof api)['upcomingProfileSlots_public']['useQuery']

const SlotPicker = ({
  planId,
  profileSlug,
  onSelectSlot,
}: {
  planId: string | undefined
  profileSlug: string
  onSelectSlot: (slot: NonNullable<ReturnType<typeof useSlots>['data']>['slots'][0]) => void
}) => {
  const slotsQuery = useSlots({ planId, profileSlug })

  if (!slotsQuery.data) {
    return <Text>Loading...</Text>
  }
  const profileTimezone = slotsQuery.data.timezone
  const selectedTimezone = profileTimezone
  const slotsByDate = group(
    slotsQuery.data.slots,
    ({ date }) => DateTime.fromObject(date).toISODate()!
  )
  const timezoneDt = DateTime.fromObject({}, { zone: selectedTimezone })
  const timezoneShiftedSlotsByDate = entries(slotsByDate).map(([date, slots]) => {
    const dateObj = DateTime.fromISO(date, { zone: profileTimezone })
    if (!dateObj.isValid) {
      return null
    }
    const timezoneShiftedDateObj =
      selectedTimezone !== profileTimezone ? dateObj.setZone(selectedTimezone) : dateObj
    return {
      date,
      timezoneShiftedSlots: slots?.map((slot) => {
        let dt = dateObj.set({
          hour: slot.time.hour,
          minute: slot.time.minute,
        })
        if (selectedTimezone !== profileTimezone) {
          const next = dt.setZone(selectedTimezone)

          if (next.isValid) {
            dt = next
          }
        }
        return {
          slot,
          displayDt: dt,
        }
      }),
      timezoneShiftedDateObj,
    }
  })

  return (
    <View gap="$3">
      <Text color="$color11">
        All times are in {timezoneDt.zoneName?.replaceAll('_', ' ')} ({timezoneDt.toFormat('ZZZZ')})
        timezone.
      </Text>
      <View gap="$1">
        {slotsQuery.data.slots.length === 0 && (
          <Text>Bookings are currently unavailable for this profile.</Text>
        )}
        {entries(slotsByDate).map(([date, slots]) => {
          let dateObj = DateTime.fromISO(date, { zone: profileTimezone })
          if (!dateObj.isValid) {
            return null
          }
          return (
            <View key={date}>
              <Card>
                <Text bold>{dateObj.toLocaleString({ dateStyle: 'full' })}</Text>
                <View gap="$1" row flexWrap="wrap">
                  {slots?.map((slot, index) => {
                    let dt = dateObj.set({
                      hour: slot.time.hour,
                      minute: slot.time.minute,
                    })
                    return (
                      <Button key={index} onPress={() => onSelectSlot(slot)}>
                        <ButtonText>
                          {dt.toLocaleString({
                            timeStyle: 'short',
                          })}
                        </ButtonText>
                      </Button>
                    )
                  })}
                </View>
              </Card>
            </View>
          )
        })}
      </View>
    </View>
  )
}
