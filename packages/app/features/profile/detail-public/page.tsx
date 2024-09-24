import { Button, ButtonText } from 'app/ds/Button'
import { Image } from 'app/ds/Image'
import { Lucide } from 'app/ds/Lucide'
import { Modal, ModalBackdrop, ModalContent, ModalTrigger } from 'app/ds/Modal'
import { Page } from 'app/ds/Page'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { TextLink } from 'app/ds/TextLink'
import { View } from 'app/ds/View'
import { Calcom } from 'app/features/cal-com/cal-com'
import { fakeRepos } from 'app/features/home/fakeRepos'
import { RepoCard } from 'app/features/home/RepoCard'
import { imageLoader } from 'app/image/loader'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'
import { getConfig } from 'tamagui'
import { Highlight, themes } from 'prism-react-renderer'
import { LinkButton } from 'app/ds/Button/link'
import img from './fch.png'

const { useParams } = createParam<{ profileSlug: string }>()

export function ProfileDetailPublicPage() {
  const { params } = useParams()

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content>
          <Content profileSlug={params.profileSlug} />
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}

console.log('[tamagui-config]', getConfig())

function Content({ profileSlug }: { profileSlug: string }) {
  const profileQuery = api.profileBySlug_public.useQuery(
    { slug: profileSlug },
    {
      enabled: !!profileSlug,
    }
  )
  const calUserQuery = api.calUserByProfileSlug.useQuery(
    { profileSlug },
    {
      enabled: false && !!profileSlug, // this will be orgs
    }
  )
  if (!profileQuery.data) {
    return null
  }
  const profile = profileQuery.data
  const loader =
    profile.image_vendor && imageLoader[profile.image_vendor as keyof typeof imageLoader]
  const repositories = fakeRepos.filter((repo) => repo.user_name === profile.name)
  return (
    <Calcom.Provider profileSlug={profileSlug}>
      <View gap="$4">
        <View gap="$3" $gtMd={{ row: true }}>
          <View $gtMd={{ grow: true }}>
            <View aspectRatio={16 / 9} bg="$borderColor">
              {!!loader && !!profile.image_vendor_id && (
                <Image
                  fill
                  // loader={loader}
                  src={img}
                  alt={profile.name}
                  contentFit="cover"
                />
              )}
              <View stretch center>
                <View br="$rounded" box={75} bg="white" center pl={2}>
                  <Lucide.Play color="black" size={29} />
                </View>
              </View>
            </View>
          </View>
          <View $gtMd={{ width: '40%' }} gap="$4">
            <View>
              <Text bold fontSize={24} fontFamily="$body">
                {profile.name}
              </Text>
            </View>

            <Modal>
              <ModalTrigger>
                <Button themeInverse>
                  <ButtonText>Book a Call ($425+)</ButtonText>
                </Button>
              </ModalTrigger>
              <ModalContent>
                <ModalBackdrop />
                <View pointerEvents="box-none" grow center>
                  {calUserQuery.data && (
                    <Calcom.Booker
                      eventSlug="sixty-minutes-video"
                      username={calUserQuery.data?.username}
                    />
                  )}
                </View>
              </ModalContent>
            </Modal>
            <View gap="$3">
              <Text color="$color11" bold>
                About
              </Text>
              <Text>{profile.bio}</Text>
            </View>
          </View>
        </View>

        <View gap="$3">
          <Text bold>Repositories</Text>
          <View gap="$1">
            {repositories.map((template, i) => (
              <View key={template.repo_name} p="$3" bg="$color2" gap="$3" bw={2} boc="$borderColor">
                <View row gap="$3" ai="flex-start">
                  <View grow>
                    <Text color="$color11">{`#${i.toString().padStart(3, '0')} `}</Text>
                    <Text textDecorationLine="underline" textDecorationColor="transparent">
                      <Text bold>{template.repo_name}</Text>{' '}
                    </Text>

                    <TextLink href="https://twitter.com/fchollet" target="_blank">
                      <Text>
                        <Text gap="$1" color="$color11">
                          by {template.user_name}
                        </Text>
                      </Text>
                    </TextLink>
                  </View>
                  <View>
                    <LinkButton href="https://github.com/fchollet" target="_blank" als="flex-start">
                      <ButtonText>view code on github</ButtonText>
                    </LinkButton>
                  </View>
                </View>
                <Highlight
                  theme={themes.shadesOfPurple}
                  code={`import wandb
from wandb.integration.keras import WandbMetricsLogger, WandbModelCheckpoint
​
wandb.login()`}
                  language="python"
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre style={{ ...style, padding: '8px 0', maxWidth: 800, display: 'none' }}>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          <span style={{ width: 30, display: 'inline-block', paddingLeft: 6 }}>
                            {i + 1}
                          </span>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Calcom.Provider>
  )
}

const Main = styled(View, {})
