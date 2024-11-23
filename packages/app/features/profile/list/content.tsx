import { Button, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { Empty, EmptyCard, EmptyCardDescription, EmptyCardTitle } from 'app/ds/Empty'
import { ErrorCard } from 'app/ds/Error/card'
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
  const newProfileButton = (
    <NewProfileModal>
      <NewProfileModalTrigger>
        <Button themeInverse>
          <ButtonText>Create Profile</ButtonText>
        </Button>
      </NewProfileModalTrigger>
      <NewProfileModalContent />
    </NewProfileModal>
  )

  if (!myProfiles.data) {
    return (
      <Empty>
        <EmptyCard>
          <EmptyCardTitle>Loading profiles...</EmptyCardTitle>
          <ErrorCard error={myProfiles.error} />
        </EmptyCard>
      </Empty>
    )
  }

  if (myProfiles.data?.length === 0) {
    return (
      <Empty>
        <EmptyCard>
          <EmptyCardTitle>Let's create your developer profile.</EmptyCardTitle>
          <EmptyCardDescription>
            Create your developer profile to share your code and get booked.
          </EmptyCardDescription>
          {newProfileButton}
        </EmptyCard>
      </Empty>
    )
  }

  return (
    <Scroll>
      <View py="$2" px="$3" bbw={1} boc="$borderColor" ai="flex-end">
        {newProfileButton}
      </View>
      {myProfiles.data?.map((profile) => {
        return (
          <View key={profile.id}>
            <View row gap="$3" p="$3" bbw={1} boc="$borderColor">
              <View grow>
                <Text bold>{profile.name}</Text>
                <Text color="$color11">@{profile.slug}</Text>
                {profile.personal_profile_user_id != null && <Text color="$color11">Personal</Text>}
              </View>
              <View row gap="$2">
                <LinkButton href={`/@${profile.slug}`}>
                  <ButtonText>View</ButtonText>
                </LinkButton>
                <LinkButton href={`/dashboard/profiles/${profile.slug}`}>
                  <ButtonText>Manage</ButtonText>
                </LinkButton>
              </View>
            </View>
          </View>
        )
      })}
    </Scroll>
  )
}
