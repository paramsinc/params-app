import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Lucide } from 'app/ds/Lucide'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import useToast from 'app/ds/Toast'
import { View } from 'app/ds/View'
import { SignInWithGithub } from 'app/features/oauth/github/sign-in-with-github'
import { RepositoryGithubUrlField, RepositorySlugField } from 'app/features/repository/new/fields'
import { GitHubRepoPicker } from 'app/features/repository/new/github-repo-picker'
import { makeForm } from 'app/form'
import { api } from 'app/trpc/client'
import { isValidSlug, slugify } from 'app/trpc/slugify'

const { useMutation } = api.repo.update
const useDeleteMutation = api.repo.delete.useMutation

const Form = makeForm<Parameters<ReturnType<typeof useMutation>['mutate']>[0]['patch']>()

export function UpdateRepositoryForm({
  repoId,
  onDidUpdateRepository,
  onDidDeleteRepository,
}: {
  repoId: string
  onDidUpdateRepository: NonNullable<Parameters<typeof useMutation>['0']>['onSuccess']
  onDidDeleteRepository: NonNullable<Parameters<typeof useDeleteMutation>['0']>['onSuccess']
}) {
  const mutation = useMutation({
    onSuccess: onDidUpdateRepository,
  })

  const deleteMutation = useDeleteMutation({
    onSuccess: onDidDeleteRepository,
  })

  const { toast } = useToast()

  const createGithubIntegrationMutation = api.github.createRepoIntegration.useMutation({
    onSuccess(data, variables, context) {
      toast({
        title: 'GitHub Repository Connected',
        preset: 'done',
      })
    },
  })

  const removeGithubIntegrationMutation = api.github.deleteRepoIntegration.useMutation({
    onSuccess(data, variables, context) {
      toast({
        title: 'GitHub Repository Disconnected',
        preset: 'done',
      })
    },
  })

  const repoQuery = api.repo.byId.useQuery(
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
            <View
              opacity={createGithubIntegrationMutation.isPending || repoQuery.isFetching ? 0.5 : 1}
            >
              {repo.githubRepoIntegration ? (
                <Card theme="green" row gap="$2">
                  <View flex={1} gap="$2">
                    <Lucide.Github />
                    <Card.Title fontFamily="$mono" color="$color11">
                      {repo.githubRepoIntegration.github_repo_owner}/
                      {repo.githubRepoIntegration.github_repo_name}
                    </Card.Title>
                    <Card.Description>GitHub repo is connected.</Card.Description>
                    {!!repo.githubRepoIntegration.path_to_code && (
                      <Card.Description fontFamily="$mono">
                        {repo.githubRepoIntegration.path_to_code}
                      </Card.Description>
                    )}
                    <View row ai="center" gap="$2">
                      <Lucide.GitBranch size={14} />
                      <Card.Description bold fontFamily="$mono">
                        {repo.githubRepoIntegration.default_branch}
                      </Card.Description>
                    </View>
                  </View>
                  <Button
                    als="flex-start"
                    theme="gray"
                    onPress={() => {
                      removeGithubIntegrationMutation.mutate({ repo_id: repoId })
                    }}
                    loading={removeGithubIntegrationMutation.isPending}
                  >
                    <ButtonIcon icon={Lucide.X} />
                    <ButtonText>Remove</ButtonText>
                  </Button>
                </Card>
              ) : (
                <Card>
                  <Card.Title>Connect GitHub Repository</Card.Title>
                  <Card.Description>
                    Connect a GitHub repository to your repository to enable code sync.
                  </Card.Description>

                  <Card.Separator />

                  <GitHubRepoPicker
                    selectedRepo={
                      createGithubIntegrationMutation.variables &&
                      createGithubIntegrationMutation.isPending
                        ? {
                            id: createGithubIntegrationMutation.variables.github_repo_id,
                            name: createGithubIntegrationMutation.variables.github_repo_name,
                            owner: {
                              login: createGithubIntegrationMutation.variables.github_repo_owner,
                            },
                          }
                        : null
                    }
                    onSelectRepo={({ id, name, owner }) => {
                      createGithubIntegrationMutation.mutate({
                        repo_id: repoId,
                        github_repo_id: id,
                        github_repo_name: name,
                        github_repo_owner: owner.login,
                      })
                    }}
                  />
                </Card>
              )}
            </View>
          </View>
        </Scroll>

        <ErrorCard error={mutation.error} />
        <ErrorCard error={deleteMutation.error} />
        <ErrorCard error={removeGithubIntegrationMutation.error} />
        <ErrorCard error={createGithubIntegrationMutation.error} />

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
                loading={deleteMutation.isPending}
                onPress={() => deleteMutation.mutate({ repo_id: repoId })}
                theme="red"
              >
                <ButtonText>Delete Repository</ButtonText>
              </Button>
              <View grow>{isDirty && <Text>Unsaved changes</Text>}</View>
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
            </View>
          )}
        </Form.Submit>
      </View>
    </Form.RootProvider>
  )
}
