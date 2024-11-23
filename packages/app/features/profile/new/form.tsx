import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import {
  ProfileNameField,
  ProfileSlugField,
  ProfileBioField,
  ProfileCoverImageField,
} from 'app/features/profile/new/fields'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { slugify } from 'app/trpc/slugify'

const { useMutation } = api.createProfile

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>()

export function NewProfileForm({
  onDidCreateProfile,
}: {
  onDidCreateProfile: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
}) {
  const me = api.me.useQuery()
  const mutation = useMutation({
    onSuccess: onDidCreateProfile,
  })

  // TODO loading state
  if (me.data === undefined) return null

  // TODO if me.data is undefined...throw

  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <Form.RootProvider>
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
              defaultValue={[me.data?.first_name, me.data?.last_name].filter(Boolean).join(' ')}
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
                      defaultValue={slugify(nameValue)}
                      render={({ field, fieldState }) => (
                        <ProfileSlugField
                          slug={field.value}
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
                    async ({ name, slug, bio, image_vendor_id, image_vendor }) => {
                      mutation.mutate({
                        name,
                        slug,
                        bio,
                        image_vendor_id,
                        image_vendor,
                      })
                    }
                  )}
                  themeInverse
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
