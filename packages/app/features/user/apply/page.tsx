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
import { UserGate } from 'app/features/user/gate'
import { useMe } from 'app/features/user/me/create/use-me'

export function UserApplyPage() {
  const me = useMe()
  return (
    <UserGate>
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
                  To apply as an expert, please submit a pull-request to the Params monorepo with
                  your open source project. Your project should follow the format of other templates
                  in the templates/ folder. If it passes code review, you will be given access to
                  Params.
                </Card.Description>

                <LinkButton
                  target="_blank"
                  als="flex-start"
                  inverse
                  href="https://github.com/paramsinc/params-templates"
                >
                  <ButtonIcon icon={Lucide.Github} />
                  <ButtonText>Submit PR on GitHub</ButtonText>
                </LinkButton>
              </Card>
            )}
          </Page.Content>
        </Scroll>
        <BackgroundGradient />
      </View>
    </UserGate>
  )
}

export function ApplyGatePage({ children }: { children: React.ReactNode }) {
  const me = useMe()
  return <>{me.data?.can_create_profiles ? children : <UserApplyPage />}</>
}
