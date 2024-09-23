import { Empty, EmptyCard, EmptyCardDescription, EmptyCardTitle } from 'app/ds/Empty'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { api } from 'app/trpc/client'

export function ProfilesListContent() {
  const myProfiles = api.myProfiles.useQuery()

  if (myProfiles.data?.length === 0) {
    return (
      <Empty>
        <EmptyCard>
          <EmptyCardTitle>Let's create your developer profile.</EmptyCardTitle>
          <EmptyCardDescription>
            Create your developer profile to start sharing repositories.
          </EmptyCardDescription>
        </EmptyCard>
      </Empty>
    )
  }

  return (
    <Scroll>
      {myProfiles.data?.map((profile) => {
        return (
          <View key={profile.id} p="$3">
            <View row>
              <Text bold>{profile.name}</Text>
            </View>
          </View>
        )
      })}
    </Scroll>
  )
}
