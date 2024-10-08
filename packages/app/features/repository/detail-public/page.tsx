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
const SyntaxHighlighter = dynamic(() => import('react-syntax-highlighter/dist/esm/prism-light'), {
  ssr: false,
})
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './page.css'
import { Highlight, themes } from 'prism-react-renderer'
import { Image } from 'app/ds/Image'
import { Lucide } from 'app/ds/Lucide'

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
  const profile = repo.profile
  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content maw="100%" gap="$3" $gtLg={{ row: true, gap: '$4' }}>
          <View
            gap="$3"
            $gtLg={{
              width: 400,
              position: 'sticky',
              top: 48 + 32,
              left: 0,
              alignSelf: 'flex-start',
            }}
          >
            <Card>
              {!!repo.profile.image_vendor_id && (
                <View ai="center">
                  <View br="$rounded" als="center" ov="hidden">
                    <Image
                      src={repo.profile.image_vendor_id}
                      loader={repo.profile.image_vendor || 'raw'}
                      src="https://upload.wikimedia.org/wikipedia/commons/7/71/Fchollet.jpg"
                      loader="raw"
                      width={100}
                      height={100}
                      alt={repo.profile.name}
                      contentFit="cover"
                    />
                  </View>
                </View>
              )}

              <Text center bold>
                {repo.profile.name}
              </Text>

              <View row gap="$1">
                <LinkButton grow href={`/@${repo.profile.slug}`}>
                  <ButtonText>Profile</ButtonText>
                </LinkButton>

                <LinkButton grow href={`/@${repo.profile.slug}/book`} themeInverse>
                  <ButtonText>Book a Call</ButtonText>
                </LinkButton>
              </View>
              {!!repo.profile.bio && (
                <>
                  <View h={2} bg="$borderColor" />
                  <View gap="$2">
                    <Text color="$color11" bold>
                      About {repo.profile.name}
                    </Text>

                    <Text>{repo.profile.bio}</Text>
                  </View>
                </>
              )}
            </Card>
          </View>
          <View $gtLg={{ grow: true, maxWidth: 900 }} gap="$3">
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
            <View aspectRatio={16 / 9} bg="$borderColor" br="$3" ov="hidden">
              {!!profile.image_vendor && !!profile.image_vendor_id && (
                <Image
                  fill
                  loader={profile.image_vendor}
                  src={profile.image_vendor_id}
                  alt={profile.name}
                  contentFit="cover"
                  sizes="(max-width: 1200px) 100vw, 60vw"
                  priority
                  style={{
                    transform: 'rotateY(180deg)',
                  }}
                />
              )}
              <View stretch center>
                <View br="$rounded" box={75} bg="white" center pl={2}>
                  <Lucide.Play color="black" size={29} />
                </View>
              </View>
            </View>
            <View>
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
                                  mb="$3"
                                  fontSize={16}
                                  children={props.children}
                                  color="$color12"
                                  display="block"
                                />
                              ),
                              code: (props) => (
                                <Text
                                  tag="code"
                                  fontFamily="$mono"
                                  fontSize={16}
                                  children={props.children}
                                  color="$color12"
                                />
                              ),
                            }}
                          >
                            {block.content}
                          </Markdown>
                        </View>
                      )
                    ) : (
                      <>
                        <Highlight
                          theme={themes.vsDark}
                          code={block.content}
                          language={block.language}
                        >
                          {({ className, style, tokens, getLineProps, getTokenProps }) => (
                            <pre
                              style={{
                                ...style,
                                padding: '16px',
                                borderRadius: 12,
                                marginBottom: 16,
                              }}
                            >
                              {tokens.map((line, i) => (
                                <div key={i} {...getLineProps({ line })}>
                                  {/* <span
                                    style={{ width: 30, display: 'inline-block', paddingLeft: 12 }}
                                  >
                                    {i + 1}
                                  </span> */}
                                  {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                  ))}
                                </div>
                              ))}
                            </pre>
                          )}
                        </Highlight>
                        {/* <SyntaxHighlighter language="python" style={dark}>
                          {block.content}
                        </SyntaxHighlighter> */}
                      </>
                    )}
                  </Fragment>
                )
              })}
            </View>
          </View>
          {/* <View $gtMd={{ grow: true }} /> */}
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}
