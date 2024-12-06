import { Card } from 'app/ds/Form/layout'
import { ProfileAvailsForm } from 'app/features/profile/detail/avails'

export type ProfileAvailabilityPageQuery = {
  profileId: string | undefined
}

const { useParams } = createParam<ProfileAvailabilityPageQuery>()

export function ProfilePaymentsPage() {
  const myProfiles = api.myProfiles.useQuery()
  const { params, setParams } = useParams()

  let profileId = params.profileId

  if (!profileId) {
    profileId = myProfiles.data?.[0]?.id
  }

  const selectedProfile = myProfiles.data?.find((profile) => profile.id === profileId)

  return (
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
  )
}
