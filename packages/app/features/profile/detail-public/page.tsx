import { Button, ButtonText } from 'app/ds/Button'
import { Modal, ModalBackdrop, ModalContent, ModalTrigger } from 'app/ds/Modal'
import { Page } from 'app/ds/Page'
import { styled } from 'app/ds/styled'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { Calcom } from 'app/features/cal-com/cal-com'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'
import { getConfig } from 'tamagui'

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
  return (
    <Calcom.Provider profileSlug={profileSlug}>
      <View gap="$4">
        <View gap="$3" $gtMd={{ row: true }}>
          <View $gtMd={{ grow: true }}>
            <View aspectRatio={16 / 9} bg="$borderColor"></View>
          </View>
          <View $gtMd={{ width: '40%' }} gap="$4">
            <View>
              <Text bold fontSize={24}>
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
          </View>
        </View>
      </View>
    </Calcom.Provider>
  )
}

const Main = styled(View, {})
