import { Text } from 'app/ds/Text'
import { Button } from 'app/ds/Button'
import { View } from 'app/ds/View'
import { api } from 'app/trpc/client'
import { ErrorCard } from 'app/ds/Error/card'
import useToast from 'app/ds/Toast'
import { Card } from 'app/ds/Form/layout'
import { Lucide } from 'app/ds/Lucide'
import { SignInWithGoogle } from 'app/features/oauth/google/sign-in-with-google'

export function ProfileGoogleCalendarIntegrations({ profileSlug }: { profileSlug: string }) {
  const calendarIntegrations = api.googleIntegrationsByProfileSlug.useQuery(
    {
      profile_slug: profileSlug,
    },
    {
      trpc: {
        context: {
          batch: false,
        },
      },
    }
  )
  const profileQuery = api.profileBySlug.useQuery({ slug: profileSlug })

  const { toast } = useToast()
  const deleteGoogleIntegration = api.deleteProfileGoogleIntegration.useMutation({
    onSuccess: () => {
      toast({ preset: 'done', title: 'Google integration removed' })
    },
  })

  if (!profileQuery.data) {
    return <ErrorCard error={profileQuery.error} />
  }
  const profile = profileQuery.data

  return (
    <Card>
      <Card.Title>Sync Google Calendar</Card.Title>
      <Card.Description>
        Block off your availability based on your Google Calendar events.
      </Card.Description>
      <Card>
        {calendarIntegrations.data?.length === 0 && (
          <Text>
            You don't have any Google Calendar integrations for this profile. Click below to connect
            your Google Calendar.
          </Text>
        )}

        {calendarIntegrations.data?.map((integration) => {
          return (
            <View key={integration.google_user_id} row>
              <View grow gap="$2">
                <Text>{integration.email}</Text>

                <View row gap="$1" flexWrap="wrap">
                  {integration.calendars?.map((calendar) => {
                    if (!calendar.id) {
                      return null
                    }
                    const isSelected = integration.calendars_for_avail_blocking.includes(
                      calendar.id
                    )
                    return (
                      <Button br="$rounded" key={calendar.id} theme={isSelected ? 'green' : 'red'}>
                        <Button.Text>{calendar.summary}</Button.Text>
                      </Button>
                    )
                  })}
                </View>
              </View>
              <Button
                theme="red"
                onPress={() => {
                  deleteGoogleIntegration.mutate({
                    google_user_id: integration.google_user_id,
                    profile_id: profile.id,
                  })
                }}
                square
                loading={
                  deleteGoogleIntegration.isPending &&
                  deleteGoogleIntegration.variables.google_user_id === integration.google_user_id
                }
              >
                <Button.Icon icon={Lucide.Trash} />
              </Button>
            </View>
          )
        })}
      </Card>

      <SignInWithGoogle profileSlug={profileSlug}>
        <Button theme="blue" loading={calendarIntegrations.isPending} als="flex-start">
          <Button.Text>Sign in with Google</Button.Text>
        </Button>
      </SignInWithGoogle>
    </Card>
  )
}

ProfileGoogleCalendarIntegrations.usePrefetch = ({ profileSlug }: { profileSlug: string }) => {
  return api.googleIntegrationsByProfileSlug.usePrefetchQuery({ profile_slug: profileSlug })
}
