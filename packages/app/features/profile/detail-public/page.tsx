import { Modal, ModalBackdrop, ModalContent, ModalTrigger } from 'app/ds/Modal'
import { Page } from 'app/ds/Page'
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
      enabled: !!profileSlug,
    }
  )
  if (!profileQuery.data) {
    return null
  }
  const profile = profileQuery.data
  return (
    <Calcom.Provider profileSlug={profileSlug}>
      <View gap="$4">
        <View>
          <Text bold>{profile.name}</Text>
          <Text>@{profile.slug}</Text>
        </View>

        <View h={2} bg="$borderColor" />
        <Modal>
          <ModalTrigger>
            <Text>Book a call</Text>
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
      <Calcom.CalendarSettings />
    </Calcom.Provider>
  )
}
