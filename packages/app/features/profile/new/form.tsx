import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import {
  ProfileNameField,
  ProfileSlugField,
  ProfileBioField,
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
              name="name"
              rules={{ required: true }}
              defaultValue={[me.data?.first_name, me.data?.last_name].filter(Boolean).join(' ')}
              render={({ field, fieldState }) => {
                const nameValue = field.value
                return (
                  <>
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
                  </>
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

            <Form.Submit>
              {({ isSubmitting, handleSubmit }) => (
                <Button
                  loading={isSubmitting || mutation.isPending}
                  als="flex-start"
                  onPress={handleSubmit(async ({ name, slug, bio }) => {
                    mutation.mutate({
                      name,
                      slug,
                      bio,
                    })
                  })}
                >
                  <ButtonText>Submit</ButtonText>
                </Button>
              )}
            </Form.Submit>
          </Form.RootProvider>
        </View>

        <ErrorCard error={mutation.error} />
      </Scroll>
    </View>
  )
}
