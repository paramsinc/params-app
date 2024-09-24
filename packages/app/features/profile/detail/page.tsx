import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { View } from 'app/ds/View'
import { Calcom } from 'app/features/cal-com/cal-com'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'
import { getConfig } from 'tamagui'

const { useParams } = createParam<{ profileSlug: string }>()

export function ProfileDetailPage() {
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

function Content({ profileSlug }: { profileSlug: string }) {
  const profileQuery = api.profileBySlug.useQuery(
    { slug: profileSlug },
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
        <Calcom.AvailabilitySettings
          enableOverrides={true}
          customClassNames={{
            subtitlesClassName: 'text-red-500',
            ctaClassName: 'border p-4 rounded-md',
            editableHeadingClassName: 'underline font-semibold',
          }}
          onUpdateSuccess={() => {
            console.log('Updated successfully')
          }}
          onUpdateError={() => {
            console.log('update error')
          }}
          onDeleteError={() => {
            console.log('delete error')
          }}
          onDeleteSuccess={() => {
            console.log('Deleted successfully')
          }}
        />
      </View>
      <Calcom.CalendarSettings />
    </Calcom.Provider>
  )
}
