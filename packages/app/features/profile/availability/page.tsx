import { Button } from 'app/ds/Button'
import { ErrorCard } from 'app/ds/Error/card'
import { Card } from 'app/ds/Form/layout'
import { Lucide } from 'app/ds/Lucide'
import { Page } from 'app/ds/Page'
import { View } from 'app/ds/View'
import { ProfileAvailsForm } from 'app/features/profile/detail/avails'
import { ProfileGoogleCalendarIntegrations } from 'app/features/profile/detail/calendar-integrations'
import { ProfilePicker } from 'app/features/profile/picker'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'

export type ProfileAvailabilityPageQuery = {
  profileId: string | undefined
}

const { useParams } = createParam<ProfileAvailabilityPageQuery>()

export function ProfileAvailabilityPage() {
  const myProfiles = api.myProfiles.useQuery()
  const { params, setParams } = useParams()

  let profileId = params.profileId

  if (!profileId) {
    profileId = myProfiles.data?.[0]?.id
  }

  const selectedProfile = myProfiles.data?.find((profile) => profile.id === profileId)

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content gap="$3">
          <Card>
            <Card.Title>My Availability</Card.Title>
          </Card>

          {myProfiles.data ? (
            <>
              <Card>
                <ProfileAvailsForm.Provider profileSlug={selectedProfile?.slug ?? ''}>
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
                    <View ai="flex-start">
                      <ProfileAvailsForm.Submit />
                    </View>
                  </View>

                  <ProfileAvailsForm />
                </ProfileAvailsForm.Provider>
              </Card>

              {selectedProfile && (
                <ProfileGoogleCalendarIntegrations profileSlug={selectedProfile.slug} />
              )}
            </>
          ) : (
            <ErrorCard error={myProfiles.error} />
          )}
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}
