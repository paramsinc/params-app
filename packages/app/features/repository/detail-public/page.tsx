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
import './page.css'
import { Codeblock, languageByExtension } from 'app/ds/Codeblock'
import { Image } from 'app/ds/Image'
import { Lucide } from 'app/ds/Lucide'

import { Scroll } from 'app/ds/Scroll'
import { styled } from 'app/ds/styled'
import { ColabIcon } from 'app/ds/icons/colab'
import { Breadcrumbs } from 'app/ds/Breadcrumbs'
import { useMedia } from 'app/ds/useMedia'
import { Tooltip } from 'app/ds/Tooltip'
import { Link } from 'app/ds/Link'
import { Modal } from 'app/ds/Modal'
import { ErrorCard } from 'app/ds/Error/card'
import { MarkdownRenderer } from 'app/features/repository/detail-public/MarkdownRenderer'
import useToast from 'app/ds/Toast'

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
    // position: 'sticky' as any,
    // top: 48 + 16,
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
  const repoQuery = api.repo.bySlug_public.useQuery({
    profile_slug: profileSlug,
    repo_slug: repoSlug,
  })
  let profileCard = <ProfileCards profileSlug={profileSlug} repoSlug={repoSlug} />

  const paramsJsonQuery = api.repo.paramsJson.useQuery({
    profile_slug: profileSlug,
    repo_slug: repoSlug,
  })

  if (!repoQuery.data) {
    return null
  }
  const repo = repoQuery.data
  const paramsJson = paramsJsonQuery.data

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
          <Card row gap="$3" flexWrap="wrap" jbtwn ai="center">
            <View flex={1}>
              <Text
                flexGrow={1}
                flexBasis={2}
                bold
                fontSize={18}
                // $gtSm={{ fontSize: 24 }}
                fontFamily="$mono"
              >
                @{profileSlug}/{repo.slug}
              </Text>
            </View>
            <View row flexWrap="wrap" gap="$2">
              {!!paramsJson?.enable_notebook && (
                <RunNotebookButton profileSlug={profileSlug} repoSlug={repoSlug} />
              )}
              {repo.github_url != null && (
                <>
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

                  {/* <Button theme="pink">
                    <ButtonIcon icon={Lucide.Code} />
                    <ButtonText>Clone</ButtonText>
                  </Button> */}

                  {repo.github_repo && (
                    <LinkButton
                      href={[
                        `https://github.com/${repo.github_repo.github_repo_owner}/${repo.github_repo.github_repo_name}/tree/${repo.github_repo.default_branch}`,
                        repo.github_repo.path_to_code,
                      ]
                        .filter(Boolean)
                        .join('/')}
                      target="_blank"
                      square
                    >
                      <ButtonIcon icon={Lucide.Github} />
                    </LinkButton>
                  )}
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
                <GitHubFilesPage profileSlug={profileSlug} repoSlug={repoSlug} />
              </View>
            )}
          </>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

