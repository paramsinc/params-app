import { Button, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { Card } from 'app/ds/Form/layout'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import testFile from 'app/features/repository/detail-public/python-parser/test-file'
import { createParam } from 'app/navigation/use-params'
import { Fragment } from 'app/react'
import { api } from 'app/trpc/client'
import Markdown from 'react-markdown'
import { dynamic } from 'app/helpers/dynamic'
// const SyntaxHighlighter = dynamic(() => import('react-syntax-highlighter/dist/esm/prism-light'), {
//   ssr: false,
// })
// import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './page.css'

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
          <Page.Content maw={850} gap="$4">
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
            <View gap="$4">
              {testFile.map((block, i) => {
                return (
                  <Fragment key={i}>
                    {block.language === 'markdown' ? (
                      i === 0 ? null : (
                        <View>
                          <Markdown
                            className="md"
                            components={{
                              p: (props) => (
                                <Text
                                  tag="p"
                                  fontFamily="$heading"
                                  mb="$1"
                                  children={props.children}
                                />
                              ),
                            }}
                          >
                            {block.content}
                          </Markdown>
                        </View>
                      )
                    ) : null}
                  </Fragment>
                )
              })}
            </View>
          </Page.Content>
          <View grow />
        </View>
      </Page.Scroll>
    </Page.Root>
  )
}
