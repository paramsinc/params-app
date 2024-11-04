import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { Card } from 'app/ds/Form/layout'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import testFile from 'app/features/repository/detail-public/python-parser/test-file'
import { createParam } from 'app/navigation/use-params'
import { Fragment, useEffect, useState } from 'app/react'
import { api } from 'app/trpc/client'
import Markdown from 'react-markdown'
import './github-markdown.css'
import './page.css'
import { Highlight, themes } from 'prism-react-renderer'
import { Image } from 'app/ds/Image'
import { Lucide } from 'app/ds/Lucide'

import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'
import { ColabIcon } from 'app/ds/icons/colab'
import { Breadcrumbs } from 'app/ds/Breadcrumbs'
import { useMedia } from 'app/ds/useMedia'
import { Tooltip } from 'app/ds/Tooltip'
import { Link } from 'app/ds/Link'
import { useCurrentPath } from 'app/navigation/use-pathname'
import { Modal } from 'app/ds/Modal'

const { useParams } = createParam<{
  profileSlug: string
  repoSlug: string
  tab: 'docs' | 'files'
  path?: string[]
}>()

export function RepositoryDetailPublicPage({ tab }: { tab?: 'docs' | 'files' }) {
  const {
    params: { profileSlug, repoSlug },
  } = useParams()
  return (
    <RepositoryDetailPublicPageContent profileSlug={profileSlug} repoSlug={repoSlug} tab={tab} />
  )
}

const Sidebar = styled(View, {
  gap: '$3',
  $gtLg: {
    width: 400,
    position: 'sticky' as any,
    top: 48 + 16,
    alignSelf: 'flex-start',
  },
  variants: {
    narrow: {
      true: {
        $gtLg: {
          width: 250,
        },
      },
    },
  } as const,
})

