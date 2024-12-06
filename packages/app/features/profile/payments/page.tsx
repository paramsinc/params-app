import { Button } from 'app/ds/Button'
import { Card } from 'app/ds/Form/layout'
import { Lucide } from 'app/ds/Lucide'
import { Page } from 'app/ds/Page'
import { View } from 'app/ds/View'
import { ProfileAvailsForm } from 'app/features/profile/detail/avails'
import { ProfilePicker } from 'app/features/profile/picker'
import { ConnectAccountContent } from 'app/features/profile/stripe/connect-account'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'

export type ProfilePaymentsPagequery = {
  profileId: string | undefined
}

const { useParams } = createParam<ProfilePaymentsPagequery>()

export function ProfilePaymentsPage() {
  const myProfiles = api.myProfiles.useQuery()
  const { params, setParams } = useParams()

  let profileId = params.profileId

  if (!profileId) {
    profileId = myProfiles.data?.[0]?.id
  }

  const selectedProfile = myProfiles.data?.find((profile) => profile.id === profileId)

  return (
    <Page.Root grow>
      <Page.Content gap="$3">
        <Card>
          <Card.Title>Payments</Card.Title>
          <Card.Description>View your payments and payouts.</Card.Description>
        </Card>
        <Card>
          <Card.Label>Select a profile</Card.Label>
          <View row jbtwn ai="center">
            <ProfilePicker
              profileId={profileId}
              onChangeProfileId={(profileId) => setParams({ profileId })}
            >
              <Button>
                <Button.Text>{selectedProfile?.name ?? 'Select a profile'}</Button.Text>
                <Button.Icon icon={Lucide.ChevronDown} />
              </Button>
            </ProfilePicker>
          </View>
        </Card>
      </Page.Content>
      <Page.ContentWidthComponent grow>
        {selectedProfile && (
          <ConnectAccountContent profileSlug={selectedProfile.slug} onComplete={() => {}} />
        )}
      </Page.ContentWidthComponent>
    </Page.Root>
  )
}
