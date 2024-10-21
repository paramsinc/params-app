import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { Card } from 'app/ds/Form/layout'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import testFile from 'app/features/repository/detail-public/python-parser/test-file'
import { createParam } from 'app/navigation/use-params'
import { Fragment, useState } from 'app/react'
import { api } from 'app/trpc/client'
import Markdown from 'react-markdown'
import { dynamic } from 'app/helpers/dynamic'
import './github-markdown.css'
import './page.css'
import { Highlight, themes } from 'prism-react-renderer'
import { Image } from 'app/ds/Image'
import { Lucide } from 'app/ds/Lucide'
import { Tabs } from 'app/ds/Tabs'
import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'

const { useParams } = createParam<{
  profileSlug: string
  repoSlug: string
  tab: 'readme' | 'files'
}>()

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
  const {
    params: { tab = 'readme' },
    setParams,
  } = useParams()

  const repoQuery = api.repoBySlug.useQuery({ profile_slug: profileSlug, repo_slug: repoSlug })
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  if (!repoQuery.data) {
    return null
  }
  const repo = repoQuery.data
  const profile = repo.profile

  // Mock files dictionary
  const files = {
    'README.md': '# This is a README file\n\nWelcome to the project!',
    'index.ts': 'console.log("Hello, world!");',
    'Button.tsx': 'export const Button = () => <button>Click me</button>;',
    'package.json': '{\n  "name": "my-project",\n  "version": "1.0.0"\n}',
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.md')) return Lucide.FileText
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return Lucide.FileCode
    if (fileName.endsWith('.json')) return Lucide.FileJson
    return Lucide.File
  }

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content maw="100%" gap="$3" $gtLg={{ row: true, gap: '$4' }}>
          <View
            gap="$3"
            $gtLg={{
              width: 400,
              position: 'sticky' as any,
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
                <Text flexGrow={1} flexBasis={2} bold fontSize={24} fontFamily="$mono">
                  @{profileSlug}/{repo.slug}
                </Text>
              </View>
            </Card>
            <View row flexWrap="wrap" gap="$2">
              {repo.github_url != null && (
                <LinkButton theme="blue" href={repo.github_url}>
                  <ButtonIcon icon={Lucide.Forklift} />
                  <ButtonText>Fork</ButtonText>
                </LinkButton>
              )}
              <Button theme="pink">
                <ButtonIcon icon={Lucide.Code} />
                <ButtonText>Clone</ButtonText>
              </Button>
              {repo.github_url != null && (
                <LinkButton href={repo.github_url} target="_blank">
                  <ButtonIcon icon={Lucide.Github} />
                  <ButtonText>GitHub</ButtonText>
                </LinkButton>
              )}
            </View>

            <View row bbw={1} bbc="$borderColor">
              <Tab active={tab === 'readme'} onPress={() => setParams({ tab: 'readme' })}>
                <Text>README</Text>
              </Tab>
              <Tab active={tab === 'files'} onPress={() => setParams({ tab: 'files' })}>
                <Text>Files</Text>
              </Tab>
            </View>

            {tab === 'readme' && (
              <View gap="$3">
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
                <View className="markdown-body">
                  {testFile.map((block, i) => {
                    return (
                      <Fragment key={i}>
                        {block.language === 'markdown' ? (
                          i === 0 ? null : (
                            <Markdown>{block.content}</Markdown>
                          )
                        ) : (
                          <Codeblock content={block.content} language={block.language} />
                        )}
                      </Fragment>
                    )
                  })}
                </View>
              </View>
            )}

            {tab === 'files' && (
              <View row>
                <View width={250} borderRightWidth={1} borderColor="$borderColor">
                  <Scroll>
                    {Object.keys(files).map((fileName) => {
                      const FileIcon = getFileIcon(fileName)
                      return (
                        <View
                          key={fileName}
                          onPress={() => setSelectedFile(fileName)}
                          flexDirection="row"
                          alignItems="center"
                          padding="$2"
                          marginBottom="$1"
                          backgroundColor={
                            selectedFile === fileName ? '$backgroundFocus' : 'transparent'
                          }
                          hoverStyle={{ backgroundColor: '$backgroundHover' }}
                          cursor="pointer"
                        >
                          <FileIcon size={18} color="$color" />
                          <Text
                            marginLeft="$2"
                            numberOfLines={1}
                            ellipsizeMode="middle"
                            fontFamily="$mono"
                          >
                            {fileName}
                          </Text>
                        </View>
                      )
                    })}
                  </Scroll>
                </View>
                <View grow pl="$3">
                  {selectedFile ? (
                    <View>
                      <Codeblock
                        content={files[selectedFile]}
                        language={
                          selectedFile.endsWith('.ts') || selectedFile.endsWith('.tsx')
                            ? 'typescript'
                            : 'plaintext'
                        }
                      />
                    </View>
                  ) : (
                    <Text>Select a file to view its contents</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

function Codeblock({
  content,
  language,
  lineNumbers = false,
}: {
  content: string
  language: string
  lineNumbers?: boolean
}) {
  return (
    <Highlight theme={themes.vsDark} code={content} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          style={{
            ...style,
            padding: '16px',
            borderRadius: 12,
            marginBottom: 16,
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap',
          }}
          className={className}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {lineNumbers && (
                <span style={{ width: 30, display: 'inline-block', paddingLeft: 12 }}>{i + 1}</span>
              )}
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

const Tab = styled(View, {
  p: '$2',
  bg: '$colorTransparent',
  variants: {
    active: {
      true: {
        bg: '$color5',
      },
      false: {},
    },
  } as const,
  hoverStyle: {
    bg: '$color4',
  },
  btrr: '$3',
  btlr: '$3',
  cur: 'pointer',
})
