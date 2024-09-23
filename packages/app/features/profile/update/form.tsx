import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Scroll } from 'app/ds/Scroll'
import { View } from 'app/ds/View'
import {
  ProfileBioField,
  ProfileNameField,
  ProfileSlugField,
} from 'app/features/profile/new/fields'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'

const { useMutation } = api.updateProfile

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]['patch']>()

export function ProfileUpdateForm({
  profileSlug,
  onDidUpdateProfile,
}: {
  profileSlug: string
  onDidUpdateProfile: () => void
}) {
  const mutation = useMutation({
    onSuccess: onDidUpdateProfile,
  })
  const profileQuery = api.profileBySlug.useQuery({ slug: profileSlug })

  if (profileQuery.data == null) return null
  const profile = profileQuery.data

  return (
    <View grow>
      <Scroll>
        <View p="$3" gap="$3">
          <Form.RootProvider
            defaultValues={{ name: profile.name, slug: profile.slug, bio: profile.bio }}
          >
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
                  slug={field.value ?? profile.slug}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
              rules={{ required: 'Slug is required' }}
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

            <ErrorCard error={mutation.error} />

            <Form.Submit>
              {({ isSubmitting, handleDirtySubmit, isDirty }) => (
                <Button
                  loading={isSubmitting}
                  onPress={handleDirtySubmit(async (data) => {
                    if (Object.keys(data).length === 0) {
                      return onDidUpdateProfile()
                    }
                    await mutation.mutateAsync({ id: profile.id, patch: data }).catch()
                  })}
                  als="flex-start"
                >
                  <ButtonText>Save</ButtonText>
                </Button>
              )}
            </Form.Submit>
          </Form.RootProvider>
        </View>
      </Scroll>
    </View>
  )
}
