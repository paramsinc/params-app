import { DateTime } from 'app/dates/date-time'
import { Button, ButtonText } from 'app/ds/Button'
import { Switch } from 'app/ds/Switch'
import { Text } from 'app/ds/Text'
import { TimePicker } from 'app/ds/TimePicker'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { dayOfWeekToNumber } from 'app/features/profile/detail/dayOfWeekToNumber'
import { makeForm } from 'app/form'
import { entries } from 'app/helpers/object'
import { api } from 'app/trpc/client'

const { useMutation } = api.updateProfile

type Args = Parameters<ReturnType<typeof useMutation>['mutate']>[0]

const Form = makeForm<{
  profile_id: Args['id']
  availability_ranges: Args['patch']['availability_ranges']
}>()

export function ProfileAvailsForm() {
  const {
    formState: { isDirty },
  } = Form.useFormContext()
  return (
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
                <View key={dow} row gap="$3" flexWrap="wrap" p="$2" bg="$color2">
                  <View row gap="$3" ai="center" als="flex-start">
                    <Switch
                      checked={hasAvail}
                      onCheckedChange={() => {
                        if (!hasAvail) {
                          onChange([...availability_ranges, defaultAvailRowForDay(dow)])
                        } else {
                          onChange(availability_ranges.filter((avail) => avail.day_of_week !== dow))
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
                              start_time: { hour: newStartTime.hour, minute: newStartTime.minute },
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
  )
}

function Provider({ children, profileSlug }: { children: React.ReactNode; profileSlug: string }) {
  const profile = api.profileBySlug.useQuery({
    slug: profileSlug,
  }).data

  if (!profile) {
    return null
  }

  return (
    <Form.RootProvider
      defaultValues={{
        availability_ranges: profile.availability_ranges ?? [],
        profile_id: profile.id,
      }}
      key={profile.id}
      devtools
    >
      {children}
    </Form.RootProvider>
  )
}

function Submit() {
  const mutation = useMutation()
  const form = Form.useFormContext()

  const { toast } = useToast()

  return (
    <>
      <Form.Submit
        children={({ isSubmitting, handleSubmit, isDirty }) => {
          return (
            <Button
              loading={isSubmitting}
              onPress={handleSubmit(async ({ availability_ranges, profile_id }) => {
                await mutation
                  .mutateAsync({
                    patch: {
                      availability_ranges,
                    },
                    id: profile_id,
                  })
                  .then(({ availability_ranges }) => {
                    form.reset(
                      { availability_ranges: availability_ranges ?? [] },
                      { keepValues: true }
                    )
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