function ProfileCards({ profileSlug, repoSlug }: { profileSlug: string; repoSlug: string }) {
  const bookableProfilesQuery = api.repo.bookableProfiles_public.useQuery({
    profile_slug: profileSlug,
    repo_slug: repoSlug,
  })

  return (
    <View gap="$2">
      {bookableProfilesQuery.data?.map((profile) => {
        return (
          <Card>
            <View gap="$3" $lg={{ row: true, ai: 'center' }}>
              <View ai="center">
                <View
                  als="center"
                  ov="hidden"
                  width="100%"
                  aspectRatio={16 / 9}
                  br="$2"
                  overflow="hidden"
                >
                  {!!profile.image_vendor_id && (
                    <Image
                      src={profile.image_vendor_id}
                      loader={profile.image_vendor || 'raw'}
                      sizes="300px"
                      fill
                      alt={profile.name}
                      contentFit="cover"
                    />
                  )}
                </View>
              </View>

              <View gap="$3" $lg={{ grow: true }}>
                <Text bold $gtLg={{ center: true }}>
                  {profile.name}
                </Text>

                <Text $gtLg={{ center: true }}>{profile.short_bio}</Text>

                <View gap="$1" row>
                  <LinkButton $gtLg={{ grow: true }} href={`/@${profile.slug}`}>
                    <ButtonText>Profile</ButtonText>
                  </LinkButton>

                  <LinkButton
                    $gtLg={{ grow: true }}
                    href={`/@${profile.slug}/book?repoSlug=${repoSlug}`}
                    inverse
                  >
                    <ButtonText>Book a Call</ButtonText>
                  </LinkButton>
                </View>
              </View>
            </View>

            {!!profile.bio && (
              <View gap="$3" $lg={{ dsp: 'none' }}>
                <View h={2} bg="$borderColor" />
                <View gap="$2">
                  <Text color="$color11" bold>
                    About {profile.name}
                  </Text>

                  {!!profile.bio && (
                    <MarkdownRenderer linkPrefix={`/@${profileSlug}/${repoSlug}`}>
                      {profile.bio}
                    </MarkdownRenderer>
                  )}
                </View>
              </View>
            )}
          </Card>
        )
      })}
    </View>
  )
}

