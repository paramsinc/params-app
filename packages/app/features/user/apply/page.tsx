import { ButtonIcon, ButtonText } from 'app/ds/Button'
import { LinkButton } from 'app/ds/Button/link'
import { Card } from 'app/ds/Form/layout'
import { BackgroundGradient } from 'app/ds/Gradient/BackgroundGradient'
import { Lucide } from 'app/ds/Lucide'
import { Page } from 'app/ds/Page'
import { Scroll } from 'app/ds/Scroll'
import { Text } from 'app/ds/Text'
import { TextLink } from 'app/ds/TextLink'
import { View } from 'app/ds/View'
import { env } from 'app/env'
import { TwitterIcon } from 'app/features/home/TwitterIcon'
import { useMe } from 'app/features/user/me/create/use-me'

export function UserApplyPage() {
  const me = useMe()
  return (
    <View grow>
      <Scroll centerContent>
        <Page.Content maxWidth={700}>
          {me.data?.can_create_profiles ? (
            <Card theme="green">
              <Lucide.CheckCircle color="$color11" size={20} />
              <Card.Title>Welcome to {env.APP_NAME}</Card.Title>
              <Card.Description>
                You have been approved as an expert. Please create your profile and repo to get
                started.
              </Card.Description>

              <LinkButton href="/new" inverse als="flex-start">
                <ButtonText>Create Repo</ButtonText>
              </LinkButton>
            </Card>
          ) : (
            <Card>
              <Card.Title>Apply as an expert</Card.Title>
              <Card.Description>
                {env.APP_NAME} is invite-only for experts. To apply, please follow &{' '}
                <a target="_blank" href={`https://x.com/@${env.TWITTER_HANDLE}`}>
                  <Card.Description bold textDecorationLine="underline">
                    DM @{env.TWITTER_HANDLE}
                  </Card.Description>
                </a>{' '}
                on X (aka Twitter) with the GitHub repository you'd like to share.
              </Card.Description>

              <LinkButton
                target="_blank"
                als="flex-start"
                inverse
                href={`https://x.com/@${env.TWITTER_HANDLE}`}
              >
                {/* <ButtonIcon icon={TwitterIcon} /> */}
                <ButtonText>Apply via X</ButtonText>
              </LinkButton>
            </Card>
          )}
        </Page.Content>
      </Scroll>
      <BackgroundGradient />
    </View>
  )
}

export function ApplyGatePage({ children }: { children: React.ReactNode }) {
  const me = useMe()
  return <>{me.data?.can_create_profiles ? children : <UserApplyPage />}</>
}
