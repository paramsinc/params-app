import { Button } from 'app/ds/Button'
import { Page } from 'app/ds/Page'
import { SignInWithGoogle } from 'app/features/oauth/google/sign-in-with-google'

export function IntegrationsPage() {
  return (
    <Page.Root>
      <Page.Scroll>
        <Page.Content>
          <SignInWithGoogle profileSlug="fernando-rojo2">
            <Button>
              <Button.Text>Sign in with Google</Button.Text>
            </Button>
          </SignInWithGoogle>
        </Page.Content>
      </Page.Scroll>
    </Page.Root>
  )
}
