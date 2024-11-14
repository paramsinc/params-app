import { Button, ButtonText } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Link } from 'app/ds/Link'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import {
  UpdateRepositoryModal,
  UpdateRepositoryModalContent,
  UpdateRepositoryModalTrigger,
} from 'app/features/repository/update/modal'
import { api } from 'app/trpc/client'

export function RepositoryListPage() {
  const repos = api.repo.myRepos.useQuery()

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content>
          {repos.data ? (
            <View gap="$1">
              {repos.data.map(({ repo, profile, github_repo_integration }) => {
                return (
                  <Card
                    key={repo.id}
                    row
                    gap="$3"
                    ai="center"
                    theme={github_repo_integration ? undefined : 'red'}
                  >
                    <View grow>
                      <View gap="$2">
                        <Link href={`/@${profile.slug}/${repo.slug}`}>
                          <Card.Title fontFamily="$mono">
                            @{profile.slug}/{repo.slug}
                          </Card.Title>
                        </Link>
                        {!github_repo_integration ? (
                          <>
                            <Card.Description color="$color11">
                              GitHub Repo Missing
                            </Card.Description>

                            <UpdateRepositoryModal>
                              <UpdateRepositoryModalTrigger>
                                <Button als="flex-start" themeInverse>
                                  <ButtonText>Connect GitHub</ButtonText>
                                </Button>
                              </UpdateRepositoryModalTrigger>

                              <UpdateRepositoryModalContent repoId={repo.id} />
                            </UpdateRepositoryModal>
                          </>
                        ) : (
                          <Card.Description color="$green11">GitHub Sync'd</Card.Description>
                        )}
                      </View>
                    </View>
                    <UpdateRepositoryModal>
                      <UpdateRepositoryModalTrigger>
                        <Button>
                          <ButtonText>Edit</ButtonText>
                        </Button>
                      </UpdateRepositoryModalTrigger>

                      <UpdateRepositoryModalContent repoId={repo.id} />
                    </UpdateRepositoryModal>
                  </Card>
                )
              })}
            </View>
          ) : (
            <ErrorCard error={repos.error} />
          )}
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}