function RepositoryDetailPublicPageContent({
  profileSlug,
  repoSlug,
  tab = 'docs',
}: {
  profileSlug: string
  repoSlug: string
  tab?: 'docs' | 'files'
}) {
  const repoQuery = api.repoBySlug.useQuery({ profile_slug: profileSlug, repo_slug: repoSlug })

  const paramsJsonQuery = api.repo.paramsJson.useQuery({ profileSlug, repoSlug })
  const readmeQuery = api.repo.readme.useQuery({ profileSlug, repoSlug })

  if (!repoQuery.data) {
    return null
  }
  const repo = repoQuery.data
  const paramsJson = paramsJsonQuery.data

  const profileCard = (
    <Card>
      <View gap="$3" $lg={{ row: true, ai: 'center' }}>
        {!!repo.profile.image_vendor_id && (
          <View ai="center">
            <View br="$rounded" als="center" ov="hidden">
              <Image
                src={repo.profile.image_vendor_id}
                loader={repo.profile.image_vendor || 'raw'}
                {...(profileSlug === 'francois' && {
                  src: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Fchollet.jpg',
                  loader: 'raw',
                })}
                width={100}
                height={100}
                alt={repo.profile.name}
                contentFit="cover"
              />
            </View>
          </View>
        )}

        <View gap="$3" $lg={{ grow: true }}>
          <Text bold $gtLg={{ center: true }}>
            {repo.profile.name}
          </Text>

          <View gap="$1" row>
            <LinkButton $gtLg={{ grow: true }} href={`/@${repo.profile.slug}`}>
              <ButtonText>Profile</ButtonText>
            </LinkButton>

            <LinkButton $gtLg={{ grow: true }} href={`/@${repo.profile.slug}/book`} themeInverse>
              <ButtonText>Book a Call</ButtonText>
            </LinkButton>
          </View>
        </View>
      </View>

      {!!repo.profile.bio && (
        <View gap="$3" $lg={{ dsp: 'none' }}>
          <View h={2} bg="$borderColor" />
          <View gap="$2">
            <Text color="$color11" bold>
              About {repo.profile.name}
            </Text>

            <Text>{repo.profile.bio}</Text>
          </View>
        </View>
      )}
    </Card>
  )

  return (
    <Page.Root>
      <View
        zIndex={1}
        width="min(90%, 1600px)"
        left="min(10%, 100px)"
        margin="0 auto"
        absolute
        height="100vh"
        top={80}
        pointerEvents="none"
        transform="translate3d(0, 0, 0)"
        opacity={0.15}
        style={{
          filter: 'blur(100px) saturate(150%)',
          backgroundImage: `
      radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 0%),
      radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%),
      radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%),
      radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%),
      radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%),
      radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%),
      radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)
    `,
        }}
      />
      <Page.Scroll>
        <Page.Content maw="100%" gap="$3">
          <Card row gap="$3" flexWrap="wrap" jbtwn>
            <View flex={1}>
              <Text
                flexGrow={1}
                flexBasis={2}
                bold
                fontSize={18}
                $gtSm={{ fontSize: 24 }}
                fontFamily="$mono"
              >
                @{profileSlug}/{repo.slug}
              </Text>
            </View>
            <View row flexWrap="wrap" gap="$2">
              {repo.github_url != null && (
                <>
                  <ComingSoon>
                    <Button theme="yellow">
                      <ButtonIcon icon={ColabIcon} />
                      <ButtonText>Notebook</ButtonText>
                    </Button>
                  </ComingSoon>

                  <LinkButton
                    theme="blue"
                    href={(() => {
                      let url = repo.github_url

                      try {
                        const urlClass = new URL(repo.github_url)

                        // add /fork
                        urlClass.pathname += '/fork'
                        url = urlClass.toString()
                      } catch {}

                      return url
                    })()}
                  >
                    <ButtonIcon icon={Lucide.GitFork} />
                    <ButtonText>Fork</ButtonText>
                  </LinkButton>

                  <Button theme="pink">
                    <ButtonIcon icon={Lucide.Code} />
                    <ButtonText>Clone</ButtonText>
                  </Button>

                  {/* <LinkButton href={repo.github_url} target="_blank">
                    <ButtonIcon icon={Lucide.Github} />
                    <ButtonText>GitHub</ButtonText>
                  </LinkButton> */}
                </>
              )}
            </View>
          </Card>
          <View $gtLg={{ dsp: 'none' }}>{profileCard}</View>

          <View row bbw={1} bbc="$borderColor">
            <Link href={`/@${profileSlug}/${repoSlug}`}>
              <Tab active={tab === 'docs'}>
                <Text>Docs</Text>
              </Tab>
            </Link>

            <Link href={`/@${profileSlug}/${repoSlug}/files`}>
              <Tab active={tab === 'files'}>
                <Text>Files</Text>
              </Tab>
            </Link>
          </View>
          <>
            {tab === 'docs' && (
              <DocsPage profileSlug={profileSlug} repoSlug={repoSlug}>
                {profileCard}
              </DocsPage>
            )}
            {tab === 'files' && (
              <View $gtLg={{ grow: true }} gap="$3">
                <FilesPage profileSlug={profileSlug} repoSlug={repoSlug} />
              </View>
            )}
          </>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

function DocsPage({
  profileSlug,
  repoSlug,
  children,
}: {
  profileSlug: string
  repoSlug: string
  children: React.ReactNode
}) {
  const profileQuery = api.profileBySlug_public.useQuery({ profile_slug: profileSlug })
  const readmeQuery = api.repo.readme.useQuery({ profileSlug, repoSlug })
  const filesQuery = api.repo.files.useQuery({ profileSlug, repoSlug })
  const paramsJsonQuery = api.repo.paramsJson.useQuery({ profileSlug, repoSlug })

  const mainDocsFile = paramsJsonQuery.data?.docs.main.split('/')

  const {
    params: { path = mainDocsFile },
  } = useParams()

  const file = filesQuery.data?.[path?.join('/') ?? ''] ?? readmeQuery.data

  if (!profileQuery.data) {
    return null
  }
  const paramsJson = paramsJsonQuery.data
  const profile = profileQuery.data
  const videoCard = path?.join('/') === mainDocsFile?.join('/') && paramsJson?.docs.youtube && (
    <Modal>
      <Modal.Trigger>
        <View aspectRatio={16 / 9} bg="$borderColor" br="$3" ov="hidden" group cursor="pointer">
          {!!paramsJson.docs.youtube.thumbnail_url && (
            <Image
              fill
              src={paramsJson.docs.youtube.thumbnail_url}
              unoptimized
              alt={profile.name}
              contentFit="cover"
              sizes="(max-width: 1200px) 100vw, 60vw"
              priority
            />
          )}
          <View
            stretch
            center
            pointerEvents="none"
            animation="100ms"
            scale={1}
            $group-hover={{
              scale: 1.1,
            }}
            $group-press={{
              scale: 1,
            }}
          >
            <View br="$rounded" box={75} bg="white" center pl={2}>
              <Lucide.Play color="black" size={29} />
            </View>
          </View>
        </View>
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Backdrop />
        <Modal.Dialog autoHeight>
          <View aspectRatio={16 / 9}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${paramsJson.docs.youtube.video_id}?start=${
                paramsJson.docs.youtube.start_time ?? 0
              }&autoplay=1&vq=hd1080p;hd=1&modestbranding=1&autohide=1&showinfo=0&rel=0`}
              allowFullScreen
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              frameBorder="0"
              style={{
                outline: 'none',
              }}
            />
          </View>
        </Modal.Dialog>
      </Modal.Content>
    </Modal>
  )
  return (
    <View w="100%" gap="$3" $gtLg={{ row: true, gap: '$4', pt: '$3' }}>
      <Sidebar narrow dsp="none" $gtLg={{ display: 'flex' }}>
        <DocsSidebar profileSlug={profileSlug} repoSlug={repoSlug} />
      </Sidebar>
      <View gap="$3" $gtLg={{ grow: true }}>
        {videoCard}
        <View>
          {file ? (
            <MarkdownRenderer linkPrefix={`/@${profileSlug}/${repoSlug}/docs`}>
              {file}
            </MarkdownRenderer>
          ) : null}
        </View>
      </View>
      <Sidebar d="none" $gtLg={{ display: 'flex' }}>
        {children}
      </Sidebar>
    </View>
  )
}

function FilesPage({ profileSlug, repoSlug }: { profileSlug: string; repoSlug: string }) {
  const filesQuery = api.repo.files.useQuery({ profileSlug, repoSlug })

  const {
    params: { path },
  } = useParams()

  const files = filesQuery.data ?? {}

  const readmeFileName = Object.keys(files).find(
    (fileName) => fileName.toLowerCase() === 'readme.md'
  )

  const selectedFileName = path?.join('/')

  console.log('[files]', { selectedFileName, readmeFileName })

  const selectedFile =
    selectedFileName && selectedFileName in files ? files[selectedFileName] : null
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.md')) return Lucide.FileText
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return Lucide.FileCode
    if (fileName.endsWith('.json')) return Lucide.FileJson
    return Lucide.File
  }

  const language =
    languageByExtension[selectedFileName?.split('.').at(-1) ?? 'plaintext'] ?? 'plaintext'

  const sidebar = useMedia().gtSm

  const filesNode = (
    <View>
      {Object.keys(files)
        .sort()
        .map((fileName) => {
          const FileIcon = getFileIcon(fileName)
          return (
            <Link href={`/@${profileSlug}/${repoSlug}/files/${fileName}`} key={fileName}>
              <View
                flexDirection="row"
                alignItems="center"
                padding="$2"
                backgroundColor={selectedFileName === fileName ? '$backgroundFocus' : 'transparent'}
                hoverStyle={{ backgroundColor: '$backgroundHover' }}
                cursor="pointer"
              >
                <FileIcon size={18} color="$color" />
                <Text marginLeft="$2" numberOfLines={1} ellipsizeMode="middle" fontFamily="$mono">
                  {fileName}
                </Text>
              </View>
            </Link>
          )
        })}
    </View>
  )

  return (
    <View row>
      {sidebar && (
        <View width={250} borderRightWidth={1} borderColor="$borderColor" mr="$3">
          <Scroll>{filesNode}</Scroll>
        </View>
      )}
      <View grow>
        {selectedFile != null ? (
          <View gap="$3">
            <Breadcrumbs>
              <Link href={`/@${profileSlug}/${repoSlug}/files`}>
                <Breadcrumbs.Item>
                  <Breadcrumbs.Title>Files</Breadcrumbs.Title>
                </Breadcrumbs.Item>
              </Link>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Item>
                <Breadcrumbs.Title>{selectedFileName}</Breadcrumbs.Title>
              </Breadcrumbs.Item>
            </Breadcrumbs>
            <View>
              {language === 'markdown' ? (
                <MarkdownRenderer linkPrefix={`/@${profileSlug}/${repoSlug}/files`}>
                  {selectedFile}
                </MarkdownRenderer>
              ) : (
                <Codeblock lineNumbers content={selectedFile} language={language} />
              )}
            </View>
          </View>
        ) : sidebar ? (
          <Text>Select a file to view its contents</Text>
        ) : (
          <>{filesNode}</>
        )}
      </View>
    </View>
  )
}

const languageByExtension: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  md: 'markdown',
  json: 'json',
  plaintext: 'plaintext',
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
                <span
                  style={{ width: 50, display: 'inline-block', opacity: 0.8, userSelect: 'none' }}
                >
                  {i + 1}
                </span>
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

function DocsSidebar({ profileSlug, repoSlug }: { profileSlug: string; repoSlug: string }) {
  const paramsJsonQuery = api.repo.paramsJson.useQuery({ profileSlug, repoSlug })
  const {
    params: { path },
  } = useParams()

  if (!paramsJsonQuery.data) {
    return null
  }
  const paramsJson = paramsJsonQuery.data
  const selectedPage = path?.join('/') ?? paramsJson.docs.main

  const pages = Object.keys(paramsJson.docs.sidebar) // TODO support nested pages
  return (
    <Card p={0} gap={0} py="$2">
      <Text px="$3" bold py="$3" pt="$2" bbw={1} bbc="$borderColor">
        Documentation
      </Text>
      {pages.map((page) => {
        const pagePath = paramsJson.docs.sidebar[page]! // TODO support nested pages
        const isSelected = pagePath === selectedPage
        return (
          <Link href={`/@${profileSlug}/${repoSlug}/docs/${pagePath}`} key={page}>
            <Text
              py={'$2'}
              px="$3"
              bold={isSelected}
              color={isSelected ? '$color12' : '$color11'}
              als="flex-start"
              hoverStyle={{
                color: '$color12',
              }}
              lineHeight={18}
              animation="200ms"
              animateOnly={['color']}
            >
              {page}
            </Text>
          </Link>
        )
      })}
    </Card>
  )
}

function ComingSoon({ children, ...props }: React.ComponentProps<typeof Tooltip>) {
  return (
    <Tooltip {...props}>
      <Tooltip.Trigger>{children}</Tooltip.Trigger>
      <Tooltip.Content>
        <Text>Coming soon</Text>
      </Tooltip.Content>
    </Tooltip>
  )
}

function MarkdownRenderer({ children, linkPrefix }: { children: string; linkPrefix: string }) {
  const path = useCurrentPath()
  return (
    <Markdown
      className="markdown-body"
      components={{
        a(props) {
          const isAbsolute = props.href?.startsWith('http')
          let url = props.href
          if (!isAbsolute) {
            let href = props.href
            if (href?.startsWith('/')) {
              href = href.slice(1)
            }
            url = linkPrefix + '/' + href
          }
          return (
            <Link
              {...(props as any)}
              href={url ?? '#'}
              target={isAbsolute ? '_blank' : undefined}
            />
          )
        },
      }}
    >
      {children}
    </Markdown>
  )
}
