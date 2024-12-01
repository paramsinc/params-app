import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Scroll } from 'app/ds/Scroll'
import { View } from 'app/ds/View'
import { RepositoryGithubUrlField, RepositorySlugField } from 'app/features/repository/new/fields'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { isValidSlug } from 'app/trpc/slugify'
import {
  RepoAllowBookingForMainProfileField,
  RepoAllowBookingForTeamField,
} from './fields/allow-booking'

const { useMutation } = api.repo.create

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]>()

export function NewRepositoryForm({
  onDidCreateRepository,
  profileId,
}: {
  onDidCreateRepository: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
  profileId: string
}) {
  const mutation = useMutation({
    onSuccess: onDidCreateRepository,
  })

  return (
    <View grow>
      <Scroll>
        <View gap="$3" p="$3">
          <Form.RootProvider>
            <Form.Controller
              name="slug"
              rules={{
                validate: (value) => (value && isValidSlug(value) ? true : false),
              }}
              render={({ field, fieldState }) => (
                <RepositorySlugField
                  slug={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />
            <Form.Controller
              name="github_url"
              rules={{ required: 'Please enter a GitHub URL' }}
              render={({ field, fieldState }) => (
                <RepositoryGithubUrlField
                  url={field.value ?? ''}
                  onChange={field.onChange}
                  error={fieldState.error}
                  inputRef={field.ref}
                />
              )}
            />
            <Form.Controller
              name="allow_booking_for_main_profile"
              render={({ field }) => (
                <RepoAllowBookingForMainProfileField
                  profileSlug={profile.slug}
                  value={field.value ?? false}
                  onChange={field.onChange}
                />
              )}
            />
            <Form.Controller
              name="allow_booking_for_team"
              render={({ field }) => (
                <RepoAllowBookingForTeamField
                  value={field.value ?? false}
                  onChange={field.onChange}
                />
              )}
            />
            <Form.Submit>
              {({ isSubmitting, handleSubmit }) => (
                <Button
                  loading={isSubmitting || mutation.isPending}
                  als="flex-start"
                  onPress={handleSubmit(async ({ slug, github_url }) => {
                    mutation.mutate({
                      slug,
                      profile_id: profileId,
                      github_url,
                    })
                  })}
                  themeInverse
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
