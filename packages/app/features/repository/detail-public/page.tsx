import { Button, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { Card } from 'app/ds/Form/layout'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'

const { useParams } = createParam<{ profileSlug: string; repoSlug: string }>()

export function RepositoryDetailPublicPage() {
  const {
    params: { profileSlug, repoSlug },
  } = useParams()
  return <RepositoryDetailPublicPageContent profileSlug={profileSlug} repoSlug={repoSlug} />
}

function RepositoryDetailPublicPageContent({
  profileSlug,
  repoSlug,
}: {
  profileSlug: string
  repoSlug: string
}) {
  const repoQuery = api.repoBySlug.useQuery({ profile_slug: profileSlug, repo_slug: repoSlug })
  if (!repoQuery.data) {
    return null
  }
  const repo = repoQuery.data
  return (
    <Page.Root>
      <Page.Scroll>
        <View row>
          <View grow />
          <Page.Content maw={850}>
            <Card>
              <View row ai="center">
                <Text flexGrow={1} flexBasis={2} bold fontSize={24}>
                  @{profileSlug}/{repo.slug}
                </Text>
                {repo.github_url != null && (
                  <LinkButton href={repo.github_url} target="_blank">
                    <ButtonText>GitHub</ButtonText>
                  </LinkButton>
                )}
              </View>
            </Card>
          </Page.Content>
          <View grow />
        </View>
      </Page.Scroll>
    </Page.Root>
  )
}