function RunNotebookButton({ profileSlug, repoSlug }: { profileSlug: string; repoSlug: string }) {
  const { toast } = useToast()

  const mutation = api.github.generateNotebook.useMutation({
    onSuccess(notebook, variables, context) {
      toast({
        title: 'Notebook generated',
        message: 'Downloading...',
        preset: 'done',
      })
      // Create a blob from the notebook JSON
      const blob = new Blob([JSON.stringify(notebook, null, 2)], {
        type: 'application/x-ipynb+json',
      })

      // Create a URL for the blob
      const url = URL.createObjectURL(blob)

      // Create a temporary link element
      const link = document.createElement('a')
      link.href = url
      link.download = `${variables.repo_slug}.ipynb` // Use repo slug for filename

      // Append link to body, click it, and clean up
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Release the blob URL
      URL.revokeObjectURL(url)
    },
  })

  return (
    <Button
      theme="yellow"
      onPress={() => mutation.mutate({ profile_slug: profileSlug, repo_slug: repoSlug })}
      loading={mutation.isPending}
    >
      <ButtonIcon icon={ColabIcon} />
      <ButtonText>Notebook</ButtonText>
    </Button>
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
  const readmeQuery = api.repo.readme.useQuery({ profile_slug: profileSlug, repo_slug: repoSlug })
  const paramsJsonQuery = api.repo.paramsJson.useQuery({
    profile_slug: profileSlug,
    repo_slug: repoSlug,
  })

  const mainDocsFilePath = paramsJsonQuery.data?.docs.main.split('/')

  const { params } = useParams()

  let path = params.path
  if (!path?.length) {
    path = mainDocsFilePath
  }

  const filesQuery = api.github.repoFiles.useQuery({
    profile_slug: profileSlug,
    repo_slug: repoSlug,
    path: path?.join('/'),
  })

  const filePath = path?.join('/')

  const file =
    typeof filesQuery.data == 'string' || filesQuery.isPending ? filesQuery.data : readmeQuery.data

  const fileKeys = Object.keys(paramsJsonQuery.data?.docs.sidebar ?? {})

  const fileIndex = Object.values(paramsJsonQuery.data?.docs.sidebar ?? {}).indexOf(filePath ?? '')

  const nextFileName = fileKeys[fileIndex + 1]
  const prevFileName = fileKeys[fileIndex - 1]

  const nextFilePath = nextFileName ? paramsJsonQuery.data?.docs.sidebar?.[nextFileName] : null
  const prevFilePath = prevFileName ? paramsJsonQuery.data?.docs.sidebar?.[prevFileName] : null

  if (!profileQuery.data) {
    return null
  }
  const paramsJson = paramsJsonQuery.data
  const profile = profileQuery.data
  const videoCard = path?.join('/') === mainDocsFilePath?.join('/') && paramsJson?.docs.youtube && (
    <Modal>
      <Modal.Trigger>
        <View
          zi={1}
          aspectRatio={16 / 9}
          bg="$borderColor"
          br="$3"
          ov="hidden"
          group
          cursor="pointer"
        >
          <Image
            fill
            src={
              paramsJson.docs.youtube.thumbnail_url ??
              `https://img.youtube.com/vi/${paramsJson.docs.youtube.video_id}/0.jpg`
            }
            unoptimized
            alt={profile.name}
            contentFit="cover"
            sizes="(max-width: 1200px) 100vw, 60vw"
            priority
          />
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
          {typeof file === 'string' ? (
            <MarkdownRenderer linkPrefix={`/@${profileSlug}/${repoSlug}/docs`}>
              {file}
            </MarkdownRenderer>
          ) : null}
        </View>
        <View row gap="$3" jc="space-between">
          <View>
            {prevFilePath && (
              <Link href={`/@${profileSlug}/${repoSlug}/docs/${prevFilePath}`}>
                <Button>
                  <ButtonIcon icon={Lucide.ArrowLeft} />
                  <ButtonText>{prevFileName ?? 'Previous'}</ButtonText>
                </Button>
              </Link>
            )}
          </View>
          {nextFilePath && (
            <Link href={`/@${profileSlug}/${repoSlug}/docs/${nextFilePath}`}>
              <Button>
                <ButtonIcon icon={Lucide.ArrowRight} />
                <ButtonText>{nextFileName ?? 'Next'}</ButtonText>
              </Button>
            </Link>
          )}
        </View>
      </View>
      <Sidebar d="none" $gtLg={{ display: 'flex' }}>
        {children}
      </Sidebar>
    </View>
  )
}

function GitHubFilesPage({ profileSlug, repoSlug }: { profileSlug: string; repoSlug: string }) {
  const {
    params: { path },
  } = useParams()
  const filesQuery = api.github.repoFiles.useQuery({
    profile_slug: profileSlug,
    repo_slug: repoSlug,
    path: path?.join('/'),
  })
  const treeQuery = api.repo.tree.useQuery({ profile_slug: profileSlug, repo_slug: repoSlug })

  const selectedFilePath = path?.join('/')

  const selectedFile = typeof filesQuery.data === 'string' ? filesQuery.data : null
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.md')) return Lucide.FileText
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return Lucide.FileCode
    if (fileName.endsWith('.json')) return Lucide.FileJson
    if (!fileName.includes('.')) return Lucide.Folder
    return Lucide.File
  }

  const language =
    languageByExtension[selectedFilePath?.split('.').at(-1) ?? 'plaintext'] ?? 'plaintext'

  const sidebar = useMedia().gtSm

  if (!treeQuery.data) {
    return <ErrorCard error={filesQuery.error ?? treeQuery.error} />
  }
  const tree = treeQuery.data

  const readmeFileName = tree.find((r) => r.path.toLowerCase() === 'readme.md')?.path

  console.log('[files]', { selectedFileName: selectedFilePath, readmeFileName, tree })
  const filesNode = (
    <View>
      {tree
        .sort((a, b) => a.path.split('/').pop()!.localeCompare(b.path.split('/').pop()!))
        .map((file) => {
          const FileIcon = getFileIcon(file.path)
          const filename = file.path.split('/').pop()

          const isInCurrentDirectory = (filePath: string, urlPath: string[] | undefined) => {
            if (!urlPath?.length) {
              return !filePath.includes('/')
            }

            const currentDir = urlPath.join('/')

            const hasSelectedFile = urlPath.at(-1)?.includes('.')

            if (hasSelectedFile) {
              // if i select /users/file.tsx,
              // then the sidebar should be as if the /users was the url
              return isInCurrentDirectory(filePath, urlPath.slice(0, -1))
            }

            // File must:
            // 1. Start with current directory path
            // 2. Not have any additional subdirectories after current dir
            // 3. Not be the current directory itself
            return (
              filePath.startsWith(currentDir + '/') &&
              !filePath.slice(currentDir.length + 1).includes('/') &&
              filePath !== currentDir
            )
          }
          if (!isInCurrentDirectory(file.path, path)) {
            return null
          }

          return (
            <Link href={`/@${profileSlug}/${repoSlug}/files/${file.path}`} key={file.path}>
              <View
                flexDirection="row"
                alignItems="center"
                padding="$2"
                backgroundColor={
                  selectedFilePath === file.path ? '$backgroundFocus' : 'transparent'
                }
                hoverStyle={{ backgroundColor: '$backgroundHover' }}
                cursor="pointer"
              >
                <FileIcon size={18} color="$color" />
                <Text marginLeft="$2" numberOfLines={1} ellipsizeMode="middle" fontFamily="$mono">
                  {filename}
                </Text>
              </View>
            </Link>
          )
        })}
    </View>
  )

  const isImageFilename = ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(
    path?.at(-1)?.split('.').at(-1) ?? '__none'
  )

  return (
    <View row>
      {sidebar && (
        <View width={250} borderRightWidth={1} borderColor="$borderColor" mr="$3">
          <Scroll>{filesNode}</Scroll>
        </View>
      )}
      <View grow gap="$3">
        {!!path?.length && (
          <View>
            <Scroll horizontal>
              <Breadcrumbs>
                <Link href={`/@${profileSlug}/${repoSlug}/files`}>
                  <Breadcrumbs.Item>
                    <Breadcrumbs.Title>Files</Breadcrumbs.Title>
                  </Breadcrumbs.Item>
                </Link>
                {path?.map((chunk, i) => {
                  const isLast = i === path.length - 1
                  const baseHref = `/@${profileSlug}/${repoSlug}/files`
                  let href = `${baseHref}/${path.slice(0, i + 1).join('/')}`

                  if (isLast) {
                    href = `${baseHref}/${path.slice(0, i).join('/')}`
                  }
                  return (
                    <Fragment key={i}>
                      <Breadcrumbs.Separator />

                      <Link href={href}>
                        <Breadcrumbs.Item>
                          <Breadcrumbs.Title>{chunk}</Breadcrumbs.Title>
                        </Breadcrumbs.Item>
                      </Link>
                    </Fragment>
                  )
                })}
              </Breadcrumbs>
            </Scroll>
          </View>
        )}
        {selectedFile != null ? (
          <View gap="$3">
            <View>
              {isImageFilename ? null : language === 'markdown' ? (
                <MarkdownRenderer linkPrefix={`/@${profileSlug}/${repoSlug}/files`}>
                  {selectedFile}
                </MarkdownRenderer>
              ) : (
                <Codeblock lineNumbers content={selectedFile} language={language} />
              )}
            </View>
          </View>
        ) : sidebar ? null : (
          <>{filesNode}</>
        )}
      </View>
    </View>
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
  const paramsJsonQuery = api.repo.paramsJson.useQuery({
    profile_slug: profileSlug,
    repo_slug: repoSlug,
  })
  const {
    params: { path },
  } = useParams()

  if (paramsJsonQuery.data === null) {
    return <Text>Missing params.json file</Text>
  }

  if (!paramsJsonQuery.data) {
    return <ErrorCard error={paramsJsonQuery.error} />
  }
  const paramsJson = paramsJsonQuery.data
  const selectedPage = path?.join('/') ?? paramsJson.docs.main

  let pages = Object.keys(paramsJson.docs.sidebar ?? {}) // TODO support nested pages

  return (
    <Card p={0} gap={0}>
      <Text px="$3" bold py="$3">
        Documentation
      </Text>
      {pages.length > 0 && (
        <>
          <View btw={1} boc="$borderColor" py="$2">
            {pages.map((page) => {
              const pagePath = paramsJson.docs.sidebar?.[page]
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
                    textTransform="capitalize"
                  >
                    {page.replace(/_/g, ' ')}
                  </Text>
                </Link>
              )
            })}
          </View>
        </>
      )}
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
