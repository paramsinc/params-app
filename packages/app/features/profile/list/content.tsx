import { Empty, EmptyCard, EmptyCardDescription, EmptyCardTitle } from 'app/ds/Empty'
import { Link } from 'app/ds/Link'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import {
  NewProfileModal,
  NewProfileModalContent,
  NewProfileModalTrigger,
} from 'app/features/profile/new/modal'
import { api } from 'app/trpc/client'

export function ProfilesListContent() {
  const myProfiles = api.myProfiles.useQuery()

  if (myProfiles.data?.length === 0) {
    return (
      <Empty>
        <NewProfileModal>
          <NewProfileModalTrigger>
            <EmptyCard>
              <EmptyCardTitle>Let's create your developer profile.</EmptyCardTitle>
              <EmptyCardDescription>
                Create your developer profile to start sharing repositories.
              </EmptyCardDescription>
              <Text>New</Text>
            </EmptyCard>
          </NewProfileModalTrigger>
          <NewProfileModalContent />
        </NewProfileModal>
      </Empty>
    )
  }

  return (
    <Scroll>
      {myProfiles.data?.map((profile) => {
        return (
          <Link key={profile.id} href={`/@${profile.slug}`}>
            <View row gap="$3" p="$3" bbw={1} boc="$borderColor">
              <View>
                <Text bold>{profile.name}</Text>
                <Text color="$color11">@{profile.slug}</Text>
              </View>
            </View>
          </Link>
        )
      })}
    </Scroll>
  )
}
