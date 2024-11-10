import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { SignInWithGithub } from 'app/features/oauth/github/sign-in-with-github'
import { RepositoryGithubUrlField, RepositorySlugField } from 'app/features/repository/new/fields'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { isValidSlug, slugify } from 'app/trpc/slugify'

const { useMutation } = api.updateRepo

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]['patch']>()

export function UpdateRepositoryForm({
  repoId,
  onDidUpdateRepository,
  onDidDeleteRepository,
}: {
  repoId: string
  onDidUpdateRepository: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
  onDidDeleteRepository: NonNullable<
    Parameters<typeof api.deleteRepo.useMutation>['0']
  >['onSuccess']
}) {
  const mutation = useMutation({
    onSuccess: onDidUpdateRepository,
  })

  const deleteMutation = api.deleteRepo.useMutation({
    onSuccess: onDidDeleteRepository,
  })

  const repoQuery = api.repoById.useQuery(
    { repo_id: repoId },
    {
      enabled: !!repoId,
      staleTime: 0,
      gcTime: 0,
    }
  )

  if (!repoQuery.data) return null

  const repo = repoQuery.data

  return (
    <Form.RootProvider
      defaultValues={{
        slug: repo.slug,
        github_url: repo.github_url,
      }}
    >
      <View grow>
        <Scroll>
          <View gap="$3" p="$3">
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

            <SignInWithGithub profileSlug={repo.profile.slug}>
              <Button>
                <ButtonText>Connect GitHub</ButtonText>
              </Button>
            </SignInWithGithub>
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
              <Button
                loading={isSubmitting}
                themeInverse
                disabled={!isDirty}
                onPress={handleDirtySubmit(async (data) => {
                  await mutation.mutateAsync({ repo_id: repoId, patch: data })
                })}
              >
                <ButtonText>Save Changes</ButtonText>
              </Button>
              <View grow>{isDirty && <Text>Unsaved changes</Text>}</View>
              <Button
                loading={deleteMutation.isPending}
                onPress={() => deleteMutation.mutate({ repo_id: repoId })}
                theme="red"
              >
                <ButtonText>Delete Repository</ButtonText>
              </Button>
            </View>
          )}
        </Form.Submit>
      </View>
    </Form.RootProvider>
  )
}
