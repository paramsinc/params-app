import { DateTime } from 'app/dates/date-time'
import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Scroll } from 'app/ds/Scroll'
import { Switch } from 'app/ds/Switch'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import {
  ProfileNameField,
  ProfileSlugField,
  ProfileBioField,
  ProfileCoverImageField,
  ProfilePricePerHourField,
  ProfileShortBioField,
} from 'app/features/profile/new/fields'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { slugify } from 'app/trpc/slugify'

const { useMutation } = api.createProfile

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>({
  scrollToError: false,
})

export function NewProfileForm({
  onDidCreateProfile,
}: {
  onDidCreateProfile: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
}) {
  const me = api.me.useQuery()
  const mutation = useMutation({
    onSuccess: onDidCreateProfile,
  })
  const myProfiles = api.myProfiles.useQuery()

  // TODO loading state
  if (me.data === undefined || myProfiles.data === undefined) {
    return <ErrorCard error={me.error ?? myProfiles.error} m="$3" />
  }

  const hasPersonalProfile = myProfiles.data.some((profile) => profile.personal_profile_user_id)

  // TODO if me.data is undefined...throw

  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <Form.RootProvider
            devtools
            defaultValues={{
              is_personal_profile: !hasPersonalProfile,
              name: hasPersonalProfile
                ? ''
                : [me.data?.first_name, me.data?.last_name].filter(Boolean).join(' '),
            }}
          >
            <Form.Controller
              name="image_vendor_id"
              render={(imageVendorId) => {
                return (
                  <Form.Controller
                    name="image_vendor"
                    render={(imageVendor) => {
                      return (
                        <ProfileCoverImageField
                          image={
                            imageVendor.field.value && imageVendorId.field.value
                              ? {
                                  id: imageVendorId.field.value,
                                  vendor: imageVendor.field.value,
                                }
                              : undefined
                          }
                          onChange={(next) => {
                            imageVendorId.field.onChange(
                              next.id satisfies typeof imageVendorId.field.value
                            )
                            imageVendor.field.onChange(
                              next.vendor satisfies typeof imageVendor.field.value
                            )
                          }}
                          onRemove={() => {
                            imageVendorId.field.onChange(undefined)
                            imageVendor.field.onChange(undefined)
                          }}
                        />
                      )
                    }}
                  />
                )
              }}
            />
            <Form.Controller
              name="name"
              rules={{ required: true }}
              disableScrollToError
              render={({ field, fieldState }) => {
                const nameValue = field.value
                return (
                  <View gap="$3">
                    <ProfileNameField
                      name={nameValue}
                      onChange={field.onChange}
                      error={fieldState.error}
                      inputRef={field.ref}
                    />

                    <Form.Controller
                      name="slug"
                      rules={{ required: 'Please enter a slug' }}
                      disableScrollToError
                      render={({ field, fieldState }) => (
                        <ProfileSlugField
                          slug={field.value ?? slugify(nameValue)}
                          onChange={field.onChange}
                          error={fieldState.error}
                          inputRef={field.ref}
                        />
                      )}
                    />
                  </View>
                )
              }}
            />

            <Form.Controller
              name="is_personal_profile"
              render={({ field }) => {
                return (
                  <Card>
                    <View row gap="$1" ai="center">
                      <View f={1} gap="$3">
                        <Card.Label tag="label" htmlFor="team_profile">
                          Profile Type
                        </Card.Label>
                      </View>

                      {[
                        { title: 'Personal', value: true },
                        { title: 'Team', value: false },
                      ].map(({ title, value }) => (
                        <Button
                          inverse={field.value === value}
                          onPress={() => field.onChange(value)}
                          key={title}
                        >
                          <ButtonText>{title}</ButtonText>
                        </Button>
                      ))}
                    </View>
                    <Card.Description>
                      Team profiles are for organizations, companies, or groups with more than one
                      person.
                    </Card.Description>
                  </Card>
                )
              }}
            />
            <Form.Controller
              name="pricePerHourCents"
              rules={{ required: 'Please enter a price per hour', min: 0 }}
              render={({ field, fieldState }) => (
                <ProfilePricePerHourField
                  pricePerHourCents={field.value ?? null}
                  error={fieldState.error != null}
                  onChange={field.onChange}
                />
              )}
            />

            <Form.Controller
              name="short_bio"
              rules={{ required: 'Please enter a short bio' }}
              render={({ field, fieldState }) => (
                <ProfileShortBioField
                  shortBio={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />

            <Form.Controller
              name="bio"
              render={({ field, fieldState }) => (
                <ProfileBioField
                  bio={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />
            <ErrorCard error={mutation.error} />

            <Form.Submit>
              {({ isSubmitting, handleSubmit }) => (
                <Button
                  loading={isSubmitting || mutation.isPending}
                  als="flex-start"
                  onPress={handleSubmit(
                    async ({
                      name,
                      slug,
                      bio,
                      image_vendor_id,
                      image_vendor,
                      is_personal_profile,
                      pricePerHourCents,
                      timezone = DateTime.local().zoneName ?? 'America/New_York',
                      short_bio,
                    }) => {
                      mutation.mutate({
                        name,
                        slug: slug ?? slugify(name),
                        bio,
                        image_vendor_id,
                        image_vendor,
                        is_personal_profile,
                        pricePerHourCents,
                        timezone,
                        short_bio,
                      })
                    }
                  )}
                  inverse
                >
                  <ButtonText>Submit</ButtonText>
                </Button>
              )}
            </Form.Submit>
          </Form.RootProvider>
        </View>
      </Scroll>
    </View>
  )
}
