import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Link } from 'app/ds/Link'
import { Lucide } from 'app/ds/Lucide'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import {
  UpdateRepositoryModal,
  UpdateRepositoryModalContent,
  UpdateRepositoryModalTrigger,
} from 'app/features/repository/update/modal'
import { ApplyGatePage } from 'app/features/user/apply/page'
import { api } from 'app/trpc/client'

export function RepositoryListPage() {
  const repos = api.repo.myRepos.useQuery()

  return (
    <ApplyGatePage>
      <Page.Root>
        <Page.Scroll>
          <Page.Content gap="$3">
            {repos.data ? (
              <>
                <Card row ai="center">
                  <Card.Title flex={1}>My Repos</Card.Title>

                  <LinkButton absolute right={0} m="$2" href="/new" inverse>
                    <ButtonIcon icon={Lucide.Plus} />
                    <ButtonText>New</ButtonText>
                  </LinkButton>
                </Card>
                <View gap="$1">
                  {repos.data.map(({ repo, profile, github_repo_integration }) => {
                    return (
                      <Card
                        key={repo.id}
                        row
                        gap="$1"
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
                                    <Button als="flex-start" inverse>
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
                        <LinkButton href={`/@${profile.slug}/${repo.slug}`}>
                          <ButtonText>View</ButtonText>
                        </LinkButton>
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
                  {repos.data.length === 0 && (
                    <Card>
                      <Card.Title>Time to import your first repository!</Card.Title>
                    </Card>
                  )}
                </View>
              </>
            ) : (
              <ErrorCard error={repos.error} />
            )}
          </Page.Content>
        </Page.Scroll>
      </Page.Root>
    </ApplyGatePage>
  )
}
