import { DateTime } from 'app/dates/date-time'
import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { createContext } from 'app/ds/createContext'
import { Card } from 'app/ds/Form/layout'
import { Lucide } from 'app/ds/Lucide'
import { Switch } from 'app/ds/Switch'
import { Text } from 'app/ds/Text'
import { Theme } from 'app/ds/Theme'
import { TimePicker } from 'app/ds/TimePicker'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { TimezonePicker } from 'app/features/profile/detail/timezone-picker'
import { makeForm } from 'app/form'
import { entries } from 'app/helpers/object'
import { useContext } from 'app/react'
import { api } from 'app/trpc/client'

const { useMutation } = api.updateProfile

type Args = Parameters<ReturnType<typeof useMutation>['mutate']>[0]

const Form = makeForm<{
  profile_id: Args['id']
  availability_ranges: Args['patch']['availability_ranges']
  timezone: Args['patch']['timezone']
}>()

export function ProfileAvailsForm() {
  return (
    <View gap="$3">
      <Form.Controller
        disableScrollToError
        name="availability_ranges"
        render={({ field }) => {
          const availability_ranges = field.value ?? []
          const displayDow = {
            sunday: 'Sunday',
            monday: 'Monday',
            tuesday: 'Tuesday',
            wednesday: 'Wednesday',
            thursday: 'Thursday',
            friday: 'Friday',
            saturday: 'Saturday',
          } satisfies Record<NonNullable<typeof availability_ranges>[number]['day_of_week'], string>

          const onChange = (next: typeof availability_ranges) => {
            field.onChange(next)
          }

          const defaultAvailRowForDay = (
            dow: (typeof availability_ranges)[number]['day_of_week']
          ): (typeof availability_ranges)[number] => ({
            day_of_week: dow,
            start_time: {
              hour: 9,
              minute: 0,
            },
            end_time: {
              hour: 17,
              minute: 0,
            },
          })

          return (
            <View gap="$1">
              {entries(displayDow).map(([dow, title]) => {
                const avails = availability_ranges
                  .filter((avail) => avail.day_of_week === dow)
                  .sort((a, b) => {
                    const aDt = DateTime.fromObject(a.start_time)
                    const bDt = DateTime.fromObject(b.start_time)

                    return aDt > bDt ? 1 : -1
                  })
                const hasAvail = avails.length > 0

                return (
                  <View
                    key={dow}
                    row
                    gap="$3"
                    flexWrap="wrap"
                    p="$2"
                    bg="$color2"
                    borderRadius="$3"
                    bw={2}
                    boc="$borderColor"
                  >
                    <View row gap="$3" ai="center" als="flex-start">
                      <Switch
                        checked={hasAvail}
                        onCheckedChange={() => {
                          if (!hasAvail) {
                            onChange([...availability_ranges, defaultAvailRowForDay(dow)])
                          } else {
                            onChange(
                              availability_ranges.filter((avail) => avail.day_of_week !== dow)
                            )
                          }
                        }}
                      />
                      <View w={100}>
                        <Text>{title}</Text>
                      </View>
                    </View>
                    <View minHeight={32} gap="$1">
                      {avails?.map((avail, index) => {
                        const onRemove = () => {
                          onChange(availability_ranges.filter((item) => item !== avail))
                        }
                        const onAdd = () => {
                          const lastEndTime = avails[avails.length - 1]?.end_time

                          if (lastEndTime) {
                            const newStartTime = DateTime.fromObject(lastEndTime)
                            const newEndTime = newStartTime.plus({ hour: 1 })

                            onChange([
                              ...availability_ranges,
                              {
                                day_of_week: dow,
                                start_time: {
                                  hour: newStartTime.hour,
                                  minute: newStartTime.minute,
                                },
                                end_time: { hour: newEndTime.hour, minute: newEndTime.minute },
                              },
                            ])
                          }
                        }

                        return (
                          // it's a random array, but changing length should change the key
                          // only because the time picker isn't controlled....
                          <View key={`${index}-${avails.length}`} row ai="center" gap="$1">
                            <TimePicker
                              time={avail.start_time}
                              onChangeTime={(time) => {
                                console.log('time', time)
                              }}
                            />
                            <Text>-</Text>
                            <TimePicker
                              time={avail.end_time}
                              onChangeTime={(time) => {
                                console.log('time', time)
                              }}
                            />
                            {index === 0 && (
                              <>
                                <Button onPress={onAdd}>
                                  <ButtonText>Add</ButtonText>
                                </Button>
                              </>
                            )}

                            {index > 0 && (
                              <Button onPress={onRemove}>
                                <ButtonText>Remove</ButtonText>
                              </Button>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  </View>
                )
              })}
            </View>
          )
        }}
      />
      <View row gap="$2" ai="center">
        <Text>Timezone</Text>
        <Form.Controller
          name="timezone"
          render={({ field }) => {
            return (
              <TimezonePicker timezone={field.value} onChange={field.onChange}>
                <Button>
                  <ButtonText>
                    {field.value?.split('/').pop()?.replace(/_/g, ' ') ?? 'Select timezone'}
                  </ButtonText>
                  <ButtonIcon icon={Lucide.ChevronDown} />
                </Button>
              </TimezonePicker>
            )
          }}
        />
      </View>
      <FormDirty />
    </View>
  )
}

function FormDirty() {
  const form = Form.useFormContext()
  if (!form.formState.isDirty) {
    return null
  }

  return (
    <Theme name="yellow">
      <Card row gap="$1" ai="center">
        <Card.Title flex={1}>You have unsaved changes.</Card.Title>
        <Button onPress={() => form.reset()}>
          <ButtonText>Discard</ButtonText>
        </Button>
        <Submit />
      </Card>
    </Theme>
  )
}

const ProfileIdContext = createContext('')

function Provider({ children, profileSlug }: { children: React.ReactNode; profileSlug: string }) {
  const profile = api.profileBySlug.useQuery({
    slug: profileSlug,
  }).data

  if (!profile) {
    return null
  }

  console.log('[profile-context]', profile.id)

  return (
    <ProfileIdContext value={profile.id}>
      <ProfileIdContext.Consumer>
        {(id) => {
          console.log('[profile-context][consumer]', id)
          return null
        }}
      </ProfileIdContext.Consumer>
      <Form.RootProvider
        defaultValues={{
          availability_ranges: profile.availability_ranges ?? [],
          timezone: profile.timezone,
        }}
        key={profile.id}
        devtools
      >
        {children}
      </Form.RootProvider>
    </ProfileIdContext>
  )
}

function Submit() {
  const mutation = useMutation()
  const form = Form.useFormContext()

  const { toast } = useToast()

  const profile_id = ProfileIdContext.use()
  console.log('[profile-context][submit]', profile_id)
  return (
    <>
      <Form.Submit
        children={({ isSubmitting, handleSubmit, isDirty }) => {
          return (
            <Button
              loading={isSubmitting}
              onPress={handleSubmit(async ({ availability_ranges, timezone }) => {
                await mutation
                  .mutateAsync({
                    patch: {
                      availability_ranges,
                      timezone,
                    },
                    id: profile_id,
                  })
                  .then(({ availability_ranges, timezone }) => {
                    form.reset({
                      availability_ranges: availability_ranges ?? [],
                      timezone,
                    })

                    toast({
                      title: 'Availability saved.',
                      preset: 'done',
                    })
                  })
              })}
              themeInverse={isDirty}
            >
              <ButtonText>Save</ButtonText>
            </Button>
          )
        }}
      />
    </>
  )
}
ProfileAvailsForm.Provider = Provider
ProfileAvailsForm.Submit = Submit
