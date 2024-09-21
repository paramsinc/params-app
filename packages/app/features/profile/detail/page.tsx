import { Calcom } from 'app/features/cal-com/cal-com'
import { CalcomProvider } from 'app/features/cal-com/provider'
import { createParam } from 'app/navigation/use-params'
import { api } from 'app/trpc/client'
import { getConfig } from 'tamagui'

const { useParams } = createParam<{ profileSlug: string }>()

export function ProfileDetailPage() {
  const { params } = useParams()

  return <Content profileSlug={params.profileSlug} />
}

console.log('[tamagui-config]', getConfig())

function Content({ profileSlug }: { profileSlug: string }) {
  const calUserQuery = api.calUserByProfileSlug.useQuery(
    { profileSlug },
    {
      enabled: !!profileSlug,
    }
  )
  return (
    <Calcom.Provider profileSlug={profileSlug}>
      {calUserQuery.data && (
        <Calcom.Booker
          eventSlug="sixty-minutes-video"
          username={calUserQuery.data.username}
          hideBranding
        />
      )}
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
      <Calcom.CalendarSettings />
    </Calcom.Provider>
  )
}
