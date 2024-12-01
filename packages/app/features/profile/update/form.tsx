import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import {
  ProfileBioField,
  ProfileCoverImageField,
  ProfileNameField,
  ProfileShortBioField,
  ProfileSlugField,
} from 'app/features/profile/new/fields'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'

const { useMutation } = api.updateProfile

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]['patch']>()

export function ProfileUpdateForm({
  profileSlug,
  onDidUpdateProfile,
  onDidDeleteProfile,
}: {
  profileSlug: string
  onDidUpdateProfile: NonNullable<NonNullable<Parameters<typeof useMutation>[0]>['onSuccess']>
  onDidDeleteProfile: NonNullable<
    NonNullable<Parameters<typeof api.deleteProfile.useMutation>[0]>['onSuccess']
  >
}) {
  const mutation = useMutation({
    onSuccess: onDidUpdateProfile,
  })
  const deleteMutation = api.deleteProfile.useMutation({
    onSuccess: onDidDeleteProfile,
  })
  const profileQuery = api.profileBySlug.useQuery({ slug: profileSlug })

  if (profileQuery.data == null) return null
  const profile = profileQuery.data

  return (
    <Form.RootProvider
      defaultValues={{
        name: profile.name,
        slug: profile.slug,
        bio: profile.bio,
        image_vendor: profile.image_vendor,
        image_vendor_id: profile.image_vendor_id,
      }}
    >
      <View grow>
        <Scroll>
          <View p="$3" gap="$3">
            <Form.Controller
              name="image_vendor"
              render={(imageVendor) => (
                <Form.Controller
                  name="image_vendor_id"
                  render={(imageVendorId) => (
                    <ProfileCoverImageField
                      image={
                        imageVendor.field.value && imageVendorId.field.value
                          ? {
                              id: imageVendorId.field.value,
                              vendor: imageVendor.field.value,
                            }
                          : undefined
                      }
                      onChange={(image) => {
                        imageVendorId.field.onChange(image.id)
                        imageVendor.field.onChange(image.vendor)
                      }}
                      onRemove={() => {
                        imageVendorId.field.onChange(null)
                        imageVendor.field.onChange(null)
                      }}
                    />
                  )}
                />
              )}
            />

            <Form.Controller
              name="name"
              render={({ field, fieldState }) => (
                <ProfileNameField
                  name={field.value ?? profile.name}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
              rules={{ required: 'Name is required' }}
            />
            <Form.Controller
              name="slug"
              render={({ field, fieldState }) => (
                <ProfileSlugField
                  reservedSlug={profile.slug}
                  slug={field.value ?? profile.slug}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
              rules={{ required: 'Slug is required' }}
            />
            <Form.Controller
              name="short_bio"
              rules={{
                maxLength: {
                  value: ProfileShortBioField.maxLength,
                  message: "That's a bit too long.",
                },
              }}
              render={({ field, fieldState }) => (
                <ProfileShortBioField
                  shortBio={field.value ?? profile.short_bio ?? ''}
                  onChange={field.onChange}
                  inputRef={field.ref}
                  error={fieldState.error}
                />
              )}
            />
            <Form.Controller
              name="bio"
              render={({ field, fieldState }) => (
                <ProfileBioField
                  bio={field.value ?? profile.bio ?? ''}
                  onChange={field.onChange}
                  inputRef={field.ref}
                  error={fieldState.error}
                />
              )}
            />
          </View>
        </Scroll>
        <ErrorCard error={mutation.error} />
        <ErrorCard error={deleteMutation.error} />

        <Form.Submit>
          {({ isSubmitting, handleDirtySubmit, isDirty }) => (
            <View
              row
              gap="$3"
              p="$3"
              btw={1}
              boc="$borderColor"
              themeInverse={isDirty}
              bg="$color1"
              ai="center"
            >
              {/* TODO implement deleting a profile... */}
              {/* with are you sure... */}
              {null && (
                <Button onPress={() => deleteMutation.mutate({ id: profile.id })} theme="red">
                  <ButtonText>Delete</ButtonText>
                </Button>
              )}
              <View grow>{isDirty && <Text>Unsaved changes</Text>}</View>
              <Button
                loading={isSubmitting}
                themeInverse
                disabled={!isDirty}
                onPress={handleDirtySubmit(async (data) => {
                  await mutation.mutateAsync({ id: profile.id, patch: data }).catch()
                })}
              >
                <ButtonText>Save</ButtonText>
              </Button>
            </View>
          )}
        </Form.Submit>
      </View>
    </Form.RootProvider>
  )
}
