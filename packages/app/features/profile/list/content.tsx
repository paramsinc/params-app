import { Button, ButtonIcon, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Link } from 'app/ds/Link'
import { Lucide } from 'app/ds/Lucide'
import { Page } from 'app/ds/Page'
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

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content gap="$3">
          {myProfiles.data ? (
            <>
              <Card row ai="center">
                <Card.Title flex={1}>My Profiles</Card.Title>

                <NewProfileModal>
                  <NewProfileModalTrigger>
                    <Button absolute right={0} m="$2" themeInverse>
                      <ButtonIcon icon={Lucide.Plus} />
                      <ButtonText>New</ButtonText>
                    </Button>
                  </NewProfileModalTrigger>
                  <NewProfileModalContent />
                </NewProfileModal>
              </Card>

              <View gap="$1">
                {myProfiles.data?.map((profile) => (
                  <Card key={profile.id} row gap="$3" ai="center">
                    <View grow jc="center">
                      <View gap="$2">
                        <Link href={`/@${profile.slug}`}>
                          <Card.Title fontFamily="$mono">@{profile.slug}</Card.Title>
                        </Link>
                        <Card.Description>
                          {profile.personal_profile_user_id != null
                            ? 'Personal Profile'
                            : 'Team Profile'}
                        </Card.Description>
                      </View>
                    </View>

                    <View row gap="$1">
                      <LinkButton href={`/@${profile.slug}`}>
                        <ButtonText>View</ButtonText>
                      </LinkButton>
                      <LinkButton href={`/dashboard/profiles/${profile.slug}`}>
                        <ButtonText>Edit</ButtonText>
                      </LinkButton>
                    </View>
                  </Card>
                ))}
              </View>
            </>
          ) : (
            <ErrorCard error={myProfiles.error} />
          )}
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}
