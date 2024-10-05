import { Button } from 'app/ds/Button'
import { Page } from 'app/ds/Page'
import { Text } from 'app/ds/Text'
import { SignInWithGoogle } from 'app/features/oauth/google/sign-in-with-google'
import { api } from 'app/trpc/client'

const profileSlug = 'fernando-rojo2'

export function IntegrationsPage() {
  const { data } = api.googleIntegrationsByProfileSlug.useQuery(
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
  const r = api.googleCalendarEventsByProfileSlug.useQuery({
    profile_slug: profileSlug,
    start_date: {
      year: 2024,
      month: 9,
      day: 1,
    },
    end_date: {
      year: 2024,
      month: 10,
      day: 31,
    },
  })

  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content>
          <SignInWithGoogle profileSlug={profileSlug}>
            <Button>
              <Button.Text>Sign in with Google</Button.Text>
            </Button>
          </SignInWithGoogle>
          <Text>{JSON.stringify(r.data, null, 2)}</Text>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}
